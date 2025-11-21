// scoring.js - Score and high score management

import { gameState, LEVEL_CONFIGS } from './globals.js';

export function calculateRoundScore(won, turnsTaken) {
  let score = 0;
  
  if (won) {
    score += 100;
    
    // Grid size bonus
    const bonuses = { 3: 0, 6: 50, 9: 100, 11: 150 };
    score += bonuses[gameState.currentGridSize] || 0;
    
    // Speed bonus
    const maxTurns = gameState.maxTurnsForLevel;
    if (turnsTaken < maxTurns) {
      score += (maxTurns - turnsTaken) * 5;
    }
  } else if (gameState.winner === 'draw') {
    score += 25;
  }
  
  return score;
}

export function updateScore(roundScore) {
  gameState.score += roundScore;
  gameState.roundScore = roundScore;
}

export function saveHighScore() {
  if (gameState.score <= 0) return;
  
  gameState.highScores.push({
    score: gameState.score,
    level: gameState.currentLevel,
    date: new Date().toISOString()
  });
  
  gameState.highScores.sort((a, b) => b.score - a.score);
  gameState.highScores = gameState.highScores.slice(0, 5);
  
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem('gridTacticsHighScores', JSON.stringify(gameState.highScores));
  }
}

export function resetScore() {
  gameState.score = 0;
  gameState.roundScore = 0;
}