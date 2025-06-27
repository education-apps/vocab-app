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
import { getRecentWords } from '../utils/storage';

export default function RecentWordsScreen({ navigation }) {
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
      const recentWords = await getRecentWords(); // Get words reviewed in last 24 hours
      setWords(recentWords);
    } catch (error) {
      console.error('Error loading recent words:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWords();
    setRefreshing(false);
  };

  const getGradeColor = (grade) => {
    switch(grade) {
      case 1: return '#ef4444'; // Forgot - Red
      case 2: return '#f59e0b'; // Hard - Orange  
      case 3: return '#10b981'; // Good - Green
      case 4: return '#06b6d4'; // Easy - Blue
      default: return '#6b7280'; // Unknown - Gray
    }
  };

  const getGradeText = (grade) => {
    switch(grade) {
      case 1: return 'Forgot';
      case 2: return 'Hard';
      case 3: return 'Good'; 
      case 4: return 'Easy';
      default: return 'Not reviewed';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now - date;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
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
        colors={['#06b6d4', '#0891b2', '#0e7490']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Recent Words</Text>
          <Text style={styles.headerSubtitle}>Words you've recently reviewed</Text>
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
            <Text style={styles.loadingText}>Loading recent words...</Text>
          </View>
        ) : words.length > 0 ? (
          <View style={styles.wordsContainer}>
            <Text style={styles.wordsCount}>
              {words.length} recently reviewed words
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
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: getGradeColor(word.fsrs?.lastGrade || 0) }
                    ]}>
                      <Text style={styles.statusText}>
                        {getGradeText(word.fsrs?.lastGrade || 0)}
                      </Text>
                    </View>
                    <Text style={styles.positionText}>#{index + 1}</Text>
                  </View>
                </View>
                
                <Text style={styles.definition}>{word.definition}</Text>
                
                <View style={styles.wordStats}>
                  <View style={styles.statItem}>
                    <Ionicons name="repeat" size={16} color="#6b7280" />
                    <Text style={styles.statText}>
                      {word.fsrs?.reviewCount || 0} reviews
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Ionicons name="time" size={16} color="#6b7280" />
                    <Text style={styles.statText}>
                      {formatDate(word.fsrs?.lastReviewDate)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="time-outline" size={64} color="#9ca3af" />
            <Text style={styles.emptyTitle}>No Recent Activity</Text>
            <Text style={styles.emptyText}>
              You haven't reviewed any words yet. Start learning to see your recent activity here!
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
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  positionText: {
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
  wordStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
    backgroundColor: '#10b981',
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