import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Audio from 'expo-audio';
import * as Speech from 'expo-speech';

import { getDueWordsForReview, processFsrsReview, getSettings } from '../utils/storage.js';
import { Grade } from '../utils/fsrs.js';

const { width: screenWidth } = Dimensions.get('window');

export default function WordViewScreen({ navigation }) {
  const [words, setWords] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showDefinition, setShowDefinition] = useState(false);
  const [currentMode, setCurrentMode] = useState('humorous'); // 'humorous' or 'formal'
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    loadData();
    
    // Listen for when screen comes into focus (e.g., returning from settings)
    const unsubscribeFocus = navigation.addListener('focus', () => {
      loadSettings(); // Reload settings when coming back to this screen
    });

    // Listen for when screen loses focus
    const unsubscribeBlur = navigation.addListener('blur', async () => {
      // Stop any ongoing speech when leaving the screen
      if (await Speech.isSpeakingAsync()) {
        await Speech.stop();
        setIsSpeaking(false);
      }
    });
    
    return () => {
      // Stop any ongoing speech when component unmounts
      Speech.stop();
      unsubscribeFocus();
      unsubscribeBlur();
    };
  }, [navigation]);

  const loadData = async () => {
    try {
      await loadWords();
      await loadSettings();
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load vocabulary words. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadWords = async () => {
    try {
      let wordList;
      const route = navigation.getState()?.routes?.find(r => r.name === 'WordView');
      const source = route?.params?.source;
      
      if (source === 'due') {
        wordList = await getDueWordsForReview();
      } else {
        // Default to due words if no specific source
        wordList = await getDueWordsForReview();
      }
      
      if (wordList && wordList.length > 0) {
        setWords(wordList);
        setCurrentIndex(0);
      } else {
        // No words available
        setWords([]);
      }
    } catch (error) {
      console.error('Error loading words:', error);
      throw error;
    }
  };

  const loadSettings = async () => {
    try {
      const settings = await getSettings();
      setCurrentMode(settings.imageMood || 'humorous');
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const playAudio = async (audioPath) => {
    try {
      console.log('Playing audio:', audioPath);
      // For now, just log the audio path since we don't have actual audio files
      Alert.alert('Audio', `Playing: ${audioPath}`);
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  const speakText = async (text, options = {}) => {
    try {
      // Stop any currently playing speech
      if (await Speech.isSpeakingAsync()) {
        await Speech.stop();
        setIsSpeaking(false);
        return;
      }
      
      // Default speech options
      const speechOptions = {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.8,
        ...options,
        onStart: () => setIsSpeaking(true),
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false)
      };
      
      // Speak the text
      await Speech.speak(text, speechOptions);
    } catch (error) {
      console.error('Error with text-to-speech:', error);
      setIsSpeaking(false);
      Alert.alert('Error', 'Could not play text-to-speech');
    }
  };

  const handleShowDefinition = () => {
    setShowDefinition(true);
  };

  const handleFsrsGrade = async (grade) => {
    try {
      const currentWord = words[currentIndex];
      if (!currentWord) return;
      
      // Process the review using real FSRS algorithm
      const reviewedWord = await processFsrsReview(currentWord.id, grade);
      
      // Update local state
      const updatedWords = words.map(word => 
        word.id === currentWord.id ? reviewedWord : word
      );
      setWords(updatedWords);

      // Stop any ongoing speech before moving to next word
      if (await Speech.isSpeakingAsync()) {
        await Speech.stop();
        setIsSpeaking(false);
      }

      // Move to next word or finish
      if (currentIndex < words.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setShowDefinition(false); // Reset for next word
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
              onPress: () => {
                setCurrentIndex(0);
                setShowDefinition(false);
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error processing FSRS grade:', error);
      Alert.alert('Error', 'Failed to record review. Please try again.');
    }
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

  if (!words.length || !words[currentIndex]) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="checkmark-circle" size={60} color="#10b981" />
          <Text style={styles.loadingText}>All caught up!</Text>
          <Text style={styles.loadingSubtext}>No words due for review right now.</Text>
          <TouchableOpacity 
            style={styles.goHomeButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.goHomeButtonText}>Go Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentWord = words[currentIndex];
  // Get mode-specific data
  const modeData = currentWord.modes && currentWord.modes[currentMode] ? currentWord.modes[currentMode] : null;

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
          {/* Mode Indicator */}
          <View style={styles.modeIndicator}>
            <Ionicons 
              name={currentMode === 'humorous' ? 'happy' : 'school'} 
              size={20} 
              color="#6366f1" 
            />
            <Text style={styles.modeText}>
              {currentMode === 'humorous' ? 'Humorous Mode' : 'Formal Mode'}
            </Text>
          </View>

          {/* Word Card */}
          <View style={styles.wordCard}>
            {/* Word Header */}
            <View style={styles.wordHeader}>
              <View style={styles.wordTitleContainer}>
                <Text style={styles.word}>{currentWord.word}</Text>
                <TouchableOpacity 
                  style={[styles.audioButton, isSpeaking && styles.audioButtonActive]}
                  onPress={() => speakText(currentWord.word, { rate: 0.6, pitch: 1.1 })}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name={isSpeaking ? "stop" : "volume-high"} 
                    size={24} 
                    color={isSpeaking ? "#fff" : "#6366f1"} 
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.partOfSpeechContainer}>
                <Text style={styles.partOfSpeech}>{currentWord.partOfSpeech}</Text>
              </View>
            </View>

            {/* Image Container */}
            <View style={styles.imageContainer}>
              <Ionicons name="image" size={80} color="#94a3b8" />
              <Text style={styles.imagePlaceholder}>
                {currentMode === 'humorous' ? 'Humorous' : 'Formal'} Image Placeholder
              </Text>
              <Text style={styles.imageNote}>
                {modeData ? `Image: ${modeData.image}` : `Midjourney-generated ${currentMode} image for "${currentWord.word}"`}
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
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Definition</Text>
                    <TouchableOpacity 
                      style={[styles.audioButtonSmall, isSpeaking && styles.audioButtonSmallActive]}
                      onPress={() => speakText(currentWord.definition, { rate: 0.8 })}
                      activeOpacity={0.7}
                    >
                      <Ionicons 
                        name={isSpeaking ? "stop" : "volume-high"} 
                        size={18} 
                        color={isSpeaking ? "#fff" : "#6366f1"} 
                      />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.definition}>{currentWord.definition}</Text>
                </View>

                {/* Example Sentence */}
                <View style={styles.exampleSection}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Example ({currentMode})</Text>
                    {modeData && (
                                              <TouchableOpacity 
                        style={[styles.audioButtonSmall, isSpeaking && styles.audioButtonSmallActive]}
                        onPress={() => speakText(modeData.sentence, { rate: 0.85 })}
                        activeOpacity={0.7}
                      >
                        <Ionicons 
                          name={isSpeaking ? "stop" : "volume-high"} 
                          size={18} 
                          color={isSpeaking ? "#fff" : "#6366f1"} 
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                  <Text style={styles.example}>
                    "{modeData ? modeData.sentence : 'No example available for this mode'}"
                  </Text>
                </View>

                {/* FSRS Review Buttons */}
                <View style={styles.fsrsButtonContainer}>
                  <Text style={styles.fsrsTitle}>How well did you know this word?</Text>
                  <View style={styles.fsrsButtonRow}>
                    <TouchableOpacity
                      style={[styles.fsrsButton, styles.forgotButton]}
                      onPress={() => handleFsrsGrade(Grade.FORGOT)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="close" size={20} color="white" />
                      <Text style={styles.fsrsButtonText}>Forgot</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.fsrsButton, styles.hardButton]}
                      onPress={() => handleFsrsGrade(Grade.HARD)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="remove" size={20} color="white" />
                      <Text style={styles.fsrsButtonText}>Hard</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.fsrsButton, styles.goodButton]}
                      onPress={() => handleFsrsGrade(Grade.GOOD)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="checkmark" size={20} color="white" />
                      <Text style={styles.fsrsButtonText}>Good</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.fsrsButton, styles.easyButton]}
                      onPress={() => handleFsrsGrade(Grade.EASY)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="star" size={20} color="white" />
                      <Text style={styles.fsrsButtonText}>Easy</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
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
  loadingSubtext: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
  },
  goHomeButton: {
    padding: 16,
    backgroundColor: '#6366f1',
    borderRadius: 12,
    marginTop: 20,
  },
  goHomeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
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
  modeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 16,
    alignSelf: 'center',
  },
  modeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
    marginLeft: 6,
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
  wordTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  word: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginRight: 12,
  },
  audioButton: {
    padding: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
  },
  audioButtonActive: {
    backgroundColor: '#6366f1',
  },
  audioButtonSmall: {
    padding: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 15,
    marginLeft: 8,
  },
  audioButtonSmallActive: {
    backgroundColor: '#6366f1',
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
    textAlign: 'center',
    paddingHorizontal: 16,
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
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
  fsrsButtonContainer: {
    marginHorizontal: 4,
    marginBottom: 20,
  },
  fsrsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 16,
    textAlign: 'center',
  },
  fsrsButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  fsrsButton: {
    flex: 0.23,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    minHeight: 70,
  },
  forgotButton: {
    backgroundColor: '#ef4444',
  },
  hardButton: {
    backgroundColor: '#f59e0b',
  },
  goodButton: {
    backgroundColor: '#10b981',
  },
  easyButton: {
    backgroundColor: '#3b82f6',
  },
  fsrsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginBottom: 2,
    textAlign: 'center',
  },
}); 