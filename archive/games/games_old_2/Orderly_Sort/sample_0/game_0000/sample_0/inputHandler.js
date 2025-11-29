// inputHandler.js - Input handling for human and automated testing

import { gameState, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE, CONTROL_MODE_HUMAN } from './globals.js';
import { handlePickupOrDrop } from './gameLogic.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: 'keyPressed',
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // ENTER - Start game
  if (keyCode === 13 && gameState.gamePhase === PHASE_START) {
    startGame(p);
    return;
  }
  
  // R - Restart
  if (keyCode === 82) {
    restartGame(p);
    return;
  }
  
  // ESC - Pause/Unpause
  if (keyCode === 27 && (gameState.gamePhase === PHASE_PLAYING || gameState.gamePhase === PHASE_PAUSED)) {
    togglePause(p);
    return;
  }
  
  // Gameplay controls
  if (gameState.gamePhase === PHASE_PLAYING && gameState.controlMode === CONTROL_MODE_HUMAN) {
    handleGameplayInput(p, keyCode);
  }
}

function handleGameplayInput(p, keyCode) {
  const selector = gameState.player;
  
  switch (keyCode) {
    case 37: // Left arrow
      selector.moveLeft();
      break;
    case 38: // Up arrow
      selector.moveUp();
      break;
    case 39: // Right arrow
      selector.moveRight();
      break;
    case 40: // Down arrow
      selector.moveDown();
      break;
    case 32: // Space
      handlePickupOrDrop(p);
      break;
  }
}

function startGame(p) {
  const { initializeLevel } = require('./levelManager.js');
  gameState.currentLevel = 1;
  gameState.score = 0;
  gameState.gamePhase = PHASE_PLAYING;
  
  initializeLevel(p, 1);
  gameState.player.updateGridPositions();
  
  p.logs.game_info.push({
    event: 'game_start',
    data: { level: 1 },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function restartGame(p) {
  gameState.gamePhase = PHASE_START;
  gameState.currentLevel = 1;
  gameState.score = 0;
  gameState.timeRemaining = 0;
  gameState.items = [];
  gameState.containers = [];
  gameState.entities = [];
  gameState.isHoldingItem = false;
  gameState.heldItemId = null;
  
  p.logs.game_info.push({
    event: 'restart',
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function togglePause(p) {
  if (gameState.gamePhase === PHASE_PLAYING) {
    gameState.gamePhase = PHASE_PAUSED;
    p.logs.game_info.push({
      event: 'pause',
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  } else if (gameState.gamePhase === PHASE_PAUSED) {
    gameState.gamePhase = PHASE_PLAYING;
    p.logs.game_info.push({
      event: 'unpause',
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

export function setControlMode(mode) {
  gameState.controlMode = mode;
  console.log(`Control mode set to: ${mode}`);
}