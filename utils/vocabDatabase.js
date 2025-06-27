import { db } from './database.js';
import { vocabularyWords } from '../data/isee_vocabulary.js';

// Load vocabulary data from static file into database
export const loadVocabularyData = async () => {
  try {
    const database = await db;
    
    for (const word of vocabularyWords) {
      await database.runAsync(`
        INSERT OR REPLACE INTO vocabulary 
        (id, word, part_of_speech, definition, pronunciation_audio, 
         definition_audio, humorous_image, humorous_sentence, humorous_sentence_audio,
         formal_image, formal_sentence, formal_sentence_audio)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        word.id,
        word.word,
        word.partOfSpeech,
        word.definition,
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

// Allocate new words for today if not already allocatedr
export const allocateNewWordsForToday = async (dailyNewWordsLimit) => {
  try {
    const database = await db;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Check how many words are already allocated for today
    const allocatedCount = await database.getFirstAsync(`
      SELECT COUNT(*) as count 
      FROM daily_allocations 
      WHERE allocation_date = ?
    `, [today]);
    
    const currentAllocated = allocatedCount?.count || 0;
    const needToAllocate = Math.max(0, dailyNewWordsLimit - currentAllocated);
    
    if (needToAllocate > 0) {
      // Get new words that haven't been allocated yet and haven't been reviewed
      const newWordsToAllocate = await database.getAllAsync(`
        SELECT v.id 
        FROM vocabulary v
        LEFT JOIN fsrs_data f ON v.id = f.word_id
        LEFT JOIN daily_allocations da ON v.id = da.word_id
        WHERE (f.review_count = 0 OR f.review_count IS NULL)
          AND da.word_id IS NULL
        ORDER BY v.id ASC
        LIMIT ?
      `, [needToAllocate]);
      
      // Allocate these words for today
      for (const word of newWordsToAllocate) {
        await database.runAsync(`
          INSERT OR IGNORE INTO daily_allocations (word_id, allocation_date)
          VALUES (?, ?)
        `, [word.id, today]);
      }
    }
    
    return currentAllocated + needToAllocate;
  } catch (error) {
    console.error('Error allocating new words for today:', error);
    throw error;
  }
};

// Get due words for review - optimized query with daily new words limit and intelligent short-interval handling
export const getDueWords = async (dailyNewWordsLimit = 20) => {
  try {
    const database = await db;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const now = new Date();
    const nowISO = now.toISOString(); // Current time as ISO string for consistent comparison
    
    // First, ensure we have allocated new words for today
    await allocateNewWordsForToday(dailyNewWordsLimit);
    
    // Get all scheduled review words that are actually due now (no limit on these)
    const reviewWords = await database.getAllAsync(`
      SELECT 
        v.*,
        f.stability, f.difficulty, f.last_review_date, f.next_review_date,
        f.review_count, f.last_grade, f.elapsed_days, f.scheduled_days,
        f.lapses, f.state, f.learning_steps
      FROM vocabulary v
      LEFT JOIN fsrs_data f ON v.id = f.word_id
      WHERE f.next_review_date <= ? AND f.review_count > 0
      ORDER BY f.next_review_date ASC
    `, [nowISO]);
    
    // Get today's allocated new words that haven't been reviewed yet
    const allocatedNewWords = await database.getAllAsync(`
      SELECT 
        v.*,
        f.stability, f.difficulty, f.last_review_date, f.next_review_date,
        f.review_count, f.last_grade, f.elapsed_days, f.scheduled_days,
        f.lapses, f.state, f.learning_steps
      FROM vocabulary v
      INNER JOIN daily_allocations da ON v.id = da.word_id
      LEFT JOIN fsrs_data f ON v.id = f.word_id
      WHERE da.allocation_date = ? 
        AND (f.review_count = 0 OR f.review_count IS NULL)
      ORDER BY v.id ASC
    `, [today]);
    
    // Get learning/relearning words (FSRS states 1 or 3) - these should always be available regardless of due time
    const learningWords = await database.getAllAsync(`
      SELECT 
        v.*,
        f.stability, f.difficulty, f.last_review_date, f.next_review_date,
        f.review_count, f.last_grade, f.elapsed_days, f.scheduled_days,
        f.lapses, f.state, f.learning_steps
      FROM vocabulary v
      LEFT JOIN fsrs_data f ON v.id = f.word_id
      WHERE (f.state = 1 OR f.state = 3)
        AND f.review_count > 0
      ORDER BY f.next_review_date ASC
    `, []);
    
    // Combine all due words: reviews + allocated new words + learning words
    let allDueWords = [...reviewWords, ...allocatedNewWords, ...learningWords];
    
    return allDueWords.map(row => formatWordFromRow(row));
  } catch (error) {
    console.error('Error getting due words:', error);
    throw error;
  }
};

// Clean up old daily allocations (older than 7 days)
export const cleanupOldAllocations = async () => {
  try {
    const database = await db;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    await database.runAsync(`
      DELETE FROM daily_allocations 
      WHERE allocation_date < ?
    `, [weekAgoStr]);
    
    console.log('Old daily allocations cleaned up');
  } catch (error) {
    console.error('Error cleaning up old allocations:', error);
  }
};

// Get words that have become due since the session started (for dynamic review updates)
export const getNewlyDueWords = async (sessionStartTime) => {
  try {
    const database = await db;
    const now = new Date();
    const nowISO = now.toISOString();
    const sessionStartISO = sessionStartTime.toISOString();
    
    // Get words that became due after the session started
    const newlyDueWords = await database.getAllAsync(`
      SELECT 
        v.*,
        f.stability, f.difficulty, f.last_review_date, f.next_review_date,
        f.review_count, f.last_grade, f.elapsed_days, f.scheduled_days,
        f.lapses, f.state, f.learning_steps
      FROM vocabulary v
      LEFT JOIN fsrs_data f ON v.id = f.word_id
      WHERE f.next_review_date > ? 
        AND f.next_review_date <= ? 
        AND f.review_count > 0
      ORDER BY f.next_review_date ASC
    `, [sessionStartISO, nowISO]);
    
    return newlyDueWords.map(row => formatWordFromRow(row));
  } catch (error) {
    console.error('Error getting newly due words:', error);
    return [];
  }
};

// Get recent words (words reviewed in the last 24 hours)
export const getRecentWords = async (limit = null) => {
  try {
    const database = await db;
    
    // Calculate 24 hours ago
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
    const twentyFourHoursAgoISO = twentyFourHoursAgo.toISOString();
    
    const rows = await database.getAllAsync(`
      SELECT 
        v.*,
        f.stability, f.difficulty, f.last_review_date, f.next_review_date,
        f.review_count, f.last_grade, f.elapsed_days, f.scheduled_days,
        f.lapses, f.state, f.learning_steps
      FROM vocabulary v
      INNER JOIN fsrs_data f ON v.id = f.word_id
      WHERE f.last_review_date IS NOT NULL
        AND f.last_review_date >= ?
      ORDER BY f.last_review_date DESC
      ${limit ? 'LIMIT ?' : ''}
    `, limit ? [twentyFourHoursAgoISO, limit] : [twentyFourHoursAgoISO]);
    
    return rows.map(row => formatWordFromRow(row));
  } catch (error) {
    console.error('Error getting recent words:', error);
    throw error;
  }
};

// Get most difficult words (based on FSRS difficulty and performance metrics)
export const getMostDifficultWords = async (limit = 50) => {
  try {
    const database = await db;
    const rows = await database.getAllAsync(`
      SELECT 
        v.*,
        f.stability, f.difficulty, f.last_review_date, f.next_review_date,
        f.review_count, f.last_grade, f.elapsed_days, f.scheduled_days,
        f.lapses, f.state, f.learning_steps,
        -- Calculate difficulty score based on multiple factors
        (
          COALESCE(f.difficulty, 5.0) * 2.0 +  -- FSRS difficulty (higher = more difficult)
          COALESCE(f.lapses, 0) * 1.5 +        -- Number of lapses (forgot the word)
          CASE WHEN f.last_grade <= 2 THEN 2.0 ELSE 0.0 END + -- Recent poor performance
          CASE WHEN f.stability < 1.0 THEN 1.0 ELSE 0.0 END   -- Low stability
        ) as difficulty_score
      FROM vocabulary v
      INNER JOIN fsrs_data f ON v.id = f.word_id
      WHERE f.review_count > 0  -- Only include words that have been reviewed
      ORDER BY difficulty_score DESC, f.lapses DESC, f.difficulty DESC
      LIMIT ?
    `, [limit]);
    
    return rows.map(row => formatWordFromRow(row));
  } catch (error) {
    console.error('Error getting most difficult words:', error);
    throw error;
  }
}; 