// grid.js - Grid and tile management

import { gameState, GRID_SIZE, TILE_TYPES } from './globals.js';

export class Tile {
  constructor(type, row, col) {
    this.type = type;
    this.row = row;
    this.col = col;
    this.falling = false;
    this.fallDistance = 0;
    this.selected = false;
  }
}

export function initializeGrid(p) {
  gameState.grid = [];
  
  for (let row = 0; row < GRID_SIZE; row++) {
    gameState.grid[row] = [];
    for (let col = 0; col < GRID_SIZE; col++) {
      gameState.grid[row][col] = createRandomTile(row, col, p);
    }
  }
}

export function createRandomTile(row, col, p) {
  const types = Object.values(TILE_TYPES);
  const randomType = types[Math.floor(p.random(types.length))];
  return new Tile(randomType, row, col);
}

export function findAdjacentTiles(row, col, type) {
  const visited = new Set();
  const matching = [];
  
  function dfs(r, c) {
    const key = `${r},${c}`;
    if (visited.has(key)) return;
    if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) return;
    if (!gameState.grid[r] || !gameState.grid[r][c]) return;
    if (gameState.grid[r][c].type !== type) return;
    
    visited.add(key);
    matching.push({ row: r, col: c });
    
    // Check 4 directions
    dfs(r - 1, c);
    dfs(r + 1, c);
    dfs(r, c - 1);
    dfs(r, c + 1);
  }
  
  dfs(row, col);
  return matching;
}

export function isAdjacent(tile1, tile2) {
  if (!tile1 || !tile2) return false;
  const rowDiff = Math.abs(tile1.row - tile2.row);
  const colDiff = Math.abs(tile1.col - tile2.col);
  return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
}

export function clearMatchedTiles(matchedTiles) {
  for (const tile of matchedTiles) {
    if (gameState.grid[tile.row] && gameState.grid[tile.row][tile.col]) {
      gameState.grid[tile.row][tile.col] = null;
    }
  }
}

export function applyGravity(p) {
  let moved = false;
  
  // Move tiles down
  for (let col = 0; col < GRID_SIZE; col++) {
    for (let row = GRID_SIZE - 1; row >= 0; row--) {
      if (gameState.grid[row][col] === null) {
        // Find tile above to fall
        for (let aboveRow = row - 1; aboveRow >= 0; aboveRow--) {
          if (gameState.grid[aboveRow][col] !== null) {
            gameState.grid[row][col] = gameState.grid[aboveRow][col];
            gameState.grid[row][col].row = row;
            gameState.grid[aboveRow][col] = null;
            moved = true;
            break;
          }
        }
      }
    }
  }
  
  // Fill empty spaces at top
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (gameState.grid[row][col] === null) {
        gameState.grid[row][col] = createRandomTile(row, col, p);
        moved = true;
      }
    }
  }
  
  return moved;
}