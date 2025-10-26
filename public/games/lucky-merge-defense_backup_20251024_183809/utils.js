// utils.js - Utility functions

import { gameState, GRID_SIZE, GRID_COLS, GRID_ROWS } from './globals.js';

export function gridToScreen(gridX, gridY) {
  return {
    x: gridX * GRID_SIZE + GRID_SIZE / 2,
    y: gridY * GRID_SIZE + GRID_SIZE / 2
  };
}

export function isValidGridPosition(gridX, gridY) {
  return gridX >= 0 && gridX < GRID_COLS && gridY >= 0 && gridY < GRID_ROWS;
}

export function isGridCellEmpty(gridX, gridY) {
  if (!isValidGridPosition(gridX, gridY)) return false;
  return gameState.grid[gridY][gridX].isEmpty;
}

export function isGridCellPlaceable(gridX, gridY) {
  if (!isValidGridPosition(gridX, gridY)) return false;
  return gameState.grid[gridY][gridX].isPlaceable && gameState.grid[gridY][gridX].isEmpty;
}

export function getUnitAt(gridX, gridY) {
  return gameState.units.find(u => u.gridX === gridX && u.gridY === gridY);
}

export function arePositionsAdjacent(x1, y1, x2, y2) {
  const dx = Math.abs(x1 - x2);
  const dy = Math.abs(y1 - y2);
  return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
}

export function distance(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

export function getRarityColor(rarity) {
  switch (rarity) {
    case "COMMON": return [255, 255, 255];
    case "UNCOMMON": return [50, 255, 50];
    case "RARE": return [50, 150, 255];
    case "EPIC": return [200, 50, 255];
    case "LEGENDARY": return [255, 215, 0];
    default: return [255, 255, 255];
  }
}

export function getNextRarity(currentRarity) {
  const rarities = ["COMMON", "UNCOMMON", "RARE", "EPIC", "LEGENDARY"];
  const index = rarities.indexOf(currentRarity);
  if (index >= 0 && index < rarities.length - 1) {
    return rarities[index + 1];
  }
  return "LEGENDARY";
}