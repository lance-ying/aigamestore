// scoring.js - Score calculation and management
import { gameState } from './globals.js';
import { levels } from './levels.js';

export function calculateLevelScore() {
  const level = levels[gameState.currentLevel];
  const timeTaken = (Date.now() - gameState.levelStartTime) / 1000;
  
  let score = 0;
  
  // Base completion bonus
  score += 1000;
  
  // Time bonus
  const timeBonus = Math.max(0, (level.maxTime - timeTaken) * 5);
  score += Math.floor(timeBonus);
  
  // Object usage bonus
  const totalUsed = gameState.objectsPlaced.block + 
                    gameState.objectsPlaced.ramp + 
                    gameState.objectsPlaced.spring;
  const totalMax = level.maxObjects.block + 
                   level.maxObjects.ramp + 
                   level.maxObjects.spring;
  const objectBonus = (totalMax - totalUsed) * 20;
  score += objectBonus;
  
  // Perfect run bonus
  if (gameState.firstAttempt && gameState.resetCount === 0) {
    score += 500;
  }
  
  gameState.score = Math.floor(score);
  gameState.totalScore += gameState.score;
}

export function loadHighScores() {
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem('sakamoto_highscores');
    if (saved) {
      gameState.highScores = JSON.parse(saved);
    }
  }
}

export function saveHighScore() {
  if (typeof localStorage !== 'undefined') {
    gameState.highScores.push(gameState.totalScore);
    gameState.highScores.sort((a, b) => b - a);
    gameState.highScores = gameState.highScores.slice(0, 5);
    localStorage.setItem('sakamoto_highscores', JSON.stringify(gameState.highScores));
  }
}