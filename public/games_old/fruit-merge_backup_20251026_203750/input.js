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
  
  // Prevent repeat events
  if (keys[keyCode]) return;
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
  
  // Gameplay controls
  if (gameState.gamePhase === 'PLAYING' && !gameState.isDropping) {
    // SPACE to quick drop
    if (keyCode === 32) {
      dropCurrentFruit(true);
      return;
    }
    
    // Movement with smaller, more precise steps
    const currentFruitRadius = FRUIT_TYPES[gameState.nextFruitType].radius;
    const moveDistance = 15; // Reduced from 50 for better accuracy
    const minX = CONTAINER_X - CONTAINER_WIDTH / 2 + currentFruitRadius;
    const maxX = CONTAINER_X + CONTAINER_WIDTH / 2 - currentFruitRadius;
    
    // Left arrow or A
    if (keyCode === 37 || keyCode === 65) {
      gameState.dropX = Math.max(minX, gameState.dropX - moveDistance);
    }
    
    // Right arrow or D
    if (keyCode === 39 || keyCode === 68) {
      gameState.dropX = Math.min(maxX, gameState.dropX + moveDistance);
    }
    
    // Down arrow or S for faster drop
    if (keyCode === 40 || keyCode === 83) {
      dropCurrentFruit(false);
    }
  }
}

function handleKeyUp(e) {
  const keyCode = e.keyCode;
  keys[keyCode] = false;
  
  logs.inputs.push({
    input_type: 'keyup',
    data: { key: e.key, keyCode: keyCode },
    framecount: gameState.frameCount,
    timestamp: Date.now()
  });
}

export function updateInput() {
  // Input is now handled via single key presses in handleKeyDown
  // This function can be kept for future frame-based input needs
}

export { keys };