import { gameState, GRID_SIZE, SPECIAL_TYPES } from './globals.js';
import { isValidSwap, swapTiles } from './grid.js';

export function handleKeyPressed(p, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: p.key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  if (gameState.gamePhase === "START") {
    if (keyCode === 13) { // ENTER
      startGame(p);
    }
  } else if (gameState.gamePhase === "PLAYING") {
    if (keyCode === 27) { // ESC
      pauseGame(p);
    } else if (!gameState.animating) {
      handleGameplayInput(p, keyCode);
    }
  } else if (gameState.gamePhase === "PAUSED") {
    if (keyCode === 27) { // ESC
      resumeGame(p);
    }
  } else if (gameState.gamePhase === "GAME_OVER") {
    if (keyCode === 82) { // R
      restartGame(p);
    }
  }
}

function handleGameplayInput(p, keyCode) {
  // Arrow keys - move cursor
  if (keyCode === 37) { // LEFT
    gameState.cursorX = Math.max(0, gameState.cursorX - 1);
  } else if (keyCode === 39) { // RIGHT
    gameState.cursorX = Math.min(GRID_SIZE - 1, gameState.cursorX + 1);
  } else if (keyCode === 38) { // UP
    gameState.cursorY = Math.max(0, gameState.cursorY - 1);
  } else if (keyCode === 40) { // DOWN
    gameState.cursorY = Math.min(GRID_SIZE - 1, gameState.cursorY + 1);
  }
  // Space - select/deselect
  else if (keyCode === 32) {
    if (gameState.selectedTile) {
      gameState.selectedTile = null;
    } else {
      const cell = gameState.grid[gameState.cursorY][gameState.cursorX];
      if (cell.type !== SPECIAL_TYPES.BURNT && cell.type !== SPECIAL_TYPES.EMPTY) {
        gameState.selectedTile = { row: gameState.cursorY, col: gameState.cursorX };
      }
    }
  }
  // W/A/S/D - swap selected tile
  else if (gameState.selectedTile) {
    let targetRow = gameState.selectedTile.row;
    let targetCol = gameState.selectedTile.col;
    
    if (keyCode === 87) { // W - UP
      targetRow--;
    } else if (keyCode === 83) { // S - DOWN
      targetRow++;
    } else if (keyCode === 65) { // A - LEFT
      targetCol--;
    } else if (keyCode === 68) { // D - RIGHT
      targetCol++;
    }
    
    if (targetRow !== gameState.selectedTile.row || targetCol !== gameState.selectedTile.col) {
      attemptSwap(p, gameState.selectedTile.row, gameState.selectedTile.col, targetRow, targetCol);
    }
  }
  // Z - Activate Flame Booster
  else if (keyCode === 90) {
    const cell = gameState.grid[gameState.cursorY][gameState.cursorX];
    if (cell.special === SPECIAL_TYPES.FLAME) {
      activateBooster(p, gameState.cursorY, gameState.cursorX, SPECIAL_TYPES.FLAME);
    }
  }
  // Shift - Activate Grill Flip
  else if (keyCode === 16) {
    const cell = gameState.grid[gameState.cursorY][gameState.cursorX];
    if (cell.special === SPECIAL_TYPES.GRILL_FLIP) {
      activateBooster(p, gameState.cursorY, gameState.cursorX, SPECIAL_TYPES.GRILL_FLIP);
    }
  }
}

function attemptSwap(p, row1, col1, row2, col2) {
  if (isValidSwap(gameState.grid, row1, col1, row2, col2)) {
    swapTiles(gameState.grid, row1, col1, row2, col2);
    gameState.movesRemaining--;
    gameState.selectedTile = null;
    gameState.animating = true;
    
    // Process matches after a short delay
    setTimeout(() => {
      processAllMatches(p);
    }, 100);
  } else {
    gameState.selectedTile = null;
  }
}

function activateBooster(p, row, col, type) {
  gameState.movesRemaining--;
  gameState.animating = true;
  
  if (type === SPECIAL_TYPES.FLAME) {
    const { activateFlameBooster } = require('./matching.js');
    activateFlameBooster(p, gameState.grid, row, col);
  } else if (type === SPECIAL_TYPES.GRILL_FLIP) {
    const { activateGrillFlipBooster } = require('./matching.js');
    const { LEVELS } = require('./globals.js');
    activateGrillFlipBooster(p, gameState.grid, row, col, LEVELS[gameState.currentLevel - 1]);
  }
  
  setTimeout(() => {
    processAllMatches(p);
  }, 100);
}

function processAllMatches(p) {
  const { processMatches } = require('./matching.js');
  const { applyGravity } = require('./grid.js');
  const { LEVELS } = require('./globals.js');
  
  let hadMatches = processMatches(p, gameState.grid);
  
  if (hadMatches) {
    setTimeout(() => {
      applyGravity(p, gameState.grid, LEVELS[gameState.currentLevel - 1]);
      setTimeout(() => {
        processAllMatches(p);
      }, 200);
    }, 300);
  } else {
    gameState.animating = false;
    checkGameOver(p);
  }
}

function checkGameOver(p) {
  const { LEVELS } = require('./globals.js');
  const levelData = LEVELS[gameState.currentLevel - 1];
  
  // Check win condition
  let won = true;
  for (const key in levelData.objectives) {
    const target = levelData.objectives[key];
    const current = gameState.objectives[key] || 0;
    if (current < target) {
      won = false;
      break;
    }
  }
  
  if (won) {
    // Add moves bonus
    gameState.score += gameState.movesRemaining * 50;
    
    // Unlock next level
    if (gameState.currentLevel < LEVELS.length) {
      gameState.unlockedLevels = Math.max(gameState.unlockedLevels, gameState.currentLevel + 1);
    }
    
    gameState.gamePhase = "GAME_OVER";
    p.logs.game_info.push({
      data: { phase: "GAME_OVER", result: "WIN" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  } else if (gameState.movesRemaining <= 0) {
    gameState.gamePhase = "GAME_OVER";
    p.logs.game_info.push({
      data: { phase: "GAME_OVER", result: "LOSE" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

function startGame(p) {
  const { initializeGrid } = require('./grid.js');
  const { LEVELS } = require('./globals.js');
  
  gameState.gamePhase = "PLAYING";
  gameState.currentLevel = 1;
  const levelData = LEVELS[gameState.currentLevel - 1];
  
  gameState.movesRemaining = levelData.moves;
  gameState.score = 0;
  gameState.objectives = {};
  
  // Initialize objective counters
  Object.keys(levelData.objectives).forEach(key => {
    gameState.objectives[key] = 0;
  });
  
  gameState.grid = initializeGrid(p, levelData);
  gameState.cursorX = 0;
  gameState.cursorY = 0;
  gameState.selectedTile = null;
  gameState.animating = false;
  
  p.logs.game_info.push({
    data: { phase: "PLAYING", level: gameState.currentLevel },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function pauseGame(p) {
  gameState.gamePhase = "PAUSED";
  p.logs.game_info.push({
    data: { phase: "PAUSED" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function resumeGame(p) {
  gameState.gamePhase = "PLAYING";
  p.logs.game_info.push({
    data: { phase: "PLAYING" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function restartGame(p) {
  gameState.gamePhase = "START";
  p.logs.game_info.push({
    data: { phase: "START" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}