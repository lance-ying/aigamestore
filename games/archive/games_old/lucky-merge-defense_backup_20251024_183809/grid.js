// grid.js - Grid initialization and path setup

import { gameState, GRID_COLS, GRID_ROWS, getCurrentLevelConfig } from './globals.js';

export function initializeGrid() {
  gameState.grid = [];
  for (let y = 0; y < GRID_ROWS; y++) {
    gameState.grid[y] = [];
    for (let x = 0; x < GRID_COLS; x++) {
      gameState.grid[y][x] = {
        isPath: false,
        isPlaceable: false,
        isEmpty: true
      };
    }
  }
  
  // Setup path based on level
  setupPathForLevel(gameState.currentLevel);
}

function setupPathForLevel(level) {
  // Clear existing path
  gameState.pathWaypoints = [];
  
  if (level === 1) {
    // Simple straight path
    gameState.pathWaypoints = [
      { x: 0, y: 5 },
      { x: 14, y: 5 }
    ];
  } else if (level === 2) {
    // Winding path with turns
    gameState.pathWaypoints = [
      { x: 0, y: 2 },
      { x: 5, y: 2 },
      { x: 5, y: 7 },
      { x: 10, y: 7 },
      { x: 10, y: 3 },
      { x: 14, y: 3 }
    ];
  } else {
    // Complex path with multiple turns
    gameState.pathWaypoints = [
      { x: 0, y: 5 },
      { x: 3, y: 5 },
      { x: 3, y: 2 },
      { x: 7, y: 2 },
      { x: 7, y: 7 },
      { x: 11, y: 7 },
      { x: 11, y: 4 },
      { x: 14, y: 4 }
    ];
  }
  
  // Mark path cells
  for (let i = 0; i < gameState.pathWaypoints.length - 1; i++) {
    const start = gameState.pathWaypoints[i];
    const end = gameState.pathWaypoints[i + 1];
    
    if (start.x === end.x) {
      // Vertical line
      const minY = Math.min(start.y, end.y);
      const maxY = Math.max(start.y, end.y);
      for (let y = minY; y <= maxY; y++) {
        gameState.grid[y][start.x].isPath = true;
      }
    } else {
      // Horizontal line
      const minX = Math.min(start.x, end.x);
      const maxX = Math.max(start.x, end.x);
      for (let x = minX; x <= maxX; x++) {
        gameState.grid[start.y][x].isPath = true;
      }
    }
  }
  
  // Mark placeable spots (adjacent to path, not on path)
  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLS; x++) {
      if (!gameState.grid[y][x].isPath) {
        // Check if adjacent to path
        const adjacent = [
          [x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]
        ];
        for (const [ax, ay] of adjacent) {
          if (ax >= 0 && ax < GRID_COLS && ay >= 0 && ay < GRID_ROWS) {
            if (gameState.grid[ay][ax].isPath) {
              gameState.grid[y][x].isPlaceable = true;
              break;
            }
          }
        }
      }
    }
  }
}