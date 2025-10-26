// scoring.js - Score calculation and management

import { gameState } from './globals.js';

export function calculateQuestionScore(isCorrect, timeLeft, questionTimeLimit) {
  if (!isCorrect) {
    return 0;
  }
  
  let score = 100; // Base score
  
  // Streak bonus
  if (gameState.correctStreak > 0) {
    score += gameState.correctStreak * 10;
  }
  
  // Time bonus (if answered in first 3 seconds)
  if (questionTimeLimit - timeLeft <= 3) {
    score += 50;
  }
  
  return score;
}

export function applyLevelCompletionBonus() {
  const bonus = 500;
  gameState.levelScore += bonus;
  gameState.totalScore += bonus;
  return bonus;
}

export function updateScoreForAnswer(isCorrect, timeLeft) {
  if (isCorrect) {
    gameState.correctAnswersCount++;
    gameState.correctStreak++;
    
    const score = calculateQuestionScore(isCorrect, timeLeft, gameState.currentQuestion.timeLimit);
    gameState.levelScore += score;
    gameState.totalScore += score;
  } else {
    gameState.incorrectAnswersCount++;
    gameState.correctStreak = 0;
  }
}

// High scores management
export function getHighScores() {
  const stored = localStorage.getItem('momoWordQuestHighScores');
  if (!stored) return [];
  
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function saveHighScore(score) {
  let highScores = getHighScores();
  highScores.push({ score, date: Date.now() });
  highScores.sort((a, b) => b.score - a.score);
  highScores = highScores.slice(0, 5); // Keep top 5
  
  localStorage.setItem('momoWordQuestHighScores', JSON.stringify(highScores));
}