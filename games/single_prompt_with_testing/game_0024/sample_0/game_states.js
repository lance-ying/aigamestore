// game_states.js - Game state management

import {
  gameState,
  resetGameState,
  PHASE_START,
  PHASE_PLAYING,
  CANVAS_WIDTH,
  CANVAS_HEIGHT
} from './globals.js';
import { Player } from './entities.js';
import { createWorld } from './world.js';

export function startGame(p) {
  resetGameState();
  
  // Create player
  gameState.player = new Player(100, 100);
  
  // Create world
  createWorld();
  
  // Set game phase
  gameState.gamePhase = PHASE_PLAYING;
  gameState.startTime = Date.now();
  
  // Log
  p.logs.game_info.push({
    data: { phase: PHASE_PLAYING },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function resetGame(p) {
  resetGameState();
  gameState.gamePhase = PHASE_START;
  
  p.logs.game_info.push({
    data: { phase: PHASE_START },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}