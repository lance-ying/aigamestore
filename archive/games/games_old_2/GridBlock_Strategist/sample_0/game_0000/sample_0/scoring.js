// scoring.js - Scoring system
import { gameState } from './globals.js';

export function calculateScore(clearedCount, clearCount) {
  if (clearCount === 0) {
    gameState.streak = 0;
    return 0;
  }
  
  let score = 0;
  
  // Base points for clears
  if (clearCount === 1) {
    // Single line or 3x3 - determine which
    if (clearedCount === 9) {
      score += 10; // Line clear
    } else {
      score += 20; // 3x3 clear
    }
  } else {
    // Multiple clears - calculate base
    const lineClears = Math.floor(clearedCount / 9) * 10;
    score += lineClears;
    
    // Combo multiplier
    if (clearCount === 2) {
      score = Math.floor(score * 1.5);
    } else if (clearCount >= 3) {
      score = Math.floor(score * 2);
    }
  }
  
  // Streak bonus
  gameState.streak++;
  if (gameState.streak > 1) {
    const streakBonus = (gameState.streak - 1) * 5;
    score += streakBonus;
  }
  
  return score;
}

export function addPlacementPoints(block) {
  return block.shape.length;
}

export function updateHighScore() {
  if (gameState.score > gameState.highScore) {
    gameState.highScore = gameState.score;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('gridblock_highscore', gameState.highScore.toString());
    }
  }
}

export function loadHighScore() {
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem('gridblock_highscore');
    if (saved) {
      gameState.highScore = parseInt(saved, 10);
    }
  }
}