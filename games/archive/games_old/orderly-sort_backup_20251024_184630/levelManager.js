// levelManager.js - Level generation and progression

import { gameState, LEVEL_CONFIGS, CANVAS_WIDTH, CANVAS_HEIGHT, ITEM_TYPES } from './globals.js';
import { Item, Container } from './entities.js';

export function initializeLevel(p, levelNumber) {
  const config = LEVEL_CONFIGS[levelNumber - 1];
  if (!config) return false;
  
  gameState.levelConfig = config;
  gameState.currentLevel = levelNumber;
  gameState.timeRemaining = config.timeLimit;
  gameState.items = [];
  gameState.containers = [];
  gameState.entities = [];
  gameState.isHoldingItem = false;
  gameState.heldItemId = null;
  gameState.selectorIndex = 0;
  
  // Create containers for each type used in this level
  const types = config.types;
  const containerWidth = 90;
  const containerHeight = 80;
  const spacing = 10;
  const totalWidth = types.length * containerWidth + (types.length - 1) * spacing;
  const startX = (CANVAS_WIDTH - totalWidth) / 2;
  const containerY = CANVAS_HEIGHT - containerHeight - 20;
  
  for (let i = 0; i < types.length; i++) {
    const container = new Container(
      `container_${i}`,
      types[i],
      startX + i * (containerWidth + spacing),
      containerY,
      containerWidth,
      containerHeight
    );
    gameState.containers.push(container);
    gameState.entities.push(container);
  }
  
  // Create items randomly distributed
  const itemsPerType = Math.ceil(config.itemCount / types.length);
  let itemId = 0;
  
  for (let typeIdx = 0; typeIdx < types.length; typeIdx++) {
    const type = types[typeIdx];
    const count = Math.min(itemsPerType, config.itemCount - itemId);
    
    for (let i = 0; i < count; i++) {
      // Random position in upper area
      const margin = 40;
      const x = margin + p.random(CANVAS_WIDTH - 2 * margin);
      const y = margin + p.random(CANVAS_HEIGHT - containerHeight - 100);
      
      const item = new Item(`item_${itemId}`, type, x, y);
      gameState.items.push(item);
      gameState.entities.push(item);
      itemId++;
    }
  }
  
  return true;
}

export function checkLevelComplete() {
  // Check if all items are sorted
  for (const item of gameState.items) {
    if (!item.isSorted) {
      return false;
    }
  }
  return true;
}

export function getTotalItemsCount() {
  return gameState.items.length;
}

export function getSortedItemsCount() {
  return gameState.items.filter(item => item.isSorted).length;
}