import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getVocabularyWords, updateWordStatus, getCurrentWordIndex, saveCurrentWordIndex } from '../utils/storage';

const { width, height } = Dimensions.get('window');

export default function WordViewScreen({ navigation }) {
  const [words, setWords] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentWord, setCurrentWord] = useState(null);
  const [showDefinition, setShowDefinition] = useState(false);

  useEffect(() => {
    loadWords();
  }, []);

  useEffect(() => {
    if (words.length > 0) {
      setCurrentWord(words[currentIndex]);
      setShowDefinition(false); // Reset definition visibility when word changes
      // Save current index whenever it changes
      saveCurrentWordIndex(currentIndex);
    }
  }, [words, currentIndex]);

  const loadWords = async () => {
    try {
      const vocabularyData = await getVocabularyWords();
      const savedIndex = await getCurrentWordIndex();
      
      setWords(vocabularyData);
      
      // Set the current index to the saved position, but ensure it's valid
      if (savedIndex < vocabularyData.length) {
        setCurrentIndex(savedIndex);
      } else {
        setCurrentIndex(0);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading words:', error);
      setLoading(false);
    }
  };

  const handleWordAction = async (action) => {
    if (!currentWord) return;

    try {
      const newStatus = action === 'know' ? 'known' : 'review';
      await updateWordStatus(currentWord.id, newStatus);
      
      // Update local state
      const updatedWords = words.map(word => 
        word.id === currentWord.id ? { ...word, status: newStatus } : word
      );
      setWords(updatedWords);

      // Move to next word or finish
      if (currentIndex < words.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        // Finished all words
        Alert.alert(
          'Great Job!',
          'You\'ve reviewed all the vocabulary words! 🎉',
          [
            {
              text: 'Go Home',
              onPress: () => navigation.goBack(),
            },
            {
              text: 'Review Again',
              onPress: () => setCurrentIndex(0),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error updating word status:', error);
      Alert.alert('Error', 'Failed to update word status. Please try again.');
    }
  };

  const handleShowDefinition = () => {
    setShowDefinition(true);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="book" size={60} color="#6366f1" />
          <Text style={styles.loadingText}>Loading vocabulary...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentWord) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle" size={60} color="#ef4444" />
          <Text style={styles.loadingText}>No words available</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#f8fafc', '#e2e8f0', '#cbd5e1']}
        style={styles.gradient}
      >
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${((currentIndex + 1) / words.length) * 100}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {currentIndex + 1} / {words.length}
          </Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Word Card */}
          <View style={styles.wordCard}>
            {/* Word Header */}
            <View style={styles.wordHeader}>
              <Text style={styles.word}>{currentWord.word}</Text>
              <View style={styles.partOfSpeechContainer}>
                <Text style={styles.partOfSpeech}>{currentWord.partOfSpeech}</Text>
              </View>
            </View>

            {/* Image Placeholder */}
            <View style={styles.imageContainer}>
              <Ionicons name="image" size={80} color="#94a3b8" />
              <Text style={styles.imagePlaceholder}>
                Humorous Image Placeholder
              </Text>
              <Text style={styles.imageNote}>
                Midjourney-generated image for "{currentWord.word}"
              </Text>
            </View>

            {/* Show Definition Button or Definition/Example */}
            {!showDefinition ? (
              <View style={styles.revealSection}>
                <TouchableOpacity
                  style={styles.showDefinitionButton}
                  onPress={handleShowDefinition}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#6366f1', '#8b5cf6']}
                    style={styles.showDefinitionGradient}
                  >
                    <Ionicons name="eye" size={24} color="white" />
                    <Text style={styles.showDefinitionText}>Show Definition</Text>
                  </LinearGradient>
                </TouchableOpacity>
                
                <Text style={styles.instructionText}>
                  Try to guess the meaning first, then reveal the definition!
                </Text>
              </View>
            ) : (
              <View style={styles.definitionRevealedSection}>
                {/* Definition */}
                <View style={styles.definitionSection}>
                  <Text style={styles.sectionTitle}>Definition</Text>
                  <Text style={styles.definition}>{currentWord.definition}</Text>
                </View>

                {/* Example */}
                <View style={styles.exampleSection}>
                  <Text style={styles.sectionTitle}>Example</Text>
                  <Text style={styles.example}>"{currentWord.example}"</Text>
                </View>
              </View>
            )}

            {/* Status Indicator */}
            <View style={styles.statusContainer}>
              <View style={[
                styles.statusIndicator,
                currentWord.status === 'known' && styles.statusKnown,
                currentWord.status === 'review' && styles.statusReview,
                currentWord.status === 'new' && styles.statusNew,
              ]}>
                <Text style={styles.statusText}>
                  {currentWord.status === 'known' ? '✅ Known' : 
                   currentWord.status === 'review' ? '🔄 Review' : '📝 New'}
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons - Only show if definition is revealed */}
          {showDefinition && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.reviewButton]}
                onPress={() => handleWordAction('review')}
                activeOpacity={0.8}
              >
                <Ionicons name="refresh-circle" size={24} color="white" />
                <Text style={styles.actionButtonText}>🔁 Review Later</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.knowButton]}
                onPress={() => handleWordAction('know')}
                activeOpacity={0.8}
              >
                <Ionicons name="checkmark-circle" size={24} color="white" />
                <Text style={styles.actionButtonText}>✅ I Know This</Text>
              </TouchableOpacity>
            </View>
          )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#64748b',
    marginTop: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  wordCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    marginVertical: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  wordHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  word: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  partOfSpeechContainer: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  partOfSpeech: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
  },
  imageContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    marginBottom: 24,
  },
  imagePlaceholder: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 12,
    fontWeight: '600',
  },
  imageNote: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
    fontStyle: 'italic',
  },
  revealSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  showDefinitionButton: {
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    marginBottom: 16,
  },
  showDefinitionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
  },
  showDefinitionText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  definitionRevealedSection: {
    marginBottom: 24,
  },
  definitionSection: {
    marginBottom: 20,
  },
  exampleSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
  },
  definition: {
    fontSize: 16,
    color: '#4b5563',
    lineHeight: 24,
  },
  example: {
    fontSize: 16,
    color: '#4b5563',
    lineHeight: 24,
    fontStyle: 'italic',
  },
  statusContainer: {
    alignItems: 'center',
  },
  statusIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
  },
  statusKnown: {
    backgroundColor: '#d1fae5',
  },
  statusReview: {
    backgroundColor: '#fef3c7',
  },
  statusNew: {
    backgroundColor: '#dbeafe',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 4,
    marginBottom: 20,
  },
  actionButton: {
    flex: 0.48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  reviewButton: {
    backgroundColor: '#f59e0b',
  },
  knowButton: {
    backgroundColor: '#10b981',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
}); 