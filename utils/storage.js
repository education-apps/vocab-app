import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeDatabase, checkVocabularyLoaded, clearAllData } from './database.js';
import { loadVocabularyData, getWordById, getDueWords, getAllWords, cleanupOldAllocations } from './vocabDatabase.js';
import { updateFsrsData, getUserProgress, getRecentWords } from './fsrsDatabase.js';
import { processReview } from './fsrs.js';

/*
 * DATA FLOW EXPLANATION:
 * 
 * 1. vocabulary.js contains static word definitions (source of truth)
 * 2. On app startup, vocabulary.js data is loaded into SQLite database (one-time)
 * 3. All user progress (FSRS data, review history) is stored in SQLite
 * 4. App screens read from SQLite database (not vocabulary.js directly)
 * 
 * SQLite Tables:
 * - vocabulary: word definitions, examples, audio paths
 * - fsrs_data: learning progress, next review dates, difficulty
 * - review_history: historical review data for analytics
 */

const STORAGE_KEYS = {
  SETTINGS: 'settings',
};

// Initialize vocabulary data using SQLite database
// This loads isee_vocabulary.js data into SQLite (one-time operation)
export const initializeVocabularyData = async () => {
  try {
    console.log('Initializing database...');
    await initializeDatabase();
    
    console.log('Checking if vocabulary data is loaded...');
    const isLoaded = await checkVocabularyLoaded();
    
    if (!isLoaded) {
      console.log('Loading vocabulary data into database...');
      await loadVocabularyData(); // Loads from isee_vocabulary.js into SQLite
    } else {
      console.log('Vocabulary data already loaded');
    }
    
    // Clean up old daily allocations
    await cleanupOldAllocations();
    
    console.log('App data initialized successfully');
  } catch (error) {
    console.error('Error initializing vocabulary data:', error);
    throw error;
  }
};

// Reset all progress and reload fresh ISEE vocabulary (can be called manually)
export const resetToFreshISEEVocabulary = async () => {
  try {
    console.log('Resetting to fresh ISEE vocabulary...');
    await clearAllData();
    await loadVocabularyData();
    console.log('Successfully reset to fresh ISEE vocabulary');
    return true;
  } catch (error) {
    console.error('Error resetting to fresh ISEE vocabulary:', error);
    throw error;
  }
};

// Helper function to get user progress with settings-based daily limit
export const getUserProgressWithSettings = async () => {
  try {
    const settings = await getSettings();
    return await getUserProgress(settings.dailyNewWords);
  } catch (error) {
    console.error('Error getting user progress with settings:', error);
    // Fallback to default
    return await getUserProgress(20);
  }
};

// Helper function to get due words with settings-based daily limit
export const getDueWordsWithSettings = async () => {
  try {
    const settings = await getSettings();
    return await getDueWords(settings.dailyNewWords);
  } catch (error) {
    console.error('Error getting due words with settings:', error);
    // Fallback to default
    return await getDueWords(20);
  }
};

// Export database functions with consistent naming
export { getUserProgress, getRecentWords };

// Export getWordById from vocabDatabase
export { getWordById } from './vocabDatabase.js';

// Process FSRS review for a word (stores progress in database)
export const processFsrsReview = async (wordId, grade) => {
  try {
    const word = await getWordById(wordId);
    const reviewedWord = processReview(word, grade);
    
    // Update FSRS data in database
    await updateFsrsData(wordId, reviewedWord.fsrs);
    
    return reviewedWord;
  } catch (error) {
    console.error('Error processing FSRS review:', error);
    throw error;
  }
};

// Get words due for review (from database) - now uses settings-based daily limit
export const getDueWordsForReview = getDueWordsWithSettings;

// App settings (stored in AsyncStorage, not database)
export const getSettings = async () => {
  try {
    const settings = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
    return settings ? JSON.parse(settings) : {
      imageMood: 'humorous',
      vocabularySet: 'general',
      dailyNewWords: 20, // Default daily new words limit
    };
  } catch (error) {
    console.error('Error getting settings:', error);
    return {
      imageMood: 'humorous',
      vocabularySet: 'general',
      dailyNewWords: 20, // Default daily new words limit
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