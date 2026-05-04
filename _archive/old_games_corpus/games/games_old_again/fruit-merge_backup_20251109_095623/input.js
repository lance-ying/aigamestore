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
  
  // Set key state (for continuous input)
  keys[keyCode] = true;
  
  // Prevent repeat events for action keys only
  const isActionKey = keyCode === 32 || keyCode === 40 || keyCode === 83 || 
                      keyCode === 13 || keyCode === 27 || keyCode === 82;
  
  if (isActionKey && keys[`action_${keyCode}`]) return;
  if (isActionKey) keys[`action_${keyCode}`] = true;
  
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
    
    // Down arrow or S for drop
    if (keyCode === 40 || keyCode === 83) {
      dropCurrentFruit(false);
    }
  }
}

function handleKeyUp(e) {
  const keyCode = e.keyCode;
  keys[keyCode] = false;
  keys[`action_${keyCode}`] = false;
  
  logs.inputs.push({
    input_type: 'keyup',
    data: { key: e.key, keyCode: keyCode },
    framecount: gameState.frameCount,
    timestamp: Date.now()
  });
}

export function updateInput() {
  // Continuous movement input - runs every frame
  if (gameState.gamePhase === 'PLAYING' && !gameState.isDropping) {
    const currentFruitRadius = FRUIT_TYPES[gameState.currentFruitType].radius;
    const moveDistance = 5; // Per-frame movement for smooth continuous input
    const minX = CONTAINER_X - CONTAINER_WIDTH / 2 + currentFruitRadius;
    const maxX = CONTAINER_X + CONTAINER_WIDTH / 2 - currentFruitRadius;
    
    // Left arrow (37) or A (65)
    if (keys[37] || keys[65]) {
      gameState.dropX = Math.max(minX, gameState.dropX - moveDistance);
    }
    
    // Right arrow (39) or D (68)
    if (keys[39] || keys[68]) {
      gameState.dropX = Math.min(maxX, gameState.dropX + moveDistance);
    }
  }
}

export { keys };