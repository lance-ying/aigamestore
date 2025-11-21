// input_handler.js - Handle all keyboard inputs

import { gameState, GAME_PHASES, UI_MODES, GRID_COLS, GRID_ROWS, PRODUCT_TYPES } from './globals.js';
import { initializeGame } from './game_logic.js';
import { placeShelf, stockShelf, hireStaff, expandStore } from './game_logic.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });

  // Phase transitions
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === GAME_PHASES.START) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      initializeGame(p);
      p.logs.game_info.push({
        data: { phase: "PLAYING" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }

  if (keyCode === 27) { // ESC
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.gamePhase = GAME_PHASES.PAUSED;
      p.logs.game_info.push({
        data: { phase: "PAUSED" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { phase: "PLAYING" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }

  if (keyCode === 82) { // R
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      gameState.gamePhase = GAME_PHASES.START;
      p.logs.game_info.push({
        data: { phase: "START" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }

  // Gameplay controls (only during PLAYING phase)
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;

  // Time scale control (Shift)
  if (keyCode === 16) { // SHIFT
    gameState.timeScale = 3;
  }

  // Mode selection (number keys)
  if (keyCode === 49) { // 1 - Place shelf
    gameState.uiMode = UI_MODES.PLACE_SHELF;
    gameState.cursorX = 2;
    gameState.cursorY = 2;
  } else if (keyCode === 50) { // 2 - Stock product
    gameState.uiMode = UI_MODES.STOCK_PRODUCT;
    gameState.cursorX = 2;
    gameState.cursorY = 2;
    gameState.selectedShelf = null;
    gameState.menuSelection = 0;
  } else if (keyCode === 51) { // 3 - Hire staff
    gameState.uiMode = UI_MODES.HIRE_STAFF;
  } else if (keyCode === 52) { // 4 - Expand store
    gameState.uiMode = UI_MODES.EXPAND_STORE;
    gameState.cursorX = 2;
    gameState.cursorY = 2;
  }

  // Cancel (Z)
  if (keyCode === 90) { // Z
    gameState.uiMode = UI_MODES.NORMAL;
    gameState.selectedShelf = null;
    gameState.selectedProductType = null;
  }

  // Mode-specific controls
  if (gameState.uiMode === UI_MODES.PLACE_SHELF) {
    handlePlaceShelfInput(p, keyCode);
  } else if (gameState.uiMode === UI_MODES.STOCK_PRODUCT) {
    handleStockProductInput(p, keyCode);
  } else if (gameState.uiMode === UI_MODES.HIRE_STAFF) {
    handleHireStaffInput(p, keyCode);
  } else if (gameState.uiMode === UI_MODES.EXPAND_STORE) {
    handleExpandStoreInput(p, keyCode);
  }
}

export function handleKeyReleased(p, key, keyCode) {
  p.logs.inputs.push({
    input_type: "keyReleased",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });

  if (keyCode === 16) { // SHIFT
    gameState.timeScale = 1;
  }
}

function handlePlaceShelfInput(p, keyCode) {
  if (keyCode === 37) { // LEFT
    gameState.cursorX = Math.max(0, gameState.cursorX - 1);
  } else if (keyCode === 39) { // RIGHT
    gameState.cursorX = Math.min(GRID_COLS - 1, gameState.cursorX + 1);
  } else if (keyCode === 38) { // UP
    gameState.cursorY = Math.max(0, gameState.cursorY - 1);
  } else if (keyCode === 40) { // DOWN
    gameState.cursorY = Math.min(GRID_ROWS - 1, gameState.cursorY + 1);
  } else if (keyCode === 32) { // SPACE
    if (placeShelf(p, gameState.cursorX, gameState.cursorY)) {
      gameState.uiMode = UI_MODES.NORMAL;
    }
  }
}

function handleStockProductInput(p, keyCode) {
  if (!gameState.selectedShelf) {
    // Navigate to select shelf
    if (keyCode === 37) { // LEFT
      gameState.cursorX = Math.max(0, gameState.cursorX - 1);
    } else if (keyCode === 39) { // RIGHT
      gameState.cursorX = Math.min(GRID_COLS - 1, gameState.cursorX + 1);
    } else if (keyCode === 38) { // UP
      gameState.cursorY = Math.max(0, gameState.cursorY - 1);
    } else if (keyCode === 40) { // DOWN
      gameState.cursorY = Math.min(GRID_ROWS - 1, gameState.cursorY + 1);
    } else if (keyCode === 32) { // SPACE
      const cell = gameState.grid[gameState.cursorY][gameState.cursorX];
      if (cell.shelf) {
        gameState.selectedShelf = cell.shelf;
      }
    }
  } else {
    // Select product type
    if (keyCode === 38) { // UP
      gameState.menuSelection = Math.max(0, gameState.menuSelection - 1);
    } else if (keyCode === 40) { // DOWN
      gameState.menuSelection = Math.min(gameState.unlockedProducts.length - 1, gameState.menuSelection + 1);
    } else if (keyCode === 32) { // SPACE
      const productKey = gameState.unlockedProducts[gameState.menuSelection];
      if (stockShelf(gameState.selectedShelf, productKey)) {
        gameState.uiMode = UI_MODES.NORMAL;
      }
    }
  }
}

function handleHireStaffInput(p, keyCode) {
  if (keyCode === 32) { // SPACE
    if (hireStaff(p)) {
      gameState.uiMode = UI_MODES.NORMAL;
    }
  }
}

function handleExpandStoreInput(p, keyCode) {
  if (keyCode === 37) { // LEFT
    gameState.cursorX = Math.max(0, gameState.cursorX - 1);
  } else if (keyCode === 39) { // RIGHT
    gameState.cursorX = Math.min(GRID_COLS - 1, gameState.cursorX + 1);
  } else if (keyCode === 38) { // UP
    gameState.cursorY = Math.max(0, gameState.cursorY - 1);
  } else if (keyCode === 40) { // DOWN
    gameState.cursorY = Math.min(GRID_ROWS - 1, gameState.cursorY + 1);
  } else if (keyCode === 32) { // SPACE
    if (expandStore(p, gameState.cursorX, gameState.cursorY)) {
      gameState.uiMode = UI_MODES.NORMAL;
    }
  }
}