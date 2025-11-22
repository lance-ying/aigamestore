// input_handler.js - Input handling

import { 
  gameState, 
  PHASE_START, 
  PHASE_PLAYING, 
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE
} from './globals.js';
import { rotateLeft, rotateRight, flip } from './game_logic.js';
import { startGame, resetGame, pauseGame, unpauseGame } from './game_manager.js';

let keysPressed = new Set();
let lastKeyPressTime = {};

export function handleKeyPressed(p) {
  const key = p.key;
  const keyCode = p.keyCode;
  
  // Log input
  p.logs.inputs.push({
    input_type: 'keyPressed',
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // ENTER - Start game
  if (keyCode === 13) {
    if (gameState.gamePhase === PHASE_START) {
      startGame(p);
    }
    return;
  }
  
  // ESC - Pause/Unpause
  if (keyCode === 27) {
    if (gameState.gamePhase === PHASE_PLAYING) {
      pauseGame(p);
    } else if (gameState.gamePhase === PHASE_PAUSED) {
      unpauseGame(p);
    }
    return;
  }
  
  // R - Restart
  if (keyCode === 82) {
    if (gameState.gamePhase === PHASE_GAME_OVER_WIN || 
        gameState.gamePhase === PHASE_GAME_OVER_LOSE ||
        gameState.gamePhase === PHASE_PAUSED) {
      resetGame(p);
    }
    return;
  }
  
  // Track keys for gameplay
  if (!keysPressed.has(keyCode)) {
    keysPressed.add(keyCode);
    lastKeyPressTime[keyCode] = Date.now();
  }
}

export function handleKeyReleased(p) {
  const keyCode = p.keyCode;
  keysPressed.delete(keyCode);
  delete lastKeyPressTime[keyCode];
}

export function processGameplayInputs(p) {
  if (gameState.gamePhase !== PHASE_PLAYING) return;
  
  if (gameState.controlMode === 'HUMAN') {
    // Left arrow - move left (discrete)
    if (keysPressed.has(37)) {
      const timeSincePress = Date.now() - (lastKeyPressTime[37] || 0);
      if (timeSincePress < 50) { // Only register once per press
        rotateLeft();
      }
    }
    
    // Right arrow - move right (discrete)
    if (keysPressed.has(39)) {
      const timeSincePress = Date.now() - (lastKeyPressTime[39] || 0);
      if (timeSincePress < 50) { // Only register once per press
        rotateRight();
      }
    }
    
    // Space - flip
    if (keysPressed.has(32)) {
      const timeSincePress = Date.now() - (lastKeyPressTime[32] || 0);
      if (timeSincePress < 50) { // Only register once per press
        flip();
      }
    }
  } else {
    // Automated testing mode
    if (typeof window.get_automated_testing_action === 'function') {
      const action = window.get_automated_testing_action(gameState);
      if (action) {
        if (action.left) rotateLeft();
        if (action.right) rotateRight();
        if (action.flip) flip();
      }
    }
  }
}

export function resetKeys() {
  keysPressed.clear();
  lastKeyPressTime = {};
}