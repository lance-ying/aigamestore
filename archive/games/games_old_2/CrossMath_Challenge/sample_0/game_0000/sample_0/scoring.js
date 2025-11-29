// scoring.js - Score calculation and management

import { gameState } from './globals.js';

export function calculateLevelScore(timeElapsed) {
  let score = 1000; // Base level completion

  // Time bonus
  if (timeElapsed < 60) {
    score += 500;
  } else if (timeElapsed < 120) {
    score += 250;
  } else {
    score += 100;
  }

  // Hint penalty
  score -= gameState.hintsUsed * 100;

  // Incorrect submission penalty
  score -= gameState.incorrectSubmissions * 50;

  return Math.max(score, 0);
}

export function applyHintPenalty() {
  gameState.score = Math.max(0, gameState.score - 100);
}

export function applyIncorrectSubmissionPenalty() {
  gameState.score = Math.max(0, gameState.score - 50);
}

export function updateHighScore() {
  if (gameState.score > gameState.highScore) {
    gameState.highScore = gameState.score;
  }
}