// player.js - Player entity and inventory management

import { gameState } from './globals.js';

export class Player {
  constructor(name) {
    this.name = name;
    this.x = 300;
    this.y = 350;
    this.game_x = 300;
    this.game_y = 350;
  }

  addToInventory(itemId, description) {
    const item = {
      id: itemId,
      description: description,
      combined: false
    };
    gameState.inventory.push(item);
    gameState.score += 10;
  }

  removeFromInventory(itemId) {
    const index = gameState.inventory.findIndex(item => item.id === itemId);
    if (index !== -1) {
      gameState.inventory.splice(index, 1);
    }
  }

  hasItem(itemId) {
    return gameState.inventory.some(item => item.id === itemId);
  }
}

export function createPlayer() {
  return new Player("George Stobbart");
}

export function combineItems(item1Id, item2Id) {
  // Define valid combinations
  const combinations = {
    'briefcase_cipher_wheel': {
      result: 'decoded_briefcase',
      description: 'Decoded documents revealing meeting locations',
      remove: ['briefcase', 'cipher_wheel']
    }
  };

  const key1 = `${item1Id}_${item2Id}`;
  const key2 = `${item2Id}_${item1Id}`;

  if (combinations[key1]) {
    return combinations[key1];
  } else if (combinations[key2]) {
    return combinations[key2];
  }

  return null;
}