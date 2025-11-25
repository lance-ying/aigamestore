// input.js - Input handling

import { gameState, GAME_PHASES, resetGameState } from './globals.js';

export const keys = {
  left: false,
  right: false,
  up: false,
  down: false,
  space: false,
  shift: false,
  z: false
};

export function handleKeyPressed(p, keyCode, key) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Game phase transitions
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === GAME_PHASES.START) {
      startGame(p);
    }
  } else if (keyCode === 27) { // ESC
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.gamePhase = GAME_PHASES.PAUSED;
      p.logs.game_info.push({
        data: { gamePhase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { gamePhase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  } else if (keyCode === 82) { // R
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      resetGameState();
      gameState.gamePhase = GAME_PHASES.START;
      p.logs.game_info.push({
        data: { gamePhase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  // Gameplay keys
  if (gameState.gamePhase === GAME_PHASES.PLAYING && gameState.controlMode === "HUMAN") {
    updateKeysPressed(keyCode, key, true);
  }
}

export function handleKeyReleased(p, keyCode, key) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyReleased",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  if (gameState.gamePhase === GAME_PHASES.PLAYING && gameState.controlMode === "HUMAN") {
    updateKeysPressed(keyCode, key, false);
  }
}

function updateKeysPressed(keyCode, key, pressed) {
  if (keyCode === 37) keys.left = pressed;
  if (keyCode === 39) keys.right = pressed;
  if (keyCode === 38) keys.up = pressed;
  if (keyCode === 40) keys.down = pressed;
  if (keyCode === 32) keys.space = pressed;
  if (keyCode === 16) keys.shift = pressed;
  if (keyCode === 90) keys.z = pressed;
}

function startGame(p) {
  resetGameState();
  gameState.gamePhase = GAME_PHASES.PLAYING;
  gameState.framesSinceStart = 0;
  
  p.logs.game_info.push({
    data: { gamePhase: gameState.gamePhase },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function processAutomatedInput(action) {
  // Reset all keys
  keys.left = false;
  keys.right = false;
  keys.up = false;
  keys.down = false;
  keys.space = false;
  keys.shift = false;
  keys.z = false;
  
  // Set keys based on action
  if (action.left) keys.left = true;
  if (action.right) keys.right = true;
  if (action.up) keys.up = true;
  if (action.down) keys.down = true;
  if (action.space) keys.space = true;
  if (action.shift) keys.shift = true;
  if (action.z) keys.z = true;
}