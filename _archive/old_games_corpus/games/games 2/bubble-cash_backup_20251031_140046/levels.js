// levels.js - Level management

import { gameState } from './globals.js';
import { createLevelLayout } from './grid.js';

export function getLevelTimeLimit(level) {
  const timeLimits = [90, 75, 60];
  return timeLimits[level - 1] || 60;
}

export function initializeLevel(level, p) {
  gameState.currentLevel = level;
  gameState.bubbleGrid = createLevelLayout(level);
  gameState.timerRemaining = getLevelTimeLimit(level);
  gameState.levelStartTime = p.millis();
  gameState.canFire = true;
  gameState.swapAvailable = true;

  // Log level start
  p.logs.game_info.push({
    data: { event: 'level_start', level: level },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function updateTimer(p) {
  if (gameState.gamePhase === 'PLAYING') {
    const elapsed = (p.millis() - gameState.levelStartTime) / 1000;
    gameState.timerRemaining = Math.max(0, getLevelTimeLimit(gameState.currentLevel) - elapsed);

    if (gameState.timerRemaining <= 0) {
      return true; // Time's up
    }
  }
  return false;
}

export function calculateTimeBonus() {
  return Math.floor(gameState.timerRemaining * 5);
}