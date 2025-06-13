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
import { getUserProgressWithSettings, getRecentWords } from '../utils/storage';

export default function ProgressScreen({ navigation }) {
  const [progress, setProgress] = useState({
    totalWords: 0,
    dueToday: 0,
    dueTomorrow: 0,
    dueThisWeek: 0,
    reviewedWords: 0,
    totalReviews: 0,
    averageReviews: 0,
    retentionRate: 0,
    accuracy: 0,
  });
  const [recentWords, setRecentWords] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });

    loadData();

    return unsubscribe;
  }, [navigation]);

  const loadData = async () => {
    try {
      const [progressData, recentWordsData] = await Promise.all([
        getUserProgressWithSettings(),
        getRecentWords(),
      ]);
      setProgress(progressData);
      setRecentWords(recentWordsData);
    } catch (error) {
      console.error('Error loading progress data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
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

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#6366f1', '#8b5cf6', '#a855f7']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Your Progress</Text>
          <Text style={styles.headerSubtitle}>Track your vocabulary journey</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Overall Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overall Statistics</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="library" size={32} color="#6366f1" />
              </View>
              <Text style={styles.statNumber}>{progress.totalWords}</Text>
              <Text style={styles.statLabel}>Total Words</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="checkmark-circle" size={32} color="#10b981" />
              </View>
              <Text style={styles.statNumber}>{progress.reviewedWords}</Text>
              <Text style={styles.statLabel}>Words Learned</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="trending-up" size={32} color="#8b5cf6" />
              </View>
              <Text style={styles.statNumber}>{progress.accuracy}%</Text>
              <Text style={styles.statLabel}>Accuracy</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="refresh-circle" size={32} color="#f59e0b" />
              </View>
              <Text style={styles.statNumber}>{progress.dueToday}</Text>
              <Text style={styles.statLabel}>Due Today</Text>
            </View>
          </View>
        </View>

        {/* Progress Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Progress Breakdown</Text>
          
          <View style={styles.progressBreakdown}>
            <View style={styles.progressRow}>
              <View style={styles.progressInfo}>
                <View style={[styles.progressDot, { backgroundColor: '#10b981' }]} />
                <Text style={styles.progressText}>Reviewed Words</Text>
              </View>
              <Text style={styles.progressNumber}>{progress.reviewedWords}</Text>
            </View>

            <View style={styles.progressRow}>
              <View style={styles.progressInfo}>
                <View style={[styles.progressDot, { backgroundColor: '#f59e0b' }]} />
                <Text style={styles.progressText}>Due Today</Text>
              </View>
              <Text style={styles.progressNumber}>{progress.dueToday}</Text>
            </View>

            <View style={styles.progressRow}>
              <View style={styles.progressInfo}>
                <View style={[styles.progressDot, { backgroundColor: '#6366f1' }]} />
                <Text style={styles.progressText}>Not Reviewed</Text>
              </View>
              <Text style={styles.progressNumber}>{progress.totalWords - progress.reviewedWords}</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressSegment,
                  { 
                    width: `${progress.totalWords > 0 ? (progress.reviewedWords / progress.totalWords) * 100 : 0}%`,
                    backgroundColor: '#10b981',
                    borderTopLeftRadius: 8,
                    borderBottomLeftRadius: 8,
                  }
                ]} 
              />
              <View 
                style={[
                  styles.progressSegment,
                  { 
                    width: `${progress.totalWords > 0 ? (progress.dueToday / progress.totalWords) * 100 : 0}%`,
                    backgroundColor: '#f59e0b',
                  }
                ]} 
              />
              <View 
                style={[
                  styles.progressSegment,
                  { 
                    width: `${progress.totalWords > 0 ? ((progress.totalWords - progress.reviewedWords - progress.dueToday) / progress.totalWords) * 100 : 0}%`,
                    backgroundColor: '#6366f1',
                    borderTopRightRadius: 8,
                    borderBottomRightRadius: 8,
                  }
                ]} 
              />
            </View>
          </View>
        </View>

        {/* Spaced Repetition */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Spaced Repetition Schedule</Text>
          <Text style={styles.sectionSubtitle}>Based on FSRS algorithm</Text>
          
          <View style={styles.spacedRepetitionGrid}>
            <View style={styles.spacedRepetitionCard}>
              <Ionicons name="calendar-outline" size={24} color="#6366f1" />
              <Text style={styles.spacedRepetitionNumber}>{progress.dueToday}</Text>
              <Text style={styles.spacedRepetitionLabel}>Due Today</Text>
            </View>

            <View style={styles.spacedRepetitionCard}>
              <Ionicons name="calendar" size={24} color="#8b5cf6" />
              <Text style={styles.spacedRepetitionNumber}>{progress.dueTomorrow}</Text>
              <Text style={styles.spacedRepetitionLabel}>Due Tomorrow</Text>
            </View>

            <View style={styles.spacedRepetitionCard}>
              <Ionicons name="calendar-sharp" size={24} color="#a855f7" />
              <Text style={styles.spacedRepetitionNumber}>{progress.dueThisWeek}</Text>
              <Text style={styles.spacedRepetitionLabel}>Due This Week</Text>
            </View>
          </View>
        </View>

        {/* Recent Words */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Words</Text>
          
          {recentWords.length > 0 ? (
            <View style={styles.recentWordsContainer}>
              {recentWords.map((word) => (
                <View key={word.id} style={styles.recentWordCard}>
                  <View style={styles.recentWordHeader}>
                    <Text style={styles.recentWordText}>{word.word}</Text>
                    <View style={[
                      styles.recentWordStatus,
                      { backgroundColor: getGradeColor(word.fsrs?.lastGrade || 0) }
                    ]}>
                      <Text style={styles.recentWordStatusText}>
                        {getGradeText(word.fsrs?.lastGrade || 0)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.recentWordDefinition}>
                    {word.definition}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="book-outline" size={48} color="#94a3b8" />
              <Text style={styles.emptyStateText}>
                No recent activity yet. Start learning some words!
              </Text>
              <TouchableOpacity
                style={styles.startLearningButton}
                onPress={() => navigation.navigate('HomeStack', { screen: 'WordView' })}
              >
                <Text style={styles.startLearningButtonText}>Start Learning</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
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
    alignItems: 'center',
    paddingHorizontal: 20,
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
    backgroundColor: '#f8fafc',
  },
  section: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginVertical: 10,
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    marginBottom: 12,
  },
  statIconContainer: {
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  progressBreakdown: {
    marginBottom: 20,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  progressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  progressText: {
    fontSize: 16,
    color: '#374151',
  },
  progressNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  progressBarContainer: {
    marginTop: 12,
  },
  progressBar: {
    flexDirection: 'row',
    height: 16,
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    overflow: 'hidden',
  },
  progressSegment: {
    height: '100%',
  },
  spacedRepetitionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  spacedRepetitionCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    marginHorizontal: 4,
  },
  spacedRepetitionNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginVertical: 8,
  },
  spacedRepetitionLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  recentWordsContainer: {
    marginTop: 8,
  },
  recentWordCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  recentWordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recentWordText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  recentWordStatus: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  recentWordStatusText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  recentWordDefinition: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginVertical: 16,
    lineHeight: 24,
  },
  startLearningButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  startLearningButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
}); 