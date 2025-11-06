// input.js - Input handling

import { 
  gameState, 
  PHASE_START, 
  PHASE_PLAYING, 
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE,
  MIN_DROP_X,
  MAX_DROP_X
} from './globals.js';

import { dropBall } from './gameplay.js';
import { resetGame } from './game.js';

export function handleKeyPressed(p) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: p.key, keyCode: p.keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Phase control keys
  if (p.keyCode === 13 && gameState.gamePhase === PHASE_START) { // ENTER
    gameState.gamePhase = PHASE_PLAYING;
    p.logs.game_info.push({
      data: { gamePhase: PHASE_PLAYING },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  if (p.keyCode === 27) { // ESC
    if (gameState.gamePhase === PHASE_PLAYING) {
      gameState.gamePhase = PHASE_PAUSED;
      p.logs.game_info.push({
        data: { gamePhase: PHASE_PAUSED },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === PHASE_PAUSED) {
      gameState.gamePhase = PHASE_PLAYING;
      p.logs.game_info.push({
        data: { gamePhase: PHASE_PLAYING },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  if (p.keyCode === 82) { // R
    if (gameState.gamePhase === PHASE_GAME_OVER_WIN || 
        gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
      resetGame(p);
      gameState.gamePhase = PHASE_START;
      p.logs.game_info.push({
        data: { gamePhase: PHASE_START },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  // Gameplay controls
  if (gameState.gamePhase === PHASE_PLAYING) {
    // Drop ball
    if (p.keyCode === 32) { // SPACE
      dropBall(p);
    }
    
    // Move drop position (handled in keyIsDown for continuous movement)
  }
}

export function handleContinuousInput(p) {
  if (gameState.gamePhase !== PHASE_PLAYING) return;
  
  const moveSpeed = 3;
  
  // Left arrow or A
  if (p.keyIsDown(37) || p.keyIsDown(65)) {
    gameState.dropX = Math.max(MIN_DROP_X, gameState.dropX - moveSpeed);
  }
  
  // Right arrow or D
  if (p.keyIsDown(39) || p.keyIsDown(68)) {
    gameState.dropX = Math.min(MAX_DROP_X, gameState.dropX + moveSpeed);
  }
}