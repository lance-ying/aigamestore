// grid.js - Grid management and matching logic

import { gameState, GRID_SIZE, RUNE_RED, RUNE_BLUE, RUNE_GREEN, RUNE_YELLOW, RUNE_PURPLE } from './globals.js';

export function initializeGrid(p) {
  const grid = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    grid[y] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      grid[y][x] = p.floor(p.random(5));
    }
  }
  
  // Remove initial matches
  let hasMatches = true;
  let iterations = 0;
  while (hasMatches && iterations < 100) {
    hasMatches = false;
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (checkMatchAt(grid, x, y).length > 0) {
          grid[y][x] = p.floor(p.random(5));
          hasMatches = true;
        }
      }
    }
    iterations++;
  }
  
  return grid;
}

export function checkMatchAt(grid, x, y) {
  const color = grid[y][x];
  const matched = new Set();
  matched.add(`${x},${y}`);
  
  // Check horizontal
  let left = x - 1;
  while (left >= 0 && grid[y][left] === color) {
    matched.add(`${left},${y}`);
    left--;
  }
  let right = x + 1;
  while (right < GRID_SIZE && grid[y][right] === color) {
    matched.add(`${right},${y}`);
    right++;
  }
  
  const horizontalMatch = matched.size >= 3 ? Array.from(matched) : [];
  
  // Check vertical
  matched.clear();
  matched.add(`${x},${y}`);
  let up = y - 1;
  while (up >= 0 && grid[up][x] === color) {
    matched.add(`${x},${up}`);
    up--;
  }
  let down = y + 1;
  while (down < GRID_SIZE && grid[down][x] === color) {
    matched.add(`${x},${down}`);
    down++;
  }
  
  const verticalMatch = matched.size >= 3 ? Array.from(matched) : [];
  
  // Combine matches
  const allMatches = new Set([...horizontalMatch, ...verticalMatch]);
  return Array.from(allMatches);
}

export function findAllMatches(grid) {
  const allMatched = new Set();
  
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const matches = checkMatchAt(grid, x, y);
      matches.forEach(cell => allMatched.add(cell));
    }
  }
  
  return Array.from(allMatched).map(cell => {
    const [x, y] = cell.split(',').map(Number);
    return { x, y, color: grid[y][x] };
  });
}

export function applyGravity(grid, p) {
  for (let x = 0; x < GRID_SIZE; x++) {
    let emptySpaces = 0;
    for (let y = GRID_SIZE - 1; y >= 0; y--) {
      if (grid[y][x] === -1) {
        emptySpaces++;
      } else if (emptySpaces > 0) {
        grid[y + emptySpaces][x] = grid[y][x];
        grid[y][x] = -1;
      }
    }
    
    // Fill from top
    for (let y = 0; y < GRID_SIZE; y++) {
      if (grid[y][x] === -1) {
        grid[y][x] = p.floor(p.random(5));
      }
    }
  }
}

export function canSwap(grid, x1, y1, x2, y2) {
  if (x2 < 0 || x2 >= GRID_SIZE || y2 < 0 || y2 >= GRID_SIZE) {
    return false;
  }
  
  // Swap
  const temp = grid[y1][x1];
  grid[y1][x1] = grid[y2][x2];
  grid[y2][x2] = temp;
  
  // Check if swap creates match
  const hasMatch = checkMatchAt(grid, x1, y1).length > 0 || 
                   checkMatchAt(grid, x2, y2).length > 0;
  
  // Swap back
  const temp2 = grid[y1][x1];
  grid[y1][x1] = grid[y2][x2];
  grid[y2][x2] = temp2;
  
  return hasMatch;
}

export function swapCells(grid, x1, y1, x2, y2) {
  const temp = grid[y1][x1];
  grid[y1][x1] = grid[y2][x2];
  grid[y2][x2] = temp;
}

export function hasValidMoves(grid) {
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      // Check right
      if (x < GRID_SIZE - 1 && canSwap(grid, x, y, x + 1, y)) {
        return true;
      }
      // Check down
      if (y < GRID_SIZE - 1 && canSwap(grid, x, y, x, y + 1)) {
        return true;
      }
    }
  }
  return false;
}