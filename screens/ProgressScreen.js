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
import { getUserProgressWithSettings } from '../utils/storage';

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
    scheduledReviews: 0,
    allocatedNewWords: 0,
  });
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
      const progressData = await getUserProgressWithSettings();
      setProgress(progressData);
    } catch (error) {
      console.error('Error loading progress data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
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

        {/* Today's Due Words Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Due Words Breakdown</Text>
          <Text style={styles.sectionSubtitle}>New words vs review words</Text>
          
          <View style={styles.todayBreakdownGrid}>
            <View style={styles.todayBreakdownCard}>
              <Ionicons name="add-circle" size={28} color="#10b981" />
              <Text style={styles.todayBreakdownNumber}>{progress.allocatedNewWords || 0}</Text>
              <Text style={styles.todayBreakdownLabel}>New Words</Text>
            </View>

            <View style={styles.todayBreakdownCard}>
              <Ionicons name="refresh-circle" size={28} color="#f59e0b" />
              <Text style={styles.todayBreakdownNumber}>{progress.scheduledReviews || 0}</Text>
              <Text style={styles.todayBreakdownLabel}>Reviews</Text>
            </View>

            <View style={styles.todayBreakdownCard}>
              <Ionicons name="calendar-outline" size={28} color="#6366f1" />
              <Text style={styles.todayBreakdownNumber}>{progress.dueToday}</Text>
              <Text style={styles.todayBreakdownLabel}>Total Due</Text>
            </View>
          </View>
        </View>

        {/* Word Lists */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Word Lists</Text>
          <Text style={styles.sectionSubtitle}>Explore your vocabulary by category</Text>
          
          <View style={styles.wordListsGrid}>
            <TouchableOpacity 
              style={[styles.wordListCard, { backgroundColor: '#06b6d4' }]}
              onPress={() => navigation.navigate('RecentWords')}
              activeOpacity={0.8}
            >
              <Ionicons name="time" size={32} color="white" />
              <Text style={styles.wordListTitle}>Recent Words</Text>
              <Text style={styles.wordListDescription}>Recently reviewed words</Text>
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.wordListCard, { backgroundColor: '#ef4444' }]}
              onPress={() => navigation.navigate('MostDifficultWords')}
              activeOpacity={0.8}
            >
              <Ionicons name="warning" size={32} color="white" />
              <Text style={styles.wordListTitle}>Most Difficult</Text>
              <Text style={styles.wordListDescription}>Words needing practice</Text>
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
          </View>
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

  todayBreakdownGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  todayBreakdownCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    marginHorizontal: 4,
  },
  todayBreakdownNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginVertical: 8,
  },
  todayBreakdownLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  wordListsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  wordListCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
  },
  wordListTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  wordListDescription: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 12,
  },
}); 