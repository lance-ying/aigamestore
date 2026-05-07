// input_handler.js - Input handling

import { 
  gameState, 
  PHASE_START,
  PHASE_LEVEL_SELECT,
  PHASE_PLAYING, 
  PHASE_PAUSED,
  PHASE_LEVEL_COMPLETE,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE,
  LEVELS
} from './globals.js';
import { rotateLeft, rotateRight, flip } from './game_logic.js';
import { startGame, resetGame, pauseGame, unpauseGame } from './game_manager.js';

let keysPressed = new Set();
let keyProcessed = {};

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
  
  // ENTER - Start game or continue
  if (keyCode === 13) {
    if (gameState.gamePhase === PHASE_START) {
      startGame(p);
    } else if (gameState.gamePhase === PHASE_LEVEL_COMPLETE) {
      // Advance to next level
      gameState.currentLevel++;
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
  
  // Track keys for gameplay - mark as not yet processed
  if (!keysPressed.has(keyCode)) {
    keysPressed.add(keyCode);
    keyProcessed[keyCode] = false;
  }
}

export function handleKeyReleased(p) {
  const keyCode = p.keyCode;
  keysPressed.delete(keyCode);
  delete keyProcessed[keyCode];
}

export function processGameplayInputs(p) {
  if (gameState.gamePhase !== PHASE_PLAYING) return;
  
  // Left arrow - move left (discrete)
  if (keysPressed.has(37) && !keyProcessed[37]) {
    rotateLeft();
    keyProcessed[37] = true;
  }
  
  // Right arrow - move right (discrete)
  if (keysPressed.has(39) && !keyProcessed[39]) {
    rotateRight();
    keyProcessed[39] = true;
  }
  
  // Space - flip across
  if (keysPressed.has(32) && !keyProcessed[32]) {
    flip();
    keyProcessed[32] = true;
  }
}

export function resetKeys() {
  keysPressed.clear();
  keyProcessed = {};
}