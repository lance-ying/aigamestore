// levelManager.js - Level progression and management

import { gameState, GAME_PHASES } from './globals.js';
import { initializeGrid } from './gridManager.js';
import { calculateLevelScore, updateHighScore } from './scoring.js';

export function startLevel(level) {
  gameState.currentLevel = level;
  gameState.gamePhase = GAME_PHASES.PLAYING;
  gameState.incorrectSubmissions = 0;
  gameState.hintsUsed = 0;
  gameState.levelStartTime = Date.now();
  gameState.lastValidationResult = null;
  gameState.levelCompleted = false;

  const success = initializeGrid(level);
  
  if (!success) {
    // If level doesn't exist, game complete
    if (level > gameState.totalLevels) {
      gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
      updateHighScore();
    }
  }
}

export function completeLevel(p) {
  const timeElapsed = Math.floor((Date.now() - gameState.levelStartTime) / 1000);
  const levelScore = calculateLevelScore(timeElapsed);
  gameState.score += levelScore;
  gameState.levelCompleted = true;

  p.logs.game_info.push({
    event: "level_complete",
    data: {
      level: gameState.currentLevel,
      timeElapsed,
      levelScore,
      totalScore: gameState.score
    },
    framecount: p.frameCount,
    timestamp: Date.now()
  });

  if (gameState.currentLevel >= gameState.totalLevels) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
    updateHighScore();
  } else {
    gameState.currentLevel++;
    gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
  }
}

export function failLevel(p) {
  gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
  
  p.logs.game_info.push({
    event: "level_failed",
    data: {
      level: gameState.currentLevel,
      incorrectSubmissions: gameState.incorrectSubmissions
    },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}