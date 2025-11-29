// input.js - Input handling

import { gameState, KEYS, GAME_PHASES } from './globals.js';
import { startRound, advanceRound, resetGame } from './game_logic.js';

// Initialize key state
export function initInput() {
  gameState.keys = {};
}

// Handle key press
export function handleKeyPress(p, keyCode) {
  gameState.keys[keyCode] = true;
  
  // Log input
  if (p.logs && p.logs.inputs) {
    p.logs.inputs.push({
      input_type: 'keyPressed',
      data: { keyCode: keyCode },
      framecount: gameState.frameCount,
      timestamp: Date.now()
    });
  }
  
  // Phase controls
  if (keyCode === KEYS.ENTER) {
    if (gameState.gamePhase === GAME_PHASES.START) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      startRound();
      
      if (p.logs && p.logs.game_info) {
        p.logs.game_info.push({
          data: { gamePhase: GAME_PHASES.PLAYING },
          framecount: gameState.frameCount,
          timestamp: Date.now()
        });
      }
    }
  }
  
  if (keyCode === KEYS.ESC) {
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.gamePhase = GAME_PHASES.PAUSED;
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
    }
  }
  
  if (keyCode === KEYS.R) {
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      resetGame();
      gameState.gamePhase = GAME_PHASES.START;
    }
  }
}

// Handle key release
export function handleKeyRelease(p, keyCode) {
  gameState.keys[keyCode] = false;
  
  // Log input
  if (p.logs && p.logs.inputs) {
    p.logs.inputs.push({
      input_type: 'keyReleased',
      data: { keyCode: keyCode },
      framecount: gameState.frameCount,
      timestamp: Date.now()
    });
  }
  
  // Handle grab release
  if ((keyCode === KEYS.LEFT || keyCode === KEYS.RIGHT) && gameState.player) {
    // Don't auto-release on key up
  }
  
  if (keyCode === KEYS.UP && gameState.player) {
    gameState.player.pullStrength = 0;
  }
}

// Process gameplay inputs
export function processGameplayInputs() {
  if (!gameState.player || gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  const player = gameState.player;
  
  // Movement
  if (gameState.keys[KEYS.LEFT]) {
    player.moveLeft();
  }
  
  if (gameState.keys[KEYS.RIGHT]) {
    player.moveRight();
  }
  
  // Jump
  if (gameState.keys[KEYS.SPACE]) {
    player.jump();
    gameState.keys[KEYS.SPACE] = false; // Prevent holding
  }
  
  // Sprint
  player.isSprinting = gameState.keys[KEYS.SHIFT];
  
  // Grab
  if (gameState.keys[KEYS.LEFT] && !gameState.isGrabbing) {
    player.startGrab('left');
  }
  
  if (gameState.keys[KEYS.RIGHT] && !gameState.isGrabbing) {
    player.startGrab('right');
  }
  
  // Quick grab
  if (gameState.keys[KEYS.Z] && !gameState.isGrabbing) {
    player.quickGrab();
    gameState.keys[KEYS.Z] = false;
  }
  
  // Pull up
  if (gameState.keys[KEYS.UP] && gameState.isGrabbing) {
    player.pull();
  }
  
  // Release/drop
  if (gameState.keys[KEYS.DOWN]) {
    player.releaseGrab();
    gameState.keys[KEYS.DOWN] = false;
  }
}

// Check if key is pressed
export function isKeyPressed(keyCode) {
  return gameState.keys[keyCode] === true;
}