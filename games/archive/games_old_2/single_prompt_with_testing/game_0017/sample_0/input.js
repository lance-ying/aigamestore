// input.js - Input handling

import { gameState, GAME_PHASES, GRID_SIZE } from './globals.js';
import { isAdjacent, findAdjacentTiles, clearMatchedTiles, applyGravity } from './grid.js';
import { processTileEffect, enemyTurn, checkFloorComplete } from './combat.js';
import { initializeShop } from './shop.js';

export let cursorRow = 0;
export let cursorCol = 0;

export function setCursor(row, col) {
  cursorRow = Math.max(0, Math.min(GRID_SIZE - 1, row));
  cursorCol = Math.max(0, Math.min(GRID_SIZE - 1, col));
}

export function handleKeyPressed(p, keyCode) {
  const phase = gameState.gamePhase;
  
  // Log input
  p.logs.inputs.push({
    input_type: 'keyPressed',
    data: { key: p.key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Phase transitions
  if (keyCode === 13 && phase === GAME_PHASES.START) { // ENTER
    startGame(p);
    return;
  }
  
  if (keyCode === 27) { // ESC
    if (phase === GAME_PHASES.PLAYING) {
      gameState.gamePhase = GAME_PHASES.PAUSED;
      p.logs.game_info.push({
        data: { gamePhase: GAME_PHASES.PAUSED },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (phase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { gamePhase: GAME_PHASES.PLAYING },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  if (keyCode === 82) { // R
    resetGame(p);
    return;
  }
  
  // Gameplay controls
  if (phase === GAME_PHASES.PLAYING && gameState.turnDelay === 0) {
    handleGameplayInput(p, keyCode);
  }
}

function handleGameplayInput(p, keyCode) {
  // Arrow keys - move cursor
  if (keyCode === 37) { // LEFT
    setCursor(cursorRow, cursorCol - 1);
  } else if (keyCode === 38) { // UP
    setCursor(cursorRow - 1, cursorCol);
  } else if (keyCode === 39) { // RIGHT
    setCursor(cursorRow, cursorCol + 1);
  } else if (keyCode === 40) { // DOWN
    setCursor(cursorRow + 1, cursorCol);
  }
  
  // Space - select/confirm
  else if (keyCode === 32) {
    handleTileSelection(p);
  }
  
  // Shift - cancel selection
  else if (keyCode === 16) {
    gameState.selectedTiles = [];
  }
  
  // Z - shop toggle (not available during combat)
  else if (keyCode === 90 && gameState.enemies.length === 0) {
    gameState.shopOpen = !gameState.shopOpen;
    if (gameState.shopOpen) {
      initializeShop();
    }
  }
}

function handleTileSelection(p) {
  const tile = gameState.grid[cursorRow][cursorCol];
  if (!tile) return;
  
  if (gameState.selectedTiles.length === 0) {
    // First tile selected
    gameState.selectedTiles.push({ row: cursorRow, col: cursorCol });
  } else {
    // Check if this tile is adjacent and same type
    const lastSelected = gameState.selectedTiles[gameState.selectedTiles.length - 1];
    const lastTile = gameState.grid[lastSelected.row][lastSelected.col];
    
    if (isAdjacent({ row: cursorRow, col: cursorCol }, lastSelected)) {
      if (tile.type === lastTile.type) {
        // Add to selection
        const alreadySelected = gameState.selectedTiles.some(
          t => t.row === cursorRow && t.col === cursorCol
        );
        
        if (!alreadySelected) {
          gameState.selectedTiles.push({ row: cursorRow, col: cursorCol });
        } else {
          // If already selected and it's the second-to-last, allow backtracking
          if (gameState.selectedTiles.length >= 2) {
            const secondLast = gameState.selectedTiles[gameState.selectedTiles.length - 2];
            if (secondLast.row === cursorRow && secondLast.col === cursorCol) {
              gameState.selectedTiles.pop();
            }
          }
        }
      } else {
        // Different type, try to activate current selection
        if (gameState.selectedTiles.length >= 3) {
          activateSelection(p);
        }
      }
    } else if (gameState.selectedTiles.length >= 3) {
      // Not adjacent, activate if we have 3+
      activateSelection(p);
    }
  }
}

function activateSelection(p) {
  if (gameState.selectedTiles.length < 3) {
    gameState.selectedTiles = [];
    return;
  }
  
  const firstTile = gameState.grid[gameState.selectedTiles[0].row][gameState.selectedTiles[0].col];
  const tileType = firstTile.type;
  const count = gameState.selectedTiles.length;
  
  // Process effect
  processTileEffect(tileType, count);
  
  // Clear tiles
  clearMatchedTiles(gameState.selectedTiles);
  gameState.selectedTiles = [];
  
  // Apply gravity
  applyGravity(p);
  
  // Enemy turn after player action
  if (gameState.enemies.length > 0) {
    gameState.turnDelay = 30; // Delay before enemy turn
  } else {
    checkFloorComplete();
  }
}

function startGame(p) {
  gameState.gamePhase = GAME_PHASES.PLAYING;
  p.logs.game_info.push({
    data: { gamePhase: GAME_PHASES.PLAYING },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function resetGame(p) {
  gameState.gamePhase = GAME_PHASES.START;
  p.logs.game_info.push({
    data: { gamePhase: GAME_PHASES.START },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}