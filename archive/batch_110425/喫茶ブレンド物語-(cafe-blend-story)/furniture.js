// furniture.js - Furniture placement and management

import { gameState, GRID_SIZE, GRID_COLS, GRID_ROWS, FURNITURE_TYPES } from './globals.js';

export function canPlaceFurniture(furnitureType, gridX, gridY) {
  if (gridX < 0 || gridY < 0 || gridX + furnitureType.width > GRID_COLS || gridY + furnitureType.height > GRID_ROWS) {
    return false;
  }
  
  // Check if grid cells are empty
  for (let i = 0; i < furnitureType.width; i++) {
    for (let j = 0; j < furnitureType.height; j++) {
      if (gameState.grid[gridX + i][gridY + j] !== null) {
        return false;
      }
    }
  }
  
  return true;
}

export function placeFurniture(furnitureType, gridX, gridY) {
  if (!canPlaceFurniture(furnitureType, gridX, gridY)) {
    return false;
  }
  
  if (gameState.money < furnitureType.cost) {
    return false;
  }
  
  const furniture = {
    type: furnitureType.id,
    gridX: gridX,
    gridY: gridY,
    width: furnitureType.width,
    height: furnitureType.height,
    color: furnitureType.color
  };
  
  // Mark grid cells as occupied
  for (let i = 0; i < furnitureType.width; i++) {
    for (let j = 0; j < furnitureType.height; j++) {
      gameState.grid[gridX + i][gridY + j] = furniture;
    }
  }
  
  gameState.furniture.push(furniture);
  gameState.money -= furnitureType.cost;
  
  return true;
}

export function unlockFurniture(furnitureId) {
  const furniture = FURNITURE_TYPES.find(f => f.id === furnitureId);
  if (furniture && !furniture.unlocked && gameState.money >= furniture.unlockCost) {
    gameState.money -= furniture.unlockCost;
    furniture.unlocked = true;
    return true;
  }
  return false;
}

export function calculateAmbianceBonus() {
  let bonus = 0;
  
  // Count special furniture
  const lights = gameState.furniture.filter(f => f.type === 'light').length;
  const plants = gameState.furniture.filter(f => f.type === 'plant').length;
  const shelves = gameState.furniture.filter(f => f.type === 'shelf').length;
  
  bonus += lights * 5;
  bonus += plants * 3;
  bonus += shelves * 4;
  
  return bonus;
}