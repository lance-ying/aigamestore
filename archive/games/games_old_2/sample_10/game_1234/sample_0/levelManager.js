// levelManager.js - Level configuration and progression

import { gameState } from './globals.js';

export const LEVEL_CONFIG = {
  1: {
    name: "Novice Hand",
    drawMode: 1,
    allowDrawToggle: false,
    timeLimit: null,
    winsRequired: 1,
    scoreRequired: 1500,
    description: "Easy starting deals. Draw 1 card mode."
  },
  2: {
    name: "Standard Play",
    drawMode: 1,
    allowDrawToggle: true,
    timeLimit: null,
    winsRequired: 2,
    scoreRequired: 2000,
    description: "Random deals. Choose Draw 1 or Draw 3."
  },
  3: {
    name: "Expert Challenge",
    drawMode: 3,
    allowDrawToggle: false,
    timeLimit: null,
    winsRequired: 3,
    scoreRequired: 2500,
    totalTimeLimit: 30 * 60, // 30 minutes in seconds
    description: "Draw 3 mode only. 30 min cumulative time limit."
  },
  4: {
    name: "Master Solitaire",
    drawMode: 3,
    allowDrawToggle: false,
    timeLimit: 10 * 60, // 10 minutes per game
    winsRequired: 2,
    scoreRequired: 3000,
    description: "Hard deals. 10 min per game."
  },
  5: {
    name: "Grand Master",
    drawMode: 3,
    allowDrawToggle: false,
    timeLimit: 7 * 60, // 7 minutes per game
    winsRequired: 3,
    scoreRequired: 3500,
    description: "Hardest deals. 7 min per game. Final level!"
  }
};

export function initializeLevel(level) {
  const config = LEVEL_CONFIG[level];
  gameState.level = level;
  gameState.drawMode = config.drawMode;
  gameState.levelTimeLimit = config.timeLimit;
}

export function checkLevelComplete() {
  const level = gameState.level;
  const config = LEVEL_CONFIG[level];
  const progress = gameState.levelProgress[level];

  if (progress.wins < config.winsRequired) return false;

  const avgScore = progress.totalScore / progress.wins;
  if (avgScore < config.scoreRequired) return false;

  if (level === 3 && progress.totalTime > config.totalTimeLimit) return false;

  return true;
}

export function advanceLevel() {
  if (gameState.level < 5) {
    gameState.level++;
    initializeLevel(gameState.level);
    return true;
  }
  return false;
}