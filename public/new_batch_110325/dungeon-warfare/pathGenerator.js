// pathGenerator.js - Generate dungeon path

import { GRID_COLS, GRID_ROWS, GRID_SIZE } from './globals.js';

export function generatePath(p) {
  const path = [];
  
  // Simple S-shaped path from left to right
  const startRow = Math.floor(GRID_ROWS / 2);
  const startCol = 0;
  
  // Start at left edge
  path.push({ x: startCol, y: startRow });
  
  let currentCol = startCol;
  let currentRow = startRow;
  
  // Move right with some vertical variation
  while (currentCol < GRID_COLS - 1) {
    currentCol++;
    
    // Add vertical movement periodically
    if (currentCol % 5 === 0 && currentCol < GRID_COLS - 2) {
      const verticalMove = p.random() > 0.5 ? 1 : -1;
      const newRow = currentRow + verticalMove;
      
      if (newRow >= 2 && newRow < GRID_ROWS - 2) {
        currentRow = newRow;
      }
    }
    
    path.push({ x: currentCol, y: currentRow });
  }
  
  return path;
}

export function isOnPath(gridX, gridY, path) {
  return path.some(cell => cell.x === gridX && cell.y === gridY);
}

export function getPathWorldPos(pathIndex, path) {
  if (pathIndex < 0 || pathIndex >= path.length) return null;
  const cell = path[pathIndex];
  return {
    x: cell.x * GRID_SIZE + GRID_SIZE / 2,
    y: cell.y * GRID_SIZE + GRID_SIZE / 2
  };
}