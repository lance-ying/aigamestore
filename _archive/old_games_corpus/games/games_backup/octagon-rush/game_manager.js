// game_manager.js - Game state management

import { 
  gameState, 
  PHASE_START, 
  PHASE_PLAYING, 
  PHASE_PAUSED,
  INITIAL_SPEED,
  NUM_SEGMENTS,
  MAX_LIVES
} from './globals.js';
import { Player } from './player.js';
import { resetKeys } from './input_handler.js';

export function startGame(p) {
  gameState.gamePhase = PHASE_PLAYING;
  gameState.score = 0;
  gameState.lives = MAX_LIVES;
  gameState.tunnelRotation = 0; // Fixed at 0 for discrete movement
  gameState.playerSegment = 2; // Start at bottom segment (segment 2)
  gameState.scrollOffset = 0;
  gameState.speed = INITIAL_SPEED;
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
    data: { phase: PHASE_PLAYING },
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