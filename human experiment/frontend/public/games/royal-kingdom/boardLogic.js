// boardLogic.js - Board management and game logic
import { gameState, LEVELS, COLOR_NAMES, GRID_OFFSET_X, GRID_OFFSET_Y, TILE_SIZE } from './globals.js';
import { Tile } from './tile.js';

export function initializeLevel(levelNum, p) {
  const levelData = LEVELS[levelNum - 1];
  gameState.currentLevel = levelNum;
  gameState.movesRemaining = levelData.moves;
  gameState.score = 0;
  gameState.cursorX = 0;
  gameState.cursorY = 0;
  gameState.selectedTile = null;
  gameState.isAnimating = false;
  gameState.comboCounting = 0;
  gameState.comboMultiplier = 1.0;

  // Deep copy objectives
  gameState.objectives = levelData.objectives.map(obj => ({ ...obj, current: 0 }));

  // Create board
  const size = levelData.gridSize;
  gameState.board = [];
  gameState.entities = [];

  for (let y = 0; y < size; y++) {
    gameState.board[y] = [];
    for (let x = 0; x < size; x++) {
      const colorIndex = Math.floor(p.random() * levelData.colors);
      const tile = new Tile(x, y, COLOR_NAMES[colorIndex], p);
      gameState.board[y][x] = tile;
      gameState.entities.push(tile);
    }
  }

  // Add obstacles and items
  addObstacles(levelData, p);
  
  // Ensure no initial matches
  removeInitialMatches(p);
}

function addObstacles(levelData, p) {
  const size = levelData.gridSize;
  
  // Add ice blocks
  let iceCount = 0;
  while (iceCount < levelData.iceBlocks) {
    const x = Math.floor(p.random() * size);
    const y = Math.floor(p.random() * size);
    const tile = gameState.board[y][x];
    if (tile && tile.iceLayer === 0) {
      tile.iceLayer = 1;
      iceCount++;
    }
  }

  // Add chained tiles
  let chainCount = 0;
  while (chainCount < levelData.chainedTiles) {
    const x = Math.floor(p.random() * size);
    const y = Math.floor(p.random() * size);
    const tile = gameState.board[y][x];
    if (tile && tile.chainLayer === 0 && tile.iceLayer === 0) {
      tile.chainLayer = 2;
      chainCount++;
    }
  }

  // Add target items
  let itemCount = 0;
  const itemType = levelData.level === 3 ? 'KEY' : 'CROWN';
  while (itemCount < levelData.targetItems) {
    const x = Math.floor(p.random() * size);
    const y = Math.floor(p.random() * size / 2); // Place in upper half
    const tile = gameState.board[y][x];
    if (tile && !tile.hasTargetItem) {
      tile.hasTargetItem = true;
      tile.targetItemType = itemType;
      itemCount++;
    }
  }
}

function removeInitialMatches(p) {
  const size = gameState.board.length;
  let changed = true;
  
  while (changed) {
    changed = false;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const tile = gameState.board[y][x];
        if (!tile) continue;

        // Check horizontal
        if (x + 2 < size) {
          const t1 = gameState.board[y][x + 1];
          const t2 = gameState.board[y][x + 2];
          if (t1 && t2 && tile.color === t1.color && tile.color === t2.color) {
            const colorIndex = Math.floor(p.random() * LEVELS[gameState.currentLevel - 1].colors);
            tile.color = COLOR_NAMES[colorIndex];
            changed = true;
          }
        }

        // Check vertical
        if (y + 2 < size) {
          const t1 = gameState.board[y + 1][x];
          const t2 = gameState.board[y + 2][x];
          if (t1 && t2 && tile.color === t1.color && tile.color === t2.color) {
            const colorIndex = Math.floor(p.random() * LEVELS[gameState.currentLevel - 1].colors);
            tile.color = COLOR_NAMES[colorIndex];
            changed = true;
          }
        }
      }
    }
  }
}

export function canSwapTiles(tile1, tile2) {
  if (!tile1 || !tile2) return false;
  if (tile1.chainLayer > 0 || tile2.chainLayer > 0) return false;
  
  const dx = Math.abs(tile1.gridX - tile2.gridX);
  const dy = Math.abs(tile1.gridY - tile2.gridY);
  
  return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
}

export function swapTiles(tile1, tile2) {
  // Swap grid positions
  const tempGridX = tile1.gridX;
  const tempGridY = tile1.gridY;
  
  tile1.gridX = tile2.gridX;
  tile1.gridY = tile2.gridY;
  tile2.gridX = tempGridX;
  tile2.gridY = tempGridY;

  // Swap in board array
  gameState.board[tile1.gridY][tile1.gridX] = tile1;
  gameState.board[tile2.gridY][tile2.gridX] = tile2;

  // Set target positions for animation
  tile1.targetX = tile1.gridX;
  tile1.targetY = tile1.gridY;
  tile2.targetX = tile2.gridX;
  tile2.targetY = tile2.gridY;
}

export function findMatches() {
  const size = gameState.board.length;
  const matches = [];

  // Horizontal matches
  for (let y = 0; y < size; y++) {
    let matchStart = 0;
    for (let x = 1; x <= size; x++) {
      const current = x < size ? gameState.board[y][x] : null;
      const prev = gameState.board[y][x - 1];
      
      if (!current || !prev || current.color !== prev.color) {
        if (x - matchStart >= 3) {
          const matchTiles = [];
          for (let i = matchStart; i < x; i++) {
            matchTiles.push(gameState.board[y][i]);
          }
          matches.push(matchTiles);
        }
        matchStart = x;
      }
    }
  }

  // Vertical matches
  for (let x = 0; x < size; x++) {
    let matchStart = 0;
    for (let y = 1; y <= size; y++) {
      const current = y < size ? gameState.board[y][x] : null;
      const prev = gameState.board[y - 1][x];
      
      if (!current || !prev || current.color !== prev.color) {
        if (y - matchStart >= 3) {
          const matchTiles = [];
          for (let i = matchStart; i < y; i++) {
            matchTiles.push(gameState.board[i][x]);
          }
          matches.push(matchTiles);
        }
        matchStart = y;
      }
    }
  }

  return matches;
}

export function clearMatches(matches, p) {
  let pointsEarned = 0;
  const clearedTiles = new Set();

  matches.forEach(matchTiles => {
    const matchLength = matchTiles.length;
    let basePoints = 0;
    let specialType = null;
    let specialTile = null;

    if (matchLength === 3) {
      basePoints = 50;
    } else if (matchLength === 4) {
      basePoints = 100;
      specialType = 'ROCKET';
      specialTile = matchTiles[Math.floor(matchTiles.length / 2)];
    } else if (matchLength >= 5) {
      basePoints = 200;
      specialType = 'BOMB';
      specialTile = matchTiles[Math.floor(matchTiles.length / 2)];
    }

    pointsEarned += Math.floor(basePoints * gameState.comboMultiplier);

    matchTiles.forEach(tile => {
      if (!tile || clearedTiles.has(tile)) return;
      clearedTiles.add(tile);

      // Update objectives
      updateObjectivesForClear(tile);

      // Handle obstacles
      damageAdjacentIce(tile.gridX, tile.gridY);
      if (tile.chainLayer > 0) {
        tile.chainLayer--;
        updateObjective('CLEAR_CHAINS', 1);
      }

      // Mark for clearing unless it's the special tile
      if (tile !== specialTile) {
        tile.markedForClear = true;
      }
    });

    // Create special piece
    if (specialType && specialTile && !specialTile.markedForClear) {
      specialTile.specialType = specialType;
      if (specialType === 'ROCKET') {
        specialTile.rocketDirection = p.random() > 0.5 ? 'HORIZONTAL' : 'VERTICAL';
      }
    }
  });

  gameState.score += pointsEarned;
  updateObjective('SCORE', pointsEarned);

  return clearedTiles.size > 0;
}

function updateObjectivesForClear(tile) {
  // Color clearing
  updateObjective('CLEAR_COLOR', 1, tile.color);
  
  // Ice clearing
  if (tile.iceLayer > 0) {
    tile.iceLayer = 0;
    updateObjective('CLEAR_ICE', 1);
  }
  
  // Target item collection
  if (tile.hasTargetItem) {
    tile.hasTargetItem = false;
    updateObjective('COLLECT_ITEMS', 1);
  }
}

function damageAdjacentIce(x, y) {
  const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  directions.forEach(([dx, dy]) => {
    const nx = x + dx;
    const ny = y + dy;
    if (ny >= 0 && ny < gameState.board.length && nx >= 0 && nx < gameState.board[0].length) {
      const tile = gameState.board[ny][nx];
      if (tile && tile.iceLayer > 0) {
        tile.iceLayer--;
        if (tile.iceLayer === 0) {
          updateObjective('CLEAR_ICE', 1);
        }
      }
    }
  });
}

function updateObjective(type, amount, color = null) {
  gameState.objectives.forEach(obj => {
    if (obj.type === type) {
      if (type === 'CLEAR_COLOR' && obj.color === color) {
        obj.current += amount;
      } else if (type !== 'CLEAR_COLOR') {
        obj.current += amount;
      }
    }
  });
}

export function activateSpecialPiece(tile, p) {
  if (!tile || !tile.specialType) return 0;

  let pointsEarned = 0;
  const tilesToClear = [];

  if (tile.specialType === 'ROCKET') {
    pointsEarned = 150;
    updateObjective('ACTIVATE_ROCKET', 1);
    
    if (tile.rocketDirection === 'HORIZONTAL') {
      for (let x = 0; x < gameState.board[0].length; x++) {
        const t = gameState.board[tile.gridY][x];
        if (t && !t.markedForClear) {
          tilesToClear.push(t);
        }
      }
    } else {
      for (let y = 0; y < gameState.board.length; y++) {
        const t = gameState.board[y][tile.gridX];
        if (t && !t.markedForClear) {
          tilesToClear.push(t);
        }
      }
    }
  } else if (tile.specialType === 'BOMB') {
    pointsEarned = 300;
    updateObjective('ACTIVATE_BOMB', 1);
    
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const ny = tile.gridY + dy;
        const nx = tile.gridX + dx;
        if (ny >= 0 && ny < gameState.board.length && 
            nx >= 0 && nx < gameState.board[0].length) {
          const t = gameState.board[ny][nx];
          if (t && !t.markedForClear) {
            tilesToClear.push(t);
          }
        }
      }
    }
  }

  // Clear tiles and update objectives
  tilesToClear.forEach(t => {
    updateObjectivesForClear(t);
    damageAdjacentIce(t.gridX, t.gridY);
    if (t.chainLayer > 0) {
      t.chainLayer--;
      updateObjective('CLEAR_CHAINS', 1);
    }
    t.markedForClear = true;
    pointsEarned += 10;
  });

  gameState.score += Math.floor(pointsEarned * gameState.comboMultiplier);
  updateObjective('SCORE', Math.floor(pointsEarned * gameState.comboMultiplier));

  return tilesToClear.length;
}

export function applyGravity() {
  const size = gameState.board.length;
  let moved = false;

  for (let x = 0; x < size; x++) {
    let writePos = size - 1;
    
    for (let y = size - 1; y >= 0; y--) {
      const tile = gameState.board[y][x];
      if (tile && !tile.markedForClear) {
        if (y !== writePos) {
          gameState.board[writePos][x] = tile;
          gameState.board[y][x] = null;
          tile.gridY = writePos;
          tile.targetY = writePos;
          moved = true;
        }
        writePos--;
      }
    }
  }

  return moved;
}

export function refillBoard(p) {
  const size = gameState.board.length;
  const levelData = LEVELS[gameState.currentLevel - 1];
  let added = false;

  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      if (!gameState.board[y][x]) {
        const colorIndex = Math.floor(p.random() * levelData.colors);
        const tile = new Tile(x, y, COLOR_NAMES[colorIndex], p);
        tile.y = -1;
        tile.targetY = y;
        gameState.board[y][x] = tile;
        gameState.entities.push(tile);
        added = true;
      }
    }
  }

  return added;
}

export function removeMarkedTiles() {
  gameState.entities = gameState.entities.filter(tile => {
    if (tile.markedForClear && tile.alpha <= 0) {
      const y = tile.gridY;
      const x = tile.gridX;
      if (gameState.board[y] && gameState.board[y][x] === tile) {
        gameState.board[y][x] = null;
      }
      return false;
    }
    return true;
  });
}

export function checkObjectivesComplete() {
  return gameState.objectives.every(obj => obj.current >= obj.target);
}

export function isStable() {
  return gameState.entities.every(tile => tile.isAtTarget() && !tile.markedForClear);
}