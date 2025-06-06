import { 
  createEmptyCard, 
  fsrs, 
  generatorParameters, 
  Rating 
} from 'ts-fsrs';

// FSRS Grade enum - maps to ts-fsrs Rating enum
export const Grade = {
  FORGOT: Rating.Again,    // 1 - forgot the answer
  HARD: Rating.Hard,       // 2 - recalled the answer, but it was hard  
  GOOD: Rating.Good,       // 3 - recalled the answer
  EASY: Rating.Easy,       // 4 - recalled the answer, and it was easy
};

// Initialize FSRS with default parameters
const params = generatorParameters({
  enable_fuzz: true,        // Add randomness to intervals
  enable_short_term: true, 
  maximum_interval: 36500,  // Max interval ~100 years
  request_retention: 0.9,   // Target 90% retention
});

const fsrsInstance = fsrs(params);

// Helper function to reconstruct ts-fsrs card from our data structure
function reconstructCard(word) {
  if (word.fsrs.reviewCount === 0) {
    return createEmptyCard(new Date());
  } else {
    return {
      due: new Date(word.fsrs.nextReviewDate),
      stability: word.fsrs.stability,
      difficulty: word.fsrs.difficulty,
      elapsed_days: word.fsrs.elapsed_days || 0,
      scheduled_days: word.fsrs.scheduled_days || 0,
      reps: word.fsrs.reviewCount,
      lapses: word.fsrs.lapses || 0,
      state: word.fsrs.state || 0,
      last_review: word.fsrs.lastReviewDate ? new Date(word.fsrs.lastReviewDate) : undefined,
      learning_steps: word.fsrs.learning_steps || 0,
    };
  }
}

/**
 * Process a review for a vocabulary word using FSRS algorithm
 * @param {Object} word - The vocabulary word object with FSRS data
 * @param {number} grade - Grade given by user (use Grade enum)
 * @returns {Object} Updated word object with new FSRS scheduling
 */
export function processReview(word, grade) {
  try {
    // Create ts-fsrs card from our FSRS data
    const card = reconstructCard(word);

    // Process the review with FSRS
    const reviewDate = new Date();
    const schedulingCards = fsrsInstance.repeat(card, reviewDate);
    const reviewResult = schedulingCards[grade];
    
    if (!reviewResult) {
      throw new Error(`Invalid grade: ${grade}`);
    }

    const { card: updatedCard, log } = reviewResult;
    
    // Update our FSRS data structure
    const updatedFsrs = {
      stability: updatedCard.stability,
      difficulty: updatedCard.difficulty,
      lastReviewDate: reviewDate.toISOString(),
      nextReviewDate: updatedCard.due.toISOString(),
      reviewCount: updatedCard.reps,
      lastGrade: grade,
      elapsed_days: updatedCard.elapsed_days,
      scheduled_days: updatedCard.scheduled_days,
      lapses: updatedCard.lapses,
      state: updatedCard.state,
      learning_steps: updatedCard.learning_steps,
    };

    return {
      ...word,
      fsrs: updatedFsrs,
      lastReviewed: reviewDate.toISOString(),
    };
  } catch (error) {
    console.error('Error processing FSRS review:', error);
    // Return word unchanged if there's an error
    return word;
  }
}

/**
 * Get cards due for review
 * @param {Array} words - Array of vocabulary words
 * @returns {Array} Words that are due for review
 */
export function getDueCards(words) {
  const now = new Date();
  return words.filter(word => {
    if (word.fsrs.reviewCount === 0) return true; // New cards are always due
    if (!word.fsrs.nextReviewDate) return true; // Cards without next review date
    return new Date(word.fsrs.nextReviewDate) <= now;
  });
}

/**
 * Get next review intervals for all grades (for display in UI)
 * @param {Object} word - The vocabulary word object
 * @returns {Object} Object with intervals for each grade in minutes/hours/days
 */
export function getNextIntervals(word) {
  try {
    const card = reconstructCard(word);
    const now = new Date();
    const schedulingCards = fsrsInstance.repeat(card, now);
    
    const formatInterval = (card) => {
      const dueDate = new Date(card.due);
      const intervalMs = dueDate.getTime() - now.getTime();
      const intervalMinutes = Math.max(1, Math.round(intervalMs / (1000 * 60)));
      
      if (intervalMinutes < 60) {
        return `~${intervalMinutes} min`;
      } else if (intervalMinutes < 1440) { // Less than 24 hours
        const hours = Math.round(intervalMinutes / 60);
        return `~${hours} hour${hours !== 1 ? 's' : ''}`;
      } else {
        const days = Math.round(intervalMinutes / 1440);
        return `~${days} day${days !== 1 ? 's' : ''}`;
      }
    };

    return {
      [Grade.FORGOT]: formatInterval(schedulingCards[Rating.Again].card),
      [Grade.HARD]: formatInterval(schedulingCards[Rating.Hard].card),
      [Grade.GOOD]: formatInterval(schedulingCards[Rating.Good].card),
      [Grade.EASY]: formatInterval(schedulingCards[Rating.Easy].card),
    };
  } catch (error) {
    console.error('Error calculating intervals:', error);
    // Return fallback intervals
    return {
      [Grade.FORGOT]: '~10 min',
      [Grade.HARD]: '~6 hours', 
      [Grade.GOOD]: '~1 day',
      [Grade.EASY]: '~4 days',
    };
  }
}

/**
 * Initialize FSRS data for a new word
 * @returns {Object} Initial FSRS data structure
 */
export function initializeFsrsData() {
  return {
    stability: null,
    difficulty: null,
    lastReviewDate: null,
    nextReviewDate: null,
    reviewCount: 0,
    lastGrade: null,
    elapsed_days: 0,
    scheduled_days: 0,
    lapses: 0,
    state: 0,
    learning_steps: 0,
  };
}

