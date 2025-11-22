// game_manager.js - Game state management

import { 
  gameState, 
  PHASE_START,
  PHASE_LEVEL_SELECT,
  PHASE_PLAYING, 
  PHASE_PAUSED,
  NUM_SEGMENTS,
  MAX_LIVES,
  LEVELS
} from './globals.js';
import { Player } from './player.js';
import { resetKeys } from './input_handler.js';

export function showLevelSelect(p) {
  gameState.gamePhase = PHASE_LEVEL_SELECT;
  resetKeys();
  
  if (p) {
    p.logs.game_info.push({
      data: { phase: PHASE_LEVEL_SELECT },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

export function startGame(p, levelNumber = null) {
  // If levelNumber provided, use it; otherwise use currentLevel
  if (levelNumber !== null) {
    gameState.currentLevel = levelNumber;
  }
  
  gameState.levelConfig = LEVELS[gameState.currentLevel - 1];
  gameState.gamePhase = PHASE_PLAYING;
  gameState.score = 0;
  gameState.lives = MAX_LIVES;
  gameState.tunnelRotation = 0;
  gameState.playerSegment = 2;
  gameState.scrollOffset = 0;
  gameState.speed = gameState.levelConfig.initialSpeed;
  gameState.gameTime = 0;
  gameState.obstacles = [];
  gameState.entities = [];
  gameState.particles = [];
  gameState.isFlipping = false;
  gameState.flipProgress = 0;
  gameState.isMovingLane = false;
  gameState.laneMoveProgress = 0;
  gameState.nextObstacleId = 0;
  gameState.lastObstacleZ = 0;
  gameState.laneSwitchCooldown = 0;
  gameState.screenShake = 0;
  gameState.hitFlashAlpha = 0;
  gameState.invulnerableTime = 0;
  
  // Create player at bottom segment
  gameState.player = new Player(2);
  gameState.entities.push(gameState.player);
  
  resetKeys();
  
  p.logs.game_info.push({
    data: { phase: PHASE_PLAYING, level: gameState.currentLevel },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function resetGame(p) {
  gameState.gamePhase = PHASE_START;
  gameState.obstacles = [];
  gameState.entities = [];
  gameState.particles = [];
  gameState.player = null;
  gameState.lives = MAX_LIVES;
  gameState.currentLevel = 1;
  gameState.screenShake = 0;
  gameState.hitFlashAlpha = 0;
  gameState.invulnerableTime = 0;
  resetKeys();
  
  p.logs.game_info.push({
    data: { phase: PHASE_START },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function pauseGame(p) {
  gameState.gamePhase = PHASE_PAUSED;
  p.logs.game_info.push({
    data: { phase: PHASE_PAUSED },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function unpauseGame(p) {
  gameState.gamePhase = PHASE_PLAYING;
  p.logs.game_info.push({
    data: { phase: PHASE_PLAYING },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}