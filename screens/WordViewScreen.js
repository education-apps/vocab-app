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
import { Audio } from 'expo-av';
import { getVocabularyWords, updateWordStatus, getCurrentWordIndex, saveCurrentWordIndex, getSettings, processWordReview } from '../utils/storage';
import { Grade } from '../utils/fsrs';

const { width, height } = Dimensions.get('window');

export default function WordViewScreen({ navigation }) {
  const [words, setWords] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentWord, setCurrentWord] = useState(null);
  const [showDefinition, setShowDefinition] = useState(false);
  const [settings, setSettings] = useState({ imageMood: 'humorous', vocabularySet: 'general' });
  const [currentMode, setCurrentMode] = useState('humorous');
  const [sound, setSound] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      // Load settings first to get the current mode
      await loadSettings();
      // Then load words
      await loadWords();
    };
    
    loadData();
    
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  // Listen for navigation focus to reload settings when returning from Settings
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      console.log('WordView screen focused, reloading settings...');
      await loadSettings();
    });

    return unsubscribe;
  }, [navigation]);

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

  const loadSettings = async () => {
    try {
      const userSettings = await getSettings();
      setSettings(userSettings);
      setCurrentMode(userSettings.imageMood);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const playAudio = async (audioPath) => {
    try {
      // For MVP, we'll show an alert since audio files don't exist yet
      Alert.alert('Audio Feature', `Playing audio: ${audioPath}\n\nThis feature will play actual audio files when they are available.`);
      
      // Future implementation:
      // if (sound) {
      //   await sound.unloadAsync();
      // }
      // const { sound: newSound } = await Audio.Sound.createAsync({ uri: audioPath });
      // setSound(newSound);
      // await newSound.playAsync();
    } catch (error) {
      console.error('Error playing audio:', error);
      Alert.alert('Audio Error', 'Could not play audio file.');
    }
  };

  const handleShowDefinition = () => {
    setShowDefinition(true);
  };

  // FSRS grading function (placeholder for now)
  const handleFsrsGrade = async (grade) => {
    if (!currentWord) return;

    try {
      // TODO: Replace with actual FSRS review processing when algorithm is implemented
      console.log(`FSRS Grade: ${grade} for word: ${currentWord.word}`);
      
      // For now, use the existing word status update logic
      // In the future, this will call processWordReview(currentWord.id, grade)
      const newStatus = grade === Grade.FORGOT ? 'review' : grade >= Grade.GOOD ? 'known' : 'review';
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
                  style={styles.audioButton}
                  onPress={() => playAudio(currentWord.pronunciation_audio)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="volume-high" size={24} color="#6366f1" />
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
                      style={styles.audioButtonSmall}
                      onPress={() => playAudio(currentWord.definition_audio)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="volume-high" size={18} color="#6366f1" />
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
                        style={styles.audioButtonSmall}
                        onPress={() => playAudio(modeData.sentence_audio)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="volume-high" size={18} color="#6366f1" />
                      </TouchableOpacity>
                    )}
                  </View>
                  <Text style={styles.example}>
                    "{modeData ? modeData.sentence : 'No example available for this mode'}"
                  </Text>
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
              {/* FSRS Grading Buttons */}
              <Text style={styles.gradingTitle}>How well did you know this word?</Text>
              
              <View style={styles.gradingButtons}>
                <TouchableOpacity
                  style={[styles.gradeButton, styles.forgotButton]}
                  onPress={() => handleFsrsGrade(Grade.FORGOT)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.gradeButtonText}>😟 Forgot</Text>
                  <Text style={styles.gradeButtonSubtext}>~10 min</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.gradeButton, styles.hardButton]}
                  onPress={() => handleFsrsGrade(Grade.HARD)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.gradeButtonText}>😅 Hard</Text>
                  <Text style={styles.gradeButtonSubtext}>~6 hours</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.gradeButton, styles.goodButton]}
                  onPress={() => handleFsrsGrade(Grade.GOOD)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.gradeButtonText}>😊 Good</Text>
                  <Text style={styles.gradeButtonSubtext}>~1 day</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.gradeButton, styles.easyButton]}
                  onPress={() => handleFsrsGrade(Grade.EASY)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.gradeButtonText}>😎 Easy</Text>
                  <Text style={styles.gradeButtonSubtext}>~4 days</Text>
                </TouchableOpacity>
              </View>
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
  audioButtonSmall: {
    padding: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 15,
    marginLeft: 8,
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
    marginHorizontal: 4,
    marginBottom: 20,
  },
  gradingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 16,
    textAlign: 'center',
  },
  gradingButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  gradeButton: {
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
  gradeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginBottom: 2,
    textAlign: 'center',
  },
  gradeButtonSubtext: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 12,
  },
}); 