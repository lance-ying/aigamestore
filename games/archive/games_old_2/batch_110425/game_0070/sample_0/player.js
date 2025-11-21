// player.js - Player class

import { gameState } from './globals.js';

export class Player {
  constructor() {
    this.x = 300;
    this.y = 300;
  }
  
  update() {
    // Player position is managed by room navigation
  }
  
  addItem(itemId) {
    if (gameState.inventory.length < gameState.maxInventorySize) {
      gameState.inventory.push(itemId);
      return true;
    }
    return false;
  }
  
  removeItem(itemId) {
    const index = gameState.inventory.indexOf(itemId);
    if (index > -1) {
      gameState.inventory.splice(index, 1);
      if (gameState.selectedInventoryIndex === index) {
        gameState.selectedInventoryIndex = -1;
      } else if (gameState.selectedInventoryIndex > index) {
        gameState.selectedInventoryIndex--;
      }
      return true;
    }
    return false;
  }
  
  hasItem(itemId) {
    return gameState.inventory.includes(itemId);
  }
}