import { GRID_SIZE, SKEWER_TYPES, SPECIAL_TYPES, gameState } from './globals.js';

export class GridCell {
  constructor(row, col, type) {
    this.row = row;
    this.col = col;
    this.type = type;
    this.special = null;
    this.falling = false;
    this.animY = 0;
    this.matched = false;
    this.fadeAlpha = 255;
  }
}

export function initializeGrid(p, levelData) {
  const grid = [];
  const availableTypes = levelData.availableSkewers;
  
  for (let row = 0; row < GRID_SIZE; row++) {
    grid[row] = [];
    for (let col = 0; col < GRID_SIZE; col++) {
      const randomType = availableTypes[Math.floor(p.random() * availableTypes.length)];
      grid[row][col] = new GridCell(row, col, randomType);
    }
  }
  
  // Add burnt blocks if specified
  if (levelData.burntBlocks) {
    const positions = [];
    for (let i = 0; i < levelData.burntBlocks; i++) {
      let row, col;
      do {
        row = Math.floor(p.random() * GRID_SIZE);
        col = Math.floor(p.random() * GRID_SIZE);
      } while (positions.some(pos => pos.row === row && pos.col === col));
      
      positions.push({ row, col });
      grid[row][col].type = SPECIAL_TYPES.BURNT;
    }
  }
  
  // Ensure no initial matches
  removeInitialMatches(p, grid, availableTypes);
  
  return grid;
}

function removeInitialMatches(p, grid, availableTypes) {
  let hasMatches = true;
  let iterations = 0;
  const maxIterations = 100;
  
  while (hasMatches && iterations < maxIterations) {
    hasMatches = false;
    iterations++;
    
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (grid[row][col].type === SPECIAL_TYPES.BURNT) continue;
        
        const matches = checkMatchesAt(grid, row, col);
        if (matches.length >= 3) {
          hasMatches = true;
          grid[row][col].type = availableTypes[Math.floor(p.random() * availableTypes.length)];
        }
      }
    }
  }
}

export function checkMatchesAt(grid, row, col) {
  const cell = grid[row][col];
  if (!cell || cell.type === SPECIAL_TYPES.BURNT || cell.type === SPECIAL_TYPES.EMPTY) {
    return [];
  }
  
  const type = cell.type;
  const matches = [{ row, col }];
  
  // Check horizontal
  let left = col - 1;
  while (left >= 0 && grid[row][left].type === type) {
    matches.push({ row, col: left });
    left--;
  }
  
  let right = col + 1;
  while (right < GRID_SIZE && grid[row][right].type === type) {
    matches.push({ row, col: right });
    right++;
  }
  
  const horizontalMatches = matches.length >= 3 ? [...matches] : [];
  
  // Check vertical
  const verticalMatches = [{ row, col }];
  let up = row - 1;
  while (up >= 0 && grid[up][col].type === type) {
    verticalMatches.push({ row: up, col });
    up--;
  }
  
  let down = row + 1;
  while (down < GRID_SIZE && grid[down][col].type === type) {
    verticalMatches.push({ row: down, col });
    down++;
  }
  
  const finalMatches = [];
  if (horizontalMatches.length >= 3) {
    finalMatches.push(...horizontalMatches);
  }
  if (verticalMatches.length >= 3) {
    finalMatches.push(...verticalMatches);
  }
  
  // Remove duplicates
  const unique = [];
  finalMatches.forEach(match => {
    if (!unique.some(m => m.row === match.row && m.col === match.col)) {
      unique.push(match);
    }
  });
  
  return unique;
}

export function findAllMatches(grid) {
  const allMatches = [];
  const processed = new Set();
  
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const key = `${row},${col}`;
      if (processed.has(key)) continue;
      
      const matches = checkMatchesAt(grid, row, col);
      if (matches.length >= 3) {
        matches.forEach(m => {
          const mKey = `${m.row},${m.col}`;
          if (!processed.has(mKey)) {
            allMatches.push(m);
            processed.add(mKey);
          }
        });
      }
    }
  }
  
  return allMatches;
}

export function isValidSwap(grid, row1, col1, row2, col2) {
  if (row2 < 0 || row2 >= GRID_SIZE || col2 < 0 || col2 >= GRID_SIZE) {
    return false;
  }
  
  const cell1 = grid[row1][col1];
  const cell2 = grid[row2][col2];
  
  if (cell1.type === SPECIAL_TYPES.BURNT || cell2.type === SPECIAL_TYPES.BURNT) {
    return false;
  }
  if (cell1.type === SPECIAL_TYPES.EMPTY || cell2.type === SPECIAL_TYPES.EMPTY) {
    return false;
  }
  
  // Temporarily swap
  const temp = cell1.type;
  cell1.type = cell2.type;
  cell2.type = temp;
  
  const matches1 = checkMatchesAt(grid, row1, col1);
  const matches2 = checkMatchesAt(grid, row2, col2);
  
  // Swap back
  cell1.type = temp;
  
  return matches1.length >= 3 || matches2.length >= 3;
}

export function swapTiles(grid, row1, col1, row2, col2) {
  const temp = grid[row1][col1].type;
  grid[row1][col1].type = grid[row2][col2].type;
  grid[row2][col2].type = temp;
  
  const tempSpecial = grid[row1][col1].special;
  grid[row1][col1].special = grid[row2][col2].special;
  grid[row2][col2].special = tempSpecial;
}

export function applyGravity(p, grid, levelData) {
  let moved = false;
  
  for (let col = 0; col < GRID_SIZE; col++) {
    for (let row = GRID_SIZE - 1; row >= 0; row--) {
      if (grid[row][col].type === SPECIAL_TYPES.EMPTY) {
        // Find tile above
        let aboveRow = row - 1;
        while (aboveRow >= 0 && grid[aboveRow][col].type === SPECIAL_TYPES.EMPTY) {
          aboveRow--;
        }
        
        if (aboveRow >= 0) {
          grid[row][col].type = grid[aboveRow][col].type;
          grid[row][col].special = grid[aboveRow][col].special;
          grid[aboveRow][col].type = SPECIAL_TYPES.EMPTY;
          grid[aboveRow][col].special = null;
          moved = true;
        }
      }
    }
  }
  
  // Fill empty cells at top
  for (let col = 0; col < GRID_SIZE; col++) {
    for (let row = 0; row < GRID_SIZE; row++) {
      if (grid[row][col].type === SPECIAL_TYPES.EMPTY) {
        const availableTypes = levelData.availableSkewers;
        grid[row][col].type = availableTypes[Math.floor(p.random() * availableTypes.length)];
        grid[row][col].special = null;
        moved = true;
      }
    }
  }
  
  return moved;
}