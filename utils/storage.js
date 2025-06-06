import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeDatabase, checkVocabularyLoaded } from './database.js';
import { loadVocabularyData, getWordById, getDueWords, getAllWords } from './vocabDatabase.js';
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
// This loads vocabulary.js data into SQLite (one-time operation)
export const initializeVocabularyData = async () => {
  try {
    console.log('Initializing database...');
    await initializeDatabase();
    
    console.log('Checking if vocabulary data is loaded...');
    const isLoaded = await checkVocabularyLoaded();
    
    if (!isLoaded) {
      console.log('Loading vocabulary data into database...');
      await loadVocabularyData(); // Loads from vocabulary.js into SQLite
    } else {
      console.log('Vocabulary data already loaded');
    }
    
    console.log('App data initialized successfully');
  } catch (error) {
    console.error('Error initializing vocabulary data:', error);
    throw error;
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

// Get words due for review (from database)
export const getDueWordsForReview = getDueWords;

// App settings (stored in AsyncStorage, not database)
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