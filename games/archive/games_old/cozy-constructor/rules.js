// rules.js - Level rule checking

import { gameState } from './globals.js';
import { checkOverlap } from './item.js';

export function checkAllRules(levelConfig) {
  for (let rule of levelConfig.rules) {
    if (!checkRule(rule, levelConfig)) {
      return { passed: false, message: rule.message };
    }
  }
  return { passed: true, message: "" };
}

function checkRule(rule, levelConfig) {
  switch (rule.type) {
    case "ALL_PLACED":
      return gameState.placedItems.length === gameState.inventory.length;
    
    case "NO_OVERLAP":
      for (let i = 0; i < gameState.placedItems.length; i++) {
        for (let j = i + 1; j < gameState.placedItems.length; j++) {
          if (checkOverlap(gameState.placedItems[i], gameState.placedItems[j])) {
            return false;
          }
        }
      }
      return true;
    
    case "RUG_UNDER":
      const rug = gameState.placedItems.find(item => item.id === rule.rugId);
      if (!rug) return false;
      
      const rugCells = rug.getOccupiedCells();
      const rugCellSet = new Set(rugCells.map(c => `${c.x},${c.y}`));
      
      for (let itemId of rule.itemIds) {
        const item = gameState.placedItems.find(i => i.id === itemId);
        if (!item) return false;
        
        const itemCells = item.getOccupiedCells();
        for (let cell of itemCells) {
          if (!rugCellSet.has(`${cell.x},${cell.y}`)) {
            return false;
          }
        }
      }
      return true;
    
    case "AGAINST_WALL":
      const wallItem = gameState.placedItems.find(item => item.id === rule.itemId);
      if (!wallItem) return false;
      
      const bounds = wallItem.getBounds();
      const isAgainstWall = bounds.minX === 0 || bounds.minY === 0 || 
                           bounds.maxX === gameState.gridSize - 1 || 
                           bounds.maxY === gameState.gridSize - 1;
      return isAgainstWall;
    
    case "ON_TOP":
      const topItem = gameState.placedItems.find(item => item.id === rule.itemId);
      const baseItem = gameState.placedItems.find(item => item.id === rule.baseId);
      if (!topItem || !baseItem) return false;
      
      const baseCells = baseItem.getOccupiedCells();
      const baseCellSet = new Set(baseCells.map(c => `${c.x},${c.y}`));
      const topCells = topItem.getOccupiedCells();
      
      for (let cell of topCells) {
        if (!baseCellSet.has(`${cell.x},${cell.y}`)) {
          return false;
        }
      }
      return true;
    
    case "IN_ZONE":
      for (let item of gameState.placedItems) {
        const bounds = item.getBounds();
        if (bounds.minX < rule.zoneX || bounds.maxX >= rule.zoneX + rule.zoneW ||
            bounds.minY < rule.zoneY || bounds.maxY >= rule.zoneY + rule.zoneH) {
          return false;
        }
      }
      return true;
    
    default:
      return true;
  }
}

export function getCurrentLevelConfig(levels) {
  return levels[gameState.currentLevel];
}