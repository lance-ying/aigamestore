// pathPlanner.js - Path planning and cursor management

import { gameState, GRID_COLS, GRID_ROWS, TILE_TYPES } from './globals.js';

export function moveCursor(dx, dy) {
  gameState.cursorX = Math.max(0, Math.min(GRID_COLS - 1, gameState.cursorX + dx));
  gameState.cursorY = Math.max(0, Math.min(GRID_ROWS - 1, gameState.cursorY + dy));
}

export function selectNextTruck() {
  if (gameState.trucks.length > 0) {
    gameState.selectedTruckIndex = (gameState.selectedTruckIndex + 1) % gameState.trucks.length;
    const selectedTruck = gameState.trucks[gameState.selectedTruckIndex];
    gameState.cursorX = selectedTruck.x;
    gameState.cursorY = selectedTruck.y;
  }
}

export function addPathNode() {
  if (gameState.trucks.length === 0) return;
  
  const truck = gameState.trucks[gameState.selectedTruckIndex];
  const x = gameState.cursorX;
  const y = gameState.cursorY;
  
  // Check if position is valid (not a wall)
  if (isValidPosition(x, y)) {
    truck.addPathNode(x, y);
  }
}

export function clearCurrentTruckPath() {
  if (gameState.trucks.length === 0) return;
  const truck = gameState.trucks[gameState.selectedTruckIndex];
  truck.clearPath();
}

export function isValidPosition(x, y) {
  if (x < 0 || x >= GRID_COLS || y < 0 || y >= GRID_ROWS) {
    return false;
  }
  
  const tile = gameState.grid[y][x];
  if (tile.type === TILE_TYPES.WALL) {
    return false;
  }
  
  return true;
}

export function isAdjacentOrSame(x1, y1, x2, y2) {
  const dx = Math.abs(x2 - x1);
  const dy = Math.abs(y2 - y1);
  return (dx <= 1 && dy === 0) || (dx === 0 && dy <= 1);
}