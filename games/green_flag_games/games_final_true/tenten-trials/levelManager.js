// levelManager.js - Level management and progression
import { gameState, GAME_PHASES, LEVEL_CONFIG } from './globals.js';

export function initializeLevel(levelIndex) {
  gameState.currentLevel = levelIndex;
  gameState.misses = 0;
  gameState.correctMatches = 0;
  gameState.combo = 0;
  gameState.entities = [];
  gameState.spawnTimer = 0;
  gameState.feedbackEffect = null;
  
  const config = LEVEL_CONFIG[levelIndex];
  gameState.nextSpawnTime = config.spawnRateMin * 60; // Convert to frames
}

export function getCurrentLevelConfig() {
  return LEVEL_CONFIG[gameState.currentLevel];
}

export function checkLevelComplete() {
  const config = getCurrentLevelConfig();
  
  if (gameState.correctMatches >= config.targetMatches) {
    // Level complete!
    if (gameState.currentLevel >= LEVEL_CONFIG.length - 1) {
      // Won the entire game
      return 'WIN';
    } else {
      // Advance to next level
      return 'NEXT_LEVEL';
    }
  }
  
  if (gameState.misses > config.missLimit) {
    // Too many misses - game over
    return 'LOSE';
  }
  
  return 'CONTINUE';
}

export function advanceToNextLevel() {
  gameState.gamePhase = GAME_PHASES.LEVEL_TRANSITION;
  gameState.levelTransitionTimer = 0;
}

export function updateLevelTransition(p) {
  gameState.levelTransitionTimer++;
  
  if (gameState.levelTransitionTimer >= gameState.levelTransitionDuration) {
    // Transition complete, start next level
    initializeLevel(gameState.currentLevel + 1);
    gameState.gamePhase = GAME_PHASES.PLAYING;
    
    p.logs.game_info.push({
      data: { phase: GAME_PHASES.PLAYING, level: gameState.currentLevel + 1 },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}