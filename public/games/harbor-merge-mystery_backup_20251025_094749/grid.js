// grid.js - Grid management and merging logic

import { gameState, LEVEL_CONFIG, GRID_START_X, GRID_START_Y, CELL_SIZE, ITEM_TYPES } from './globals.js';
import { createRandomItem, Item } from './items.js';

export function initializeGrid(levelIndex) {
  const config = LEVEL_CONFIG[levelIndex];
  gameState.gridSize = config.gridSize;
  gameState.grid = [];
  
  for (let row = 0; row < config.gridSize; row++) {
    gameState.grid[row] = [];
    for (let col = 0; col < config.gridSize; col++) {
      gameState.grid[row][col] = null;
    }
  }
  
  // Spawn initial items
  for (let i = 0; i < config.initialItems; i++) {
    spawnRandomItem();
  }
}

export function spawnRandomItem() {
  const emptyCells = [];
  for (let row = 0; row < gameState.gridSize; row++) {
    for (let col = 0; col < gameState.gridSize; col++) {
      if (gameState.grid[row][col] === null) {
        emptyCells.push({ row, col });
      }
    }
  }
  
  if (emptyCells.length === 0) return null;
  
  const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  const item = createRandomItem(randomCell.col, randomCell.row, gameState.itemIdCounter++);
  gameState.grid[randomCell.row][randomCell.col] = item;
  item.updateScreenPosition(GRID_START_X, GRID_START_Y);
  
  return item;
}

export function getItemAtGridPosition(gridX, gridY) {
  if (gridX < 0 || gridX >= gameState.gridSize || gridY < 0 || gridY >= gameState.gridSize) {
    return null;
  }
  return gameState.grid[gridY][gridX];
}

export function screenToGrid(screenX, screenY) {
  const gridX = Math.floor((screenX - GRID_START_X) / CELL_SIZE);
  const gridY = Math.floor((screenY - GRID_START_Y) / CELL_SIZE);
  return { gridX, gridY };
}

export function isValidGridPosition(gridX, gridY) {
  return gridX >= 0 && gridX < gameState.gridSize && gridY >= 0 && gridY < gameState.gridSize;
}

export function tryMergeItems(item1, item2) {
  if (!item1 || !item2) return false;
  if (item1 === item2) return false;
  if (item1.itemType !== item2.itemType) return false;
  if (item1.level !== item2.level) return false;
  
  const maxLevel = ITEM_TYPES[item1.itemType].maxLevel;
  if (item1.level >= maxLevel) return false;
  
  // Merge successful
  const newLevel = item1.level + 1;
  
  // Remove item2 from grid
  gameState.grid[item2.gridY][item2.gridX] = null;
  
  // Upgrade item1
  item1.level = newLevel;
  item1.mergeFlash = 1;
  item1.spawnProgress = 0;
  
  // Award points
  const points = 10 * newLevel;
  gameState.score += points;
  
  return true;
}

export function removeItemFromGrid(item) {
  if (!item) return;
  gameState.grid[item.gridY][item.gridX] = null;
}

export function moveItemToGrid(item, newGridX, newGridY) {
  if (!item) return false;
  if (!isValidGridPosition(newGridX, newGridY)) return false;
  
  const targetCell = gameState.grid[newGridY][newGridX];
  
  // Try merge if target cell has an item
  if (targetCell) {
    return tryMergeItems(targetCell, item);
  }
  
  // Remove from old position
  gameState.grid[item.gridY][item.gridX] = null;
  
  // Move to new position
  item.gridX = newGridX;
  item.gridY = newGridY;
  gameState.grid[newGridY][newGridX] = item;
  item.updateScreenPosition(GRID_START_X, GRID_START_Y);
  item.isAnimating = true;
  item.animationProgress = 0;
  
  return true;
}

export function checkBoardFull() {
  for (let row = 0; row < gameState.gridSize; row++) {
    for (let col = 0; col < gameState.gridSize; col++) {
      if (gameState.grid[row][col] === null) {
        return false;
      }
    }
  }
  
  // Board is full, check for possible merges
  return !hasPossibleMerges();
}

export function hasPossibleMerges() {
  for (let row = 0; row < gameState.gridSize; row++) {
    for (let col = 0; col < gameState.gridSize; col++) {
      const item = gameState.grid[row][col];
      if (!item) continue;
      
      const maxLevel = ITEM_TYPES[item.itemType].maxLevel;
      if (item.level >= maxLevel) continue;
      
      // Check adjacent cells
      const neighbors = [
        { row: row - 1, col },
        { row: row + 1, col },
        { row, col: col - 1 },
        { row, col: col + 1 }
      ];
      
      for (const neighbor of neighbors) {
        if (isValidGridPosition(neighbor.col, neighbor.row)) {
          const neighborItem = gameState.grid[neighbor.row][neighbor.col];
          if (neighborItem && neighborItem.itemType === item.itemType && neighborItem.level === item.level) {
            return true;
          }
        }
      }
    }
  }
  
  return false;
}

export function getAllItems() {
  const items = [];
  for (let row = 0; row < gameState.gridSize; row++) {
    for (let col = 0; col < gameState.gridSize; col++) {
      if (gameState.grid[row][col]) {
        items.push(gameState.grid[row][col]);
      }
    }
  }
  return items;
}