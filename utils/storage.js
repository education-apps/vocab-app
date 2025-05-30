import AsyncStorage from '@react-native-async-storage/async-storage';
import { vocabularyWords } from '../data/vocabulary';

const STORAGE_KEYS = {
  VOCABULARY_DATA: 'vocabulary_data',
  USER_PROGRESS: 'user_progress',
  SETTINGS: 'settings',
  CURRENT_WORD_INDEX: 'current_word_index',
};

// Initialize vocabulary data
export const initializeVocabularyData = async () => {
  try {
    const existingData = await AsyncStorage.getItem(STORAGE_KEYS.VOCABULARY_DATA);
    if (!existingData) {
      await AsyncStorage.setItem(STORAGE_KEYS.VOCABULARY_DATA, JSON.stringify(vocabularyWords));
    }
  } catch (error) {
    console.error('Error initializing vocabulary data:', error);
  }
};

// Get all vocabulary words
export const getVocabularyWords = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.VOCABULARY_DATA);
    return data ? JSON.parse(data) : vocabularyWords;
  } catch (error) {
    console.error('Error getting vocabulary data:', error);
    return vocabularyWords;
  }
};

// Update a specific word's status
export const updateWordStatus = async (wordId, newStatus) => {
  try {
    const words = await getVocabularyWords();
    const updatedWords = words.map(word => 
      word.id === wordId ? { ...word, status: newStatus } : word
    );
    await AsyncStorage.setItem(STORAGE_KEYS.VOCABULARY_DATA, JSON.stringify(updatedWords));
    return updatedWords;
  } catch (error) {
    console.error('Error updating word status:', error);
    throw error;
  }
};

// Get user progress statistics
export const getUserProgress = async () => {
  try {
    const words = await getVocabularyWords();
    const totalWords = words.length;
    const knownWords = words.filter(word => word.status === 'known').length;
    const reviewWords = words.filter(word => word.status === 'review').length;
    const newWords = words.filter(word => word.status === 'new').length;
    
    const accuracy = totalWords > 0 ? Math.round((knownWords / totalWords) * 100) : 0;
    
    return {
      totalWords,
      knownWords,
      reviewWords,
      newWords,
      accuracy,
      // Placeholder for spaced repetition data
      dueToday: reviewWords,
      dueTomorrow: 0,
      dueThisWeek: reviewWords,
    };
  } catch (error) {
    console.error('Error getting user progress:', error);
    return {
      totalWords: 0,
      knownWords: 0,
      reviewWords: 0,
      newWords: 0,
      accuracy: 0,
      dueToday: 0,
      dueTomorrow: 0,
      dueThisWeek: 0,
    };
  }
};

// Get settings
export const getSettings = async () => {
  try {
    const settings = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
    return settings ? JSON.parse(settings) : {
      imageMood: 'humorous',
      vocabularySet: 'general',
    };
  } catch (error) {
    console.error('Error getting settings:', error);
    return {
      imageMood: 'humorous',
      vocabularySet: 'general',
    };
  }
};

// Update settings
export const updateSettings = async (newSettings) => {
  try {
    const currentSettings = await getSettings();
    const updatedSettings = { ...currentSettings, ...newSettings };
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updatedSettings));
    return updatedSettings;
  } catch (error) {
    console.error('Error updating settings:', error);
    throw error;
  }
};

// Get recent words (last 5 words with status changes)
export const getRecentWords = async () => {
  try {
    const words = await getVocabularyWords();
    // For MVP, return words that are not 'new' status
    const recentWords = words
      .filter(word => word.status !== 'new')
      .slice(-5);
    return recentWords;
  } catch (error) {
    console.error('Error getting recent words:', error);
    return [];
  }
};

// Save current word index
export const saveCurrentWordIndex = async (index) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_WORD_INDEX, index.toString());
  } catch (error) {
    console.error('Error saving current word index:', error);
  }
};

// Get current word index
export const getCurrentWordIndex = async () => {
  try {
    const index = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_WORD_INDEX);
    return index ? parseInt(index, 10) : 0;
  } catch (error) {
    console.error('Error getting current word index:', error);
    return 0;
  }
}; 