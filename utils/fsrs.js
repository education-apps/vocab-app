// FSRS Grade enum - user's self-rating of recall performance
export const Grade = {
  FORGOT: 1,    // forgot the answer
  HARD: 2,      // recalled the answer, but it was hard
  GOOD: 3,      // recalled the answer
  EASY: 4,      // recalled the answer, and it was easy
};

// FSRS Weight parameters
const W = [
  0.40255, 1.18385, 3.173, 15.69105, 7.1949, 0.5345, 1.4604, 0.0046, 
  1.54575, 0.1192, 1.01925, 1.9395, 0.11, 0.29605, 2.2698, 0.2315, 
  2.9898, 0.51655, 0.6621
];

// Constants for the forgetting curve
const F = 19.0 / 81.0;
const C = -0.5;

