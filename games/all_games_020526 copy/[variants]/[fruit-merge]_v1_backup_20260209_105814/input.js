// input.js - Input handling

import { gameState, logs, CONTAINER_WIDTH, CONTAINER_X, CANVAS_WIDTH, FRUIT_TYPES } from './globals.js';
import { startGame, pauseGame, restartGame, dropCurrentFruit } from './game.js';

const keys = {};

export function setupInput() {
  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('keyup', handleKeyUp);
}

function handleKeyDown(e) {
  const keyCode = e.keyCode;
  
  // Log input
  logs.inputs.push({
    input_type: 'keydown',
    data: { key: e.key, keyCode: keyCode },
    framecount: gameState.frameCount,
    timestamp: Date.now()
  });
  
  // For toggle keys (like Enter, ESC, R), we only want to process the initial keydown event.
  // We use the 'keys' state to track if the key is already logically 'down' from a previous press.
  const isToggleKey = keyCode === 13 || keyCode === 27 || keyCode === 82; // Enter, ESC, R

  if (isToggleKey) {
    if (keys[keyCode]) { // If this toggle key is already marked as 'down', ignore this event (it's a repeat or held).
      return;
    }
  }

  // Mark key as down. This is done after the toggle key check to ensure 'keys[keyCode]'
  // is true for the first press of a toggle key, and for all presses of other keys.
  keys[keyCode] = true;
  
  // ENTER to start
  if (keyCode === 13 && gameState.gamePhase === 'START') {
    startGame();
    return;
  }
  
  // ESC to pause
  if (keyCode === 27 && gameState.gamePhase === 'PLAYING') {
    pauseGame();
    return;
  }
  
  // ESC to unpause
  if (keyCode === 27 && gameState.gamePhase === 'PAUSED') {
    gameState.gamePhase = 'PLAYING';
    logs.game_info.push({
      game_status: 'PLAYING',
      data: {},
      framecount: gameState.frameCount,
      timestamp: Date.now()
    });
    return;
  }
  
  // R to restart from game over
  if (keyCode === 82 && (gameState.gamePhase === 'GAME_OVER_WIN' || gameState.gamePhase === 'GAME_OVER_LOSE')) {
    restartGame();
    return;
  }
  
  // Gameplay controls (drop actions)
  // These are handled separately as 'isDropping' flag provides debouncing.
  if (gameState.gamePhase === 'PLAYING' && !gameState.isDropping) {
    // SPACE to quick drop
    if (keyCode === 32) {
      dropCurrentFruit(true);
      return;
    }
    
    // Down arrow or S for drop
    if (keyCode === 40 || keyCode === 83) {
      dropCurrentFruit(false);
    }
  }
}

function handleKeyUp(e) {
  const keyCode = e.keyCode;
  keys[keyCode] = false; // Mark key as up
  
  logs.inputs.push({
    input_type: 'keyup',
    data: { key: e.key, keyCode: keyCode },
    framecount: gameState.frameCount,
    timestamp: Date.now()
  });
}

// This function is called every frame to update game state based on held keys
export function updateInput() {
  if (gameState.gamePhase !== 'PLAYING' || gameState.isDropping) return;

  const fruitRadius = FRUIT_TYPES[gameState.currentFruitType].radius;
  const minX = CONTAINER_X - CONTAINER_WIDTH / 2 + fruitRadius;
  const maxX = CONTAINER_X + CONTAINER_WIDTH / 2 - fruitRadius;
  const moveSpeed = 5; // Pixels per frame

  // Left arrow (37) or A key (65)
  if (keys[37] || keys[65]) {
    gameState.dropX = Math.max(minX, gameState.dropX - moveSpeed);
  }
  // Right arrow (39) or D key (68)
  if (keys[39] || keys[68]) {
    gameState.dropX = Math.min(maxX, gameState.dropX + moveSpeed);
  }
}

export { keys };