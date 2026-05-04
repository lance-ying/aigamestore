// input_handler.js - Input handling for player controls

import { gameState, BUILDING_TYPES, GRID_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { placeBuilding, deleteBuilding } from './game_logic.js';

const CAMERA_SPEED = 4;

export function handleInput(p) {
  if (gameState.controlMode !== 'HUMAN') return;
  
  if (gameState.gamePhase === 'PLAYING') {
    handlePlayingInput(p);
  }
}

function handlePlayingInput(p) {
  // Camera movement
  if (p.keyIsDown(37)) { // LEFT
    gameState.camera.x = Math.max(0, gameState.camera.x - CAMERA_SPEED);
  }
  if (p.keyIsDown(39)) { // RIGHT
    gameState.camera.x = Math.min(800 * GRID_SIZE - CANVAS_WIDTH, gameState.camera.x + CAMERA_SPEED);
  }
  if (p.keyIsDown(38)) { // UP
    gameState.camera.y = Math.max(0, gameState.camera.y - CAMERA_SPEED);
  }
  if (p.keyIsDown(40)) { // DOWN
    gameState.camera.y = Math.min(600 * GRID_SIZE - CANVAS_HEIGHT, gameState.camera.y + CAMERA_SPEED);
  }
  
  // Update cursor position
  gameState.cursor.gridX = Math.floor((gameState.camera.x + CANVAS_WIDTH / 2) / GRID_SIZE);
  gameState.cursor.gridY = Math.floor((gameState.camera.y + CANVAS_HEIGHT / 2) / GRID_SIZE);
}

export function handleKeyPressed(p) {
  const keyCode = p.keyCode;
  
  // Log input
  p.logs.inputs.push({
    input_type: 'keyPressed',
    data: { key: p.key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Global keys
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === 'START') {
      gameState.gamePhase = 'PLAYING';
      p.logs.game_info.push({
        data: { gamePhase: 'PLAYING' },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  } else if (keyCode === 27) { // ESC
    if (gameState.gamePhase === 'PLAYING') {
      gameState.gamePhase = 'PAUSED';
      p.logs.game_info.push({
        data: { gamePhase: 'PAUSED' },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === 'PAUSED') {
      gameState.gamePhase = 'PLAYING';
      p.logs.game_info.push({
        data: { gamePhase: 'PLAYING' },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  } else if (keyCode === 82) { // R
    if (gameState.gamePhase.startsWith('GAME_OVER')) {
      gameState.gamePhase = 'START';
      p.logs.game_info.push({
        data: { gamePhase: 'START' },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  // Playing phase keys
  if (gameState.gamePhase === 'PLAYING' && gameState.controlMode === 'HUMAN') {
    if (keyCode === 32) { // SPACE - Place building
      placeBuilding(gameState.cursor.gridX, gameState.cursor.gridY, gameState.selectedBuilding, p);
    } else if (keyCode === 90) { // Z - Delete building
      deleteBuilding(gameState.cursor.gridX, gameState.cursor.gridY);
    } else if (keyCode === 16) { // SHIFT - Cycle building
      const types = Object.values(BUILDING_TYPES);
      const currentIndex = types.indexOf(gameState.selectedBuilding);
      gameState.selectedBuilding = types[(currentIndex + 1) % types.length];
    }
  }
}

export function handleKeyReleased(p) {
  p.logs.inputs.push({
    input_type: 'keyReleased',
    data: { key: p.key, keyCode: p.keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function processAutomatedInput(action, p) {
  if (!action) return;
  
  if (action.keyPressed) {
    for (const keyCode of action.keyPressed) {
      p.keyCode = keyCode;
      p.key = String.fromCharCode(keyCode);
      handleKeyPressed(p);
    }
  }
  
  if (action.keysHeld) {
    for (const keyCode of action.keysHeld) {
      // Simulate keyIsDown
      if (gameState.gamePhase === 'PLAYING') {
        if (keyCode === 37) gameState.camera.x = Math.max(0, gameState.camera.x - 4);
        if (keyCode === 39) gameState.camera.x = Math.min(800 * GRID_SIZE - CANVAS_WIDTH, gameState.camera.x + 4);
        if (keyCode === 38) gameState.camera.y = Math.max(0, gameState.camera.y - 4);
        if (keyCode === 40) gameState.camera.y = Math.min(600 * GRID_SIZE - CANVAS_HEIGHT, gameState.camera.y + 4);
      }
    }
  }
}