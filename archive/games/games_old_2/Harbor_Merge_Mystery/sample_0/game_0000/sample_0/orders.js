// orders.js - Order management system

import { gameState, ITEM_TYPES } from './globals.js';

export class Order {
  constructor(itemType, level, quantity, id) {
    this.itemType = itemType;
    this.level = level;
    this.quantity = quantity;
    this.id = id;
    this.completed = false;
  }

  matches(item) {
    return item.itemType === this.itemType && item.level === this.level;
  }

  fulfill(item) {
    if (!this.matches(item)) return false;
    
    this.quantity--;
    if (this.quantity <= 0) {
      this.completed = true;
    }
    
    // Award points
    const points = 50 + (10 * this.level);
    gameState.score += points;
    
    return true;
  }
}

export function generateRandomOrder(id, currentLevel) {
  const itemTypes = Object.keys(ITEM_TYPES);
  const randomType = itemTypes[Math.floor(Math.random() * itemTypes.length)];
  
  // Level determines max item level in orders
  const maxItemLevel = Math.min(currentLevel + 2, ITEM_TYPES[randomType].maxLevel);
  const minItemLevel = Math.max(1, currentLevel - 1);
  const level = Math.floor(Math.random() * (maxItemLevel - minItemLevel + 1)) + minItemLevel;
  
  const quantity = Math.floor(Math.random() * 2) + 1; // 1-2 items
  
  return new Order(randomType, level, quantity, id);
}

export function initializeOrders(levelIndex) {
  gameState.orders = [];
  const numOrders = Math.min(3, 2 + levelIndex); // Start with 2-3 orders
  
  for (let i = 0; i < numOrders; i++) {
    gameState.orders.push(generateRandomOrder(i, levelIndex + 1));
  }
}

export function addNewOrder() {
  if (gameState.orders.length < 5) {
    const maxId = gameState.orders.reduce((max, order) => Math.max(max, order.id), -1);
    gameState.orders.push(generateRandomOrder(maxId + 1, gameState.currentLevel + 1));
  }
}

export function removeCompletedOrders() {
  gameState.orders = gameState.orders.filter(order => !order.completed);
}