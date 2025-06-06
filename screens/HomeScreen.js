import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getUserProgress } from '../utils/storage';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const [progress, setProgress] = useState({
    totalWords: 0,
    dueToday: 0,
    dueTomorrow: 0,
    dueThisWeek: 0,
    reviewedWords: 0,
    totalReviews: 0,
    accuracy: 0,
  });

  useEffect(() => {
    const loadProgress = async () => {
      const progressData = await getUserProgress();
      setProgress(progressData);
    };

    const unsubscribe = navigation.addListener('focus', () => {
      loadProgress();
    });

    loadProgress();

    return unsubscribe;
  }, [navigation]);

  const handleStartLearning = () => {
    navigation.navigate('WordView');
  };

  const handleViewProgress = () => {
    navigation.navigate('Progress');
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#6366f1', '#8b5cf6', '#a855f7']}
        style={styles.gradient}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="book" size={50} color="white" />
            </View>
            <Text style={styles.appTitle}>VocabMaster</Text>
            <Text style={styles.appSubtitle}>Learn vocabulary with spaced repetition!</Text>
          </View>

          {/* Main Actions */}
          <View style={styles.actionsContainer}>
            {/* Start Learning Button */}
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleStartLearning}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#ffffff', '#f8fafc']}
                style={styles.primaryButtonGradient}
              >
                <Ionicons name="play-circle" size={32} color="#6366f1" />
                <Text style={styles.primaryButtonText}>Start Learning</Text>
                <Ionicons name="arrow-forward" size={24} color="#6366f1" />
              </LinearGradient>
            </TouchableOpacity>

            {/* View Progress Button */}
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleViewProgress}
              activeOpacity={0.8}
            >
              <View style={styles.secondaryButtonContent}>
                <Ionicons name="stats-chart" size={28} color="white" />
                <Text style={styles.secondaryButtonText}>View Progress</Text>
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.8)" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Quick Stats */}
          <View style={styles.quickStats}>
            <Text style={styles.quickStatsTitle}>Today's Learning</Text>
            <View style={styles.dueWordsContainer}>
              <Ionicons name="today" size={32} color="rgba(255,255,255,0.9)" />
              <Text style={styles.dueWordsNumber}>{progress.dueToday}</Text>
              <Text style={styles.dueWordsLabel}>words due today</Text>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 30,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  appTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  appSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  actionsContainer: {
    marginVertical: 20,
  },
  primaryButton: {
    marginBottom: 16,
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
    paddingVertical: 20,
    borderRadius: 16,
  },
  primaryButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6366f1',
    flex: 1,
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  secondaryButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 18,
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  quickStats: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginVertical: 20,
  },
  quickStatsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 16,
    textAlign: 'center',
  },
  dueWordsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dueWordsNumber: {
    fontSize: 24,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginHorizontal: 8,
  },
  dueWordsLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
}); 