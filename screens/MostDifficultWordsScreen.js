import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getMostDifficultWords } from '../utils/storage';

export default function MostDifficultWordsScreen({ navigation }) {
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadWords();
    });

    loadWords();

    return unsubscribe;
  }, [navigation]);

  const loadWords = async () => {
    try {
      setLoading(true);
      const difficultWords = await getMostDifficultWords(20); // Get top 20 most difficult words
      setWords(difficultWords);
    } catch (error) {
      console.error('Error loading most difficult words:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWords();
    setRefreshing(false);
  };



  const getPerformanceColor = (word) => {
    const lastGrade = word.fsrs?.lastGrade || 0;
    if (lastGrade <= 1) return '#ef4444'; // Forgot - Red
    if (lastGrade === 2) return '#f59e0b'; // Hard - Orange
    if (lastGrade === 3) return '#10b981'; // Good - Green
    return '#06b6d4'; // Easy - Blue
  };

  const getLastGradeText = (grade) => {
    switch(grade) {
      case 1: return 'Forgot';
      case 2: return 'Hard';
      case 3: return 'Good';
      case 4: return 'Easy';
      default: return 'New';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now - date;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString();
  };

  const handleWordPress = (word) => {
    // Navigate to WordView with this specific word
    navigation.navigate('HomeStack', { 
      screen: 'WordView', 
      params: { specificWord: word } 
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#ef4444', '#dc2626', '#b91c1c']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Most Difficult Words</Text>
          <Text style={styles.headerSubtitle}>Words that need more practice</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading difficult words...</Text>
          </View>
        ) : words.length > 0 ? (
          <View style={styles.wordsContainer}>
            <Text style={styles.wordsCount}>
              {words.length} words ranked by difficulty
            </Text>
            {words.map((word, index) => (
              <TouchableOpacity
                key={word.id}
                style={styles.wordCard}
                onPress={() => handleWordPress(word)}
                activeOpacity={0.7}
              >
                <View style={styles.wordHeader}>
                  <View style={styles.wordInfo}>
                    <Text style={styles.wordText}>{word.word}</Text>
                    <Text style={styles.partOfSpeech}>{word.partOfSpeech}</Text>
                  </View>
                  <View style={styles.wordMeta}>
                    <Text style={styles.rankText}>#{index + 1}</Text>
                  </View>
                </View>
                
                <Text style={styles.definition}>{word.definition}</Text>
                
                <View style={styles.statsContainer}>
                  <View style={styles.statRow}>
                    <View style={styles.statItem}>
                      <Ionicons name="analytics" size={16} color="#6b7280" />
                      <Text style={styles.statText}>
                        Difficulty: {(word.fsrs?.difficulty || 0).toFixed(1)}
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <Ionicons name="repeat" size={16} color="#6b7280" />
                      <Text style={styles.statText}>
                        {word.fsrs?.reviewCount || 0} reviews
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.statRow}>
                    <View style={styles.lastReviewContainer}>
                      <Ionicons name="time" size={16} color="#6b7280" />
                      <Text style={styles.statText}>
                        Last reviewed: {formatDate(word.fsrs?.lastReviewDate)}
                      </Text>
                      <Text style={styles.parenthesesText}> (</Text>
                      <View style={[
                        styles.performanceBadge,
                        { backgroundColor: getPerformanceColor(word) }
                      ]}>
                        <Text style={styles.performanceText}>
                          {getLastGradeText(word.fsrs?.lastGrade)}
                        </Text>
                      </View>
                      <Text style={styles.parenthesesText}>)</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="trophy-outline" size={64} color="#9ca3af" />
            <Text style={styles.emptyTitle}>No Difficult Words</Text>
            <Text style={styles.emptyText}>
              You haven't reviewed enough words yet to identify difficult ones. Keep learning!
            </Text>
            <TouchableOpacity
              style={styles.startButton}
              onPress={() => navigation.navigate('HomeStack', { screen: 'WordView' })}
            >
              <Text style={styles.startButtonText}>Start Learning</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 30,
  },
  header: {
    paddingHorizontal: 20,
  },
  backButton: {
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  wordsContainer: {
    padding: 20,
  },
  wordsCount: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 20,
    textAlign: 'center',
  },
  wordCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  wordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  wordInfo: {
    flex: 1,
  },
  wordText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  partOfSpeech: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  wordMeta: {
    alignItems: 'flex-end',
  },
  lastReviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  parenthesesText: {
    fontSize: 14,
    color: '#6b7280',
  },
  performanceBadge: {
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  performanceText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  rankText: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
  definition: {
    fontSize: 16,
    color: '#4b5563',
    lineHeight: 24,
    marginBottom: 16,
  },
  statsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 6,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  startButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
}); 