// input.js - Input handling

import { gameState, logs, CONTAINER_WIDTH, CONTAINER_X, CANVAS_WIDTH } from './globals.js';
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
  if (gameState.gamePhase !== 'PLAYING' || gameState.isDropping) return;
  
  const moveSpeed = 3;
  const minX = CONTAINER_X - CONTAINER_WIDTH / 2 + 30;
  const maxX = CONTAINER_X + CONTAINER_WIDTH / 2 - 30;
  
  // Left arrow or A
  if (keys[37] || keys[65]) {
    gameState.dropX = Math.max(minX, gameState.dropX - moveSpeed);
  }
  
  // Right arrow or D
  if (keys[39] || keys[68]) {
    gameState.dropX = Math.min(maxX, gameState.dropX + moveSpeed);
  }
  
  // Down arrow or S for faster drop
  if (keys[40] || keys[83]) {
    dropCurrentFruit(false);
  }
}

export { keys };