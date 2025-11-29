// grid.js - Grid management
import { GRID_SIZE, gameState } from './globals.js';

export function initializeGrid() {
  const grid = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    grid[y] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      grid[y][x] = {
        filled: false,
        color: null,
        prefilled: false
      };
    }
  }
  return grid;
}

export function addPrefilledCells(grid, count, p) {
  const cells = [];
  for (let i = 0; i < count; i++) {
    let x, y;
    let attempts = 0;
    do {
      x = Math.floor(p.random() * GRID_SIZE);
      y = Math.floor(p.random() * GRID_SIZE);
      attempts++;
    } while (grid[y][x].filled && attempts < 100);
    
    if (!grid[y][x].filled) {
      grid[y][x].filled = true;
      grid[y][x].prefilled = true;
      grid[y][x].color = [100, 100, 100];
      cells.push({x, y});
    }
  }
  return cells;
}

export function canPlaceBlock(grid, block, startX, startY) {
  for (const [dx, dy] of block.shape) {
    const x = startX + dx;
    const y = startY + dy;
    
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) {
      return false;
    }
    
    if (grid[y][x].filled) {
      return false;
    }
  }
  return true;
}

export function placeBlock(grid, block, startX, startY) {
  for (const [dx, dy] of block.shape) {
    const x = startX + dx;
    const y = startY + dy;
    grid[y][x].filled = true;
    grid[y][x].color = block.color;
    grid[y][x].prefilled = false;
  }
}

export function checkAndClearLines(grid) {
  const clearedCells = new Set();
  let clearCount = 0;

  // Check horizontal lines
  for (let y = 0; y < GRID_SIZE; y++) {
    let full = true;
    for (let x = 0; x < GRID_SIZE; x++) {
      if (!grid[y][x].filled || grid[y][x].prefilled) {
        full = false;
        break;
      }
    }
    if (full) {
      clearCount++;
      for (let x = 0; x < GRID_SIZE; x++) {
        clearedCells.add(`${x},${y}`);
      }
    }
  }

  // Check vertical lines
  for (let x = 0; x < GRID_SIZE; x++) {
    let full = true;
    for (let y = 0; y < GRID_SIZE; y++) {
      if (!grid[y][x].filled || grid[y][x].prefilled) {
        full = false;
        break;
      }
    }
    if (full) {
      clearCount++;
      for (let y = 0; y < GRID_SIZE; y++) {
        clearedCells.add(`${x},${y}`);
      }
    }
  }

  // Check 3x3 subgrids
  for (let subY = 0; subY < 3; subY++) {
    for (let subX = 0; subX < 3; subX++) {
      let full = true;
      for (let dy = 0; dy < 3; dy++) {
        for (let dx = 0; dx < 3; dx++) {
          const x = subX * 3 + dx;
          const y = subY * 3 + dy;
          if (!grid[y][x].filled || grid[y][x].prefilled) {
            full = false;
            break;
          }
        }
        if (!full) break;
      }
      if (full) {
        clearCount++;
        for (let dy = 0; dy < 3; dy++) {
          for (let dx = 0; dx < 3; dx++) {
            const x = subX * 3 + dx;
            const y = subY * 3 + dy;
            clearedCells.add(`${x},${y}`);
          }
        }
      }
    }
  }

  // Clear the cells
  for (const cellKey of clearedCells) {
    const [x, y] = cellKey.split(',').map(Number);
    grid[y][x].filled = false;
    grid[y][x].color = null;
    grid[y][x].prefilled = false;
  }

  return { clearedCount: clearedCells.size, clearCount };
}

export function hasAnyValidPlacement(grid, blocks) {
  for (const block of blocks) {
    if (!block) continue;
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (canPlaceBlock(grid, block, x, y)) {
          return true;
        }
      }
    }
  }
  return false;
}