// input.js - Input handling

import { gameState, GRID_COLS, GRID_ROWS, FACILITY_TYPES } from './globals.js';
import { placeFacility } from './gameLogic.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: 'keyPressed',
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });

  if (gameState.gamePhase === 'START') {
    if (keyCode === 13) { // ENTER
      startGame(p);
    }
  } else if (gameState.gamePhase === 'PLAYING') {
    if (keyCode === 27) { // ESC
      pauseGame(p);
    } else if (keyCode === 90) { // Z
      gameState.menuOpen = !gameState.menuOpen;
      if (!gameState.menuOpen) {
        gameState.selectedFacility = null;
      }
    } else if (keyCode === 32) { // SPACE
      if (gameState.selectedFacility && !gameState.menuOpen) {
        placeFacility(p);
      }
    } else if (keyCode === 37) { // LEFT
      if (gameState.menuOpen) {
        gameState.menuIndex = Math.max(0, gameState.menuIndex - 1);
      } else {
        gameState.selectedTile.x = Math.max(0, gameState.selectedTile.x - 1);
      }
    } else if (keyCode === 39) { // RIGHT
      if (gameState.menuOpen) {
        const unlockedCount = gameState.unlockedFacilities.length;
        gameState.menuIndex = Math.min(unlockedCount - 1, gameState.menuIndex + 1);
      } else {
        gameState.selectedTile.x = Math.min(GRID_COLS - 1, gameState.selectedTile.x + 1);
      }
    } else if (keyCode === 38) { // UP
      if (!gameState.menuOpen) {
        gameState.selectedTile.y = Math.max(0, gameState.selectedTile.y - 1);
      }
    } else if (keyCode === 40) { // DOWN
      if (!gameState.menuOpen) {
        gameState.selectedTile.y = Math.min(GRID_ROWS - 1, gameState.selectedTile.y + 1);
      }
    }
  } else if (gameState.gamePhase === 'PAUSED') {
    if (keyCode === 27) { // ESC
      unpauseGame(p);
    }
  } else if (gameState.gamePhase === 'GAME_OVER_WIN' || gameState.gamePhase === 'GAME_OVER_LOSE') {
    if (keyCode === 82) { // R
      restartGame(p);
    }
  }
}

function startGame(p) {
  gameState.gamePhase = 'PLAYING';
  p.logs.game_info.push({
    data: { phase: 'PLAYING' },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function pauseGame(p) {
  gameState.gamePhase = 'PAUSED';
  p.logs.game_info.push({
    data: { phase: 'PAUSED' },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function unpauseGame(p) {
  gameState.gamePhase = 'PLAYING';
  p.logs.game_info.push({
    data: { phase: 'PLAYING' },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function restartGame(p) {
  gameState.gamePhase = 'START';
  gameState.score = 0;
  gameState.money = 200;
  gameState.satisfaction = 0;
  gameState.snsFriends = 0;
  gameState.parkRating = 1.0;
  gameState.guests = [];
  gameState.facilities = [];
  gameState.entities = [];
  gameState.selectedFacility = null;
  gameState.menuOpen = false;
  gameState.menuIndex = 0;
  gameState.guestSpawnTimer = 0;
  gameState.selectedTile = { x: 0, y: 0 };
  gameState.unlockedFacilities = ['BASIC_POOL', 'RESTAURANT'];
  gameState.positionHistory = [];
  
  for (let i = 0; i < GRID_ROWS; i++) {
    for (let j = 0; j < GRID_COLS; j++) {
      gameState.gridOccupied[i][j] = null;
    }
  }
  
  p.logs.game_info.push({
    data: { phase: 'START' },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}