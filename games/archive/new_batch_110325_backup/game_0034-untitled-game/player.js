// player.js - Player state management

import { gameState } from './globals.js';

export class Player {
  constructor() {
    this.x = 300;
    this.y = 350;
    this.scene = "entrance";
  }

  update() {
    // Player position is conceptual in this point-and-click game
  }

  addItem(itemId) {
    if (!gameState.inventory.includes(itemId)) {
      gameState.inventory.push(itemId);
      gameState.score += 10;
    }
  }

  hasItem(itemId) {
    return gameState.inventory.includes(itemId);
  }

  addJournalEntry(entry) {
    if (!gameState.journal.includes(entry)) {
      gameState.journal.push(entry);
    }
  }
}