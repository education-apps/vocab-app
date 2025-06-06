import { db } from './database.js';
import { vocabularyWords } from '../data/vocabulary.js';

// Helper function to extract category from word ID or position
const extractCategory = (wordId) => {
  // For now, simple categorization based on ID ranges
  // You can modify this logic based on your categorization strategy
  if (wordId <= 50) return 'general';
  if (wordId <= 100) return 'academic';
  if (wordId <= 150) return 'business';
  if (wordId <= 200) return 'advanced';
  return 'general';
};

// Load vocabulary data from static file into database
export const loadVocabularyData = async () => {
  try {
    const database = await db;
    
    for (const word of vocabularyWords) {
      await database.runAsync(`
        INSERT OR REPLACE INTO vocabulary 
        (id, word, part_of_speech, definition, category, pronunciation_audio, 
         definition_audio, humorous_image, humorous_sentence, humorous_sentence_audio,
         formal_image, formal_sentence, formal_sentence_audio)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        word.id,
        word.word,
        word.partOfSpeech,
        word.definition,
        extractCategory(word.id),
        word.pronunciation_audio,
        word.definition_audio,
        word.modes?.humorous?.image,
        word.modes?.humorous?.sentence,
        word.modes?.humorous?.sentence_audio,
        word.modes?.formal?.image,
        word.modes?.formal?.sentence,
        word.modes?.formal?.sentence_audio
      ]);
    }
    
    console.log(`Loaded ${vocabularyWords.length} vocabulary words successfully`);
  } catch (error) {
    console.error('Error loading vocabulary data:', error);
    throw error;
  }
};

// Helper function to format database row back to your expected word structure
const formatWordFromRow = (row) => {
  return {
    id: row.id,
    word: row.word,
    partOfSpeech: row.part_of_speech,
    definition: row.definition,
    category: row.category,
    modes: {
      humorous: {
        image: row.humorous_image,
        sentence: row.humorous_sentence,
        sentence_audio: row.humorous_sentence_audio
      },
      formal: {
        image: row.formal_image,
        sentence: row.formal_sentence,
        sentence_audio: row.formal_sentence_audio
      }
    },
    pronunciation_audio: row.pronunciation_audio,
    definition_audio: row.definition_audio,
    fsrs: {
      stability: row.stability,
      difficulty: row.difficulty,
      lastReviewDate: row.last_review_date,
      nextReviewDate: row.next_review_date,
      reviewCount: row.review_count || 0,
      lastGrade: row.last_grade,
      elapsed_days: row.elapsed_days || 0,
      scheduled_days: row.scheduled_days || 0,
      lapses: row.lapses || 0,
      state: row.state || 0,
      learning_steps: row.learning_steps || 0,
    }
  };
};

// Get a single word with all data
export const getWordById = async (wordId) => {
  try {
    const database = await db;
    const row = await database.getFirstAsync(`
      SELECT 
        v.*,
        f.stability, f.difficulty, f.last_review_date, f.next_review_date,
        f.review_count, f.last_grade, f.elapsed_days, f.scheduled_days,
        f.lapses, f.state, f.learning_steps
      FROM vocabulary v
      LEFT JOIN fsrs_data f ON v.id = f.word_id
      WHERE v.id = ?
    `, [wordId]);
    
    if (row) {
      return formatWordFromRow(row);
    } else {
      throw new Error(`Word with id ${wordId} not found`);
    }
  } catch (error) {
    console.error('Error getting word by id:', error);
    throw error;
  }
};

// Get all vocabulary words with their FSRS data
export const getAllWords = async (limit = 1000) => {
  try {
    const database = await db;
    const rows = await database.getAllAsync(`
      SELECT 
        v.*,
        f.stability, f.difficulty, f.last_review_date, f.next_review_date,
        f.review_count, f.last_grade, f.elapsed_days, f.scheduled_days,
        f.lapses, f.state, f.learning_steps
      FROM vocabulary v
      LEFT JOIN fsrs_data f ON v.id = f.word_id
      ORDER BY v.word
      LIMIT ?
    `, [limit]);
    
    return rows.map(row => formatWordFromRow(row));
  } catch (error) {
    console.error('Error getting all words:', error);
    throw error;
  }
};

// Get due words for review - optimized query
export const getDueWords = async (limit = 20) => {
  try {
    const database = await db;
    const rows = await database.getAllAsync(`
      SELECT 
        v.*,
        f.stability, f.difficulty, f.last_review_date, f.next_review_date,
        f.review_count, f.last_grade, f.elapsed_days, f.scheduled_days,
        f.lapses, f.state, f.learning_steps
      FROM vocabulary v
      LEFT JOIN fsrs_data f ON v.id = f.word_id
      WHERE (f.next_review_date IS NULL 
         OR f.next_review_date <= datetime('now')
         OR f.review_count = 0)
      ORDER BY 
        CASE WHEN f.next_review_date IS NULL THEN 0 ELSE 1 END,
        f.next_review_date ASC
      LIMIT ?
    `, [limit]);
    
    return rows.map(row => formatWordFromRow(row));
  } catch (error) {
    console.error('Error getting due words:', error);
    throw error;
  }
};

// Get available categories
export const getCategories = async () => {
  try {
    const database = await db;
    const rows = await database.getAllAsync(`
      SELECT DISTINCT category 
      FROM vocabulary 
      WHERE category IS NOT NULL 
      ORDER BY category
    `);
    
    return rows.map(row => row.category);
  } catch (error) {
    console.error('Error getting categories:', error);
    throw error;
  }
}; 