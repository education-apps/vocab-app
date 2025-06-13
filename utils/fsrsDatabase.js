import { db } from './database.js';
import { allocateNewWordsForToday } from './vocabDatabase.js';

// Update FSRS data after review
export const updateFsrsData = async (wordId, fsrsData) => {
  try {
    const database = await db;
    
    // Get old FSRS data for history tracking
    const oldData = await database.getFirstAsync(
      'SELECT stability, difficulty FROM fsrs_data WHERE word_id = ?',
      [wordId]
    ) || { stability: null, difficulty: null };
    
    // Update FSRS data
    await database.runAsync(`
      INSERT OR REPLACE INTO fsrs_data 
      (word_id, stability, difficulty, last_review_date, next_review_date,
       review_count, last_grade, elapsed_days, scheduled_days, lapses, 
       state, learning_steps, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `, [
      wordId,
      fsrsData.stability,
      fsrsData.difficulty,
      fsrsData.lastReviewDate,
      fsrsData.nextReviewDate,
      fsrsData.reviewCount,
      fsrsData.lastGrade,
      fsrsData.elapsed_days,
      fsrsData.scheduled_days,
      fsrsData.lapses,
      fsrsData.state,
      fsrsData.learning_steps
    ]);

    // Record review in history
    await database.runAsync(`
      INSERT INTO review_history 
      (word_id, rating, review_date, elapsed_days, scheduled_days,
       old_stability, new_stability, old_difficulty, new_difficulty)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      wordId,
      fsrsData.lastGrade,
      fsrsData.lastReviewDate,
      fsrsData.elapsed_days,
      fsrsData.scheduled_days,
      oldData.stability,
      fsrsData.stability,
      oldData.difficulty,
      fsrsData.difficulty
    ]);

    return fsrsData;
  } catch (error) {
    console.error('Error updating FSRS data:', error);
    throw error;
  }
};

// Get user progress statistics
export const getUserProgress = async (dailyNewWordsLimit = 20) => {
  try {
    const database = await db;
    
    // Get basic stats
    const stats = await database.getFirstAsync(`
      SELECT 
        COUNT(*) as total_words,
        SUM(CASE WHEN f.next_review_date > datetime('now') AND f.next_review_date <= datetime('now', '+1 day') THEN 1 ELSE 0 END) as due_tomorrow,
        SUM(CASE WHEN f.next_review_date > datetime('now') AND f.next_review_date <= datetime('now', '+7 days') THEN 1 ELSE 0 END) as due_this_week,
        SUM(COALESCE(f.review_count, 0)) as total_reviews,
        COUNT(CASE WHEN f.review_count > 0 THEN 1 END) as reviewed_words
      FROM vocabulary v
      LEFT JOIN fsrs_data f ON v.id = f.word_id
    `);

    // Calculate due today with daily allocation system
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // First, ensure we have allocated new words for today (same as in getDueWords)
    await allocateNewWordsForToday(dailyNewWordsLimit);
    
    const dueStatsQuery = await database.getFirstAsync(`
      SELECT 
        -- Count scheduled review words (no limit)
        SUM(CASE WHEN f.next_review_date <= datetime('now') AND f.review_count > 0 THEN 1 ELSE 0 END) as scheduled_reviews,
        -- Count total new words available
        SUM(CASE WHEN (f.next_review_date IS NULL OR f.review_count = 0) THEN 1 ELSE 0 END) as total_new_words
      FROM vocabulary v
      LEFT JOIN fsrs_data f ON v.id = f.word_id
    `);

    // Count today's allocated new words that haven't been reviewed yet
    const allocatedNewWordsQuery = await database.getFirstAsync(`
      SELECT COUNT(*) as count
      FROM daily_allocations da
      INNER JOIN vocabulary v ON da.word_id = v.id
      LEFT JOIN fsrs_data f ON v.id = f.word_id
      WHERE da.allocation_date = ? 
        AND (f.review_count = 0 OR f.review_count IS NULL)
    `, [today]);

    const scheduledReviews = dueStatsQuery?.scheduled_reviews || 0;
    const allocatedNewWords = allocatedNewWordsQuery?.count || 0;
    const totalNewWords = dueStatsQuery?.total_new_words || 0;
    const dueToday = scheduledReviews + allocatedNewWords;
    
    if (stats) {
      // Calculate retention rate from recent reviews
      const retentionData = await database.getFirstAsync(`
        SELECT 
          COUNT(*) as recent_reviews,
          SUM(CASE WHEN rating >= 3 THEN 1 ELSE 0 END) as successful_reviews
        FROM review_history 
        WHERE review_date >= datetime('now', '-30 days')
      `) || { recent_reviews: 0, successful_reviews: 0 };

      const retentionRate = retentionData.recent_reviews > 0 
        ? Math.round((retentionData.successful_reviews / retentionData.recent_reviews) * 100)
        : 0;

      return {
        totalWords: stats.total_words,
        dueToday: dueToday,
        dueTomorrow: stats.due_tomorrow,
        dueThisWeek: stats.due_this_week,
        totalReviews: stats.total_reviews || 0,
        reviewedWords: stats.reviewed_words || 0,
        averageReviews: stats.reviewed_words > 0 ? Math.round(stats.total_reviews / stats.reviewed_words) : 0,
        retentionRate: retentionRate,
        accuracy: retentionData.recent_reviews > 0 ? Math.round((retentionData.successful_reviews / retentionData.recent_reviews) * 100) : 0,
        // Additional info for debugging/display
        scheduledReviews: scheduledReviews,
        allocatedNewWords: allocatedNewWords,
        totalNewWords: totalNewWords
      };
    } else {
      return {
        totalWords: 0,
        dueToday: 0,
        dueTomorrow: 0,
        dueThisWeek: 0,
        totalReviews: 0,
        reviewedWords: 0,
        averageReviews: 0,
        retentionRate: 0,
        accuracy: 0
      };
    }
  } catch (error) {
    console.error('Error getting user progress:', error);
    throw error;
  }
};

// Get recent words (last reviewed words)
export const getRecentWords = async (limit = 5) => {
  try {
    const database = await db;
    const rows = await database.getAllAsync(`
      SELECT 
        v.*,
        f.stability, f.difficulty, f.last_review_date, f.next_review_date,
        f.review_count, f.last_grade, f.elapsed_days, f.scheduled_days,
        f.lapses, f.state, f.learning_steps
      FROM vocabulary v
      INNER JOIN fsrs_data f ON v.id = f.word_id
      WHERE f.last_review_date IS NOT NULL
      ORDER BY f.last_review_date DESC
      LIMIT ?
    `, [limit]);
    
    return rows.map(row => ({
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
    }));
  } catch (error) {
    console.error('Error getting recent words:', error);
    throw error;
  }
};

 