// input.js - Input handling

import {
  gameState,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE
} from './globals.js';

import { initializeGame, fireWeapon, startReload, toggleZoom, resetGame } from './gameLogic.js';

export function handleKeyPressed(p) {
  const key = p.key;
  const keyCode = p.keyCode;
  
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Phase transitions
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === PHASE_START) {
      initializeGame(p);
    }
    return;
  }
  
  if (keyCode === 27) { // ESC
    if (gameState.gamePhase === PHASE_PLAYING) {
      gameState.gamePhase = PHASE_PAUSED;
      p.logs.game_info.push({
        data: { phase: PHASE_PAUSED },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === PHASE_PAUSED) {
      gameState.gamePhase = PHASE_PLAYING;
      p.logs.game_info.push({
        data: { phase: PHASE_PLAYING },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  if (keyCode === 82) { // R
    if (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
      resetGame();
      p.logs.game_info.push({
        data: { phase: PHASE_START, message: "Game reset" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  // Gameplay controls
  if (gameState.gamePhase === PHASE_PLAYING) {
    // Arrow keys
    if (keyCode === 37) gameState.keys.left = true;  // LEFT
    if (keyCode === 39) gameState.keys.right = true; // RIGHT
    if (keyCode === 38) gameState.keys.up = true;    // UP
    if (keyCode === 40) gameState.keys.down = true;  // DOWN
    
    // Space - fire
    if (keyCode === 32) {
      gameState.keys.space = true;
      fireWeapon(p);
    }
    
    // Shift - zoom
    if (keyCode === 16) {
      if (!gameState.keys.shift) {
        toggleZoom();
      }
      gameState.keys.shift = true;
    }
    
    // Z - reload
    if (keyCode === 90) {
      gameState.keys.z = true;
      startReload();
    }
  }
}

export function handleKeyReleased(p) {
  const keyCode = p.keyCode;
  
  // Log input
  p.logs.inputs.push({
    input_type: "keyReleased",
    data: { key: p.key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  if (gameState.gamePhase === PHASE_PLAYING) {
    if (keyCode === 37) gameState.keys.left = false;
    if (keyCode === 39) gameState.keys.right = false;
    if (keyCode === 38) gameState.keys.up = false;
    if (keyCode === 40) gameState.keys.down = false;
    if (keyCode === 32) gameState.keys.space = false;
    if (keyCode === 16) gameState.keys.shift = false;
    if (keyCode === 90) gameState.keys.z = false;
  }
}

export function processAutomatedInput(p, action) {
  if (!action) return;
  
  // Reset keys
  gameState.keys = {
    left: false,
    right: false,
    up: false,
    down: false,
    space: false,
    shift: false,
    z: false
  };
  
  // Process automated action
  if (action.left) gameState.keys.left = true;
  if (action.right) gameState.keys.right = true;
  if (action.up) gameState.keys.up = true;
  if (action.down) gameState.keys.down = true;
  
  if (action.fire) {
    gameState.keys.space = true;
    fireWeapon(p);
  }
  
  if (action.zoom && !gameState.keys.shift) {
    toggleZoom();
    gameState.keys.shift = true;
  }
  
  if (action.reload) {
    gameState.keys.z = true;
    startReload();
  }
}