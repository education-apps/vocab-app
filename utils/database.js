import * as SQLite from 'expo-sqlite';

// Open database using the modern API
const db = SQLite.openDatabaseAsync('vocabulary.db');

export const initializeDatabase = async () => {
  try {
    console.log('Starting database initialization...');
    const database = await db;
    console.log('Database connection established');
    
    // Vocabulary content table - stores static word data
    console.log('Creating vocabulary table...');
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS vocabulary (
        id INTEGER PRIMARY KEY,
        word TEXT NOT NULL,
        part_of_speech TEXT,
        definition TEXT NOT NULL,
        category TEXT,
        pronunciation_audio TEXT,
        definition_audio TEXT,
        humorous_image TEXT,
        humorous_sentence TEXT,
        humorous_sentence_audio TEXT,
        formal_image TEXT,
        formal_sentence TEXT,
        formal_sentence_audio TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Vocabulary table created');

    // FSRS scheduling data table - stores dynamic learning data
    console.log('Creating fsrs_data table...');
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS fsrs_data (
        word_id INTEGER PRIMARY KEY,
        stability REAL,
        difficulty REAL,
        last_review_date TEXT,
        next_review_date TEXT,
        review_count INTEGER DEFAULT 0,
        last_grade INTEGER,
        elapsed_days INTEGER DEFAULT 0,
        scheduled_days INTEGER DEFAULT 0,
        lapses INTEGER DEFAULT 0,
        state INTEGER DEFAULT 0,
        learning_steps INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (word_id) REFERENCES vocabulary (id)
      )
    `);
    console.log('✓ FSRS data table created');

    // Review history for analytics and undo functionality
    console.log('Creating review_history table...');
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS review_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        word_id INTEGER,
        rating INTEGER,
        review_date TEXT,
        elapsed_days INTEGER,
        scheduled_days INTEGER,
        old_stability REAL,
        new_stability REAL,
        old_difficulty REAL,
        new_difficulty REAL,
        FOREIGN KEY (word_id) REFERENCES vocabulary (id)
      )
    `);
    console.log('✓ Review history table created');

    // Indexes for performance optimization
    console.log('Creating database indexes...');
    await database.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_next_review_date 
      ON fsrs_data(next_review_date)
    `);
    
    await database.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_category 
      ON vocabulary(category)
    `);

    await database.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_review_history_word_date 
      ON review_history(word_id, review_date)
    `);
    console.log('✓ Database indexes created');

    console.log('✅ Database initialization completed successfully');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  }
};

// Helper function to check if vocabulary data is loaded
export const checkVocabularyLoaded = async () => {
  try {
    const database = await db;
    const result = await database.getFirstAsync('SELECT COUNT(*) as count FROM vocabulary');
    const count = result?.count || 0;
    console.log(`Vocabulary check: ${count} words found in database`);
    return count > 0;
  } catch (error) {
    console.error('Error checking vocabulary loaded:', error);
    return false;
  }
};

// Get database instance for direct queries
export { db };

// Clear all vocabulary and progress data for fresh start
export const clearAllData = async () => {
  try {
    console.log('Clearing all vocabulary and progress data...');
    const database = await db;
    
    // Clear review history first (has foreign key constraints)
    await database.execAsync('DELETE FROM review_history');
    console.log('✓ Review history cleared');
    
    // Clear FSRS data
    await database.execAsync('DELETE FROM fsrs_data');
    console.log('✓ FSRS data cleared');
    
    // Clear vocabulary data
    await database.execAsync('DELETE FROM vocabulary');
    console.log('✓ Vocabulary data cleared');
    
    // Reset auto-increment counters
    await database.execAsync('DELETE FROM sqlite_sequence WHERE name IN ("review_history")');
    console.log('✓ Database sequences reset');
    
    console.log('All data cleared successfully');
  } catch (error) {
    console.error('Error clearing data:', error);
    throw error;
  }
}; 