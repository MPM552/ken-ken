/**
 * High score management using localStorage
 */

const STORAGE_PREFIX = "kenken_highscore";

/**
 * Get the storage key for a specific puzzle configuration
 */
function getStorageKey(size, difficulty) {
  return `${STORAGE_PREFIX}_${size}x${size}_${difficulty}`;
}

/**
 * Get the high score for a specific puzzle size and difficulty
 * Returns null if no high score exists
 */
export function getHighScore(size, difficulty) {
  try {
    const key = getStorageKey(size, difficulty);
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    
    const parsed = JSON.parse(stored);
    return {
      time: parsed.time,
      date: new Date(parsed.date),
    };
  } catch (error) {
    console.error("Error retrieving high score:", error);
    return null;
  }
}

/**
 * Save a high score if it beats the current record
 * Returns true if saved, false if it didn't beat the record
 */
export function saveHighScore(size, difficulty, timeInSeconds) {
  try {
    const current = getHighScore(size, difficulty);
    
    // Only save if it's a new record (or no previous record exists)
    if (current && current.time <= timeInSeconds) {
      return false;
    }
    
    const key = getStorageKey(size, difficulty);
    const data = {
      time: timeInSeconds,
      date: new Date().toISOString(),
    };
    
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error("Error saving high score:", error);
    return false;
  }
}

/**
 * Format time in seconds to MM:SS format
 */
export function formatTime(seconds) {
  const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");
  return `${mins}:${secs}`;
}

/**
 * Get all high scores as an object
 */
export function getAllHighScores() {
  const scores = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        const value = localStorage.getItem(key);
        if (value) {
          scores[key] = JSON.parse(value);
        }
      }
    }
  } catch (error) {
    console.error("Error retrieving all high scores:", error);
  }
  return scores;
}

/**
 * Clear all high scores
 */
export function clearAllHighScores() {
  try {
    const keysToDelete = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => localStorage.removeItem(key));
    return true;
  } catch (error) {
    console.error("Error clearing high scores:", error);
    return false;
  }
}
