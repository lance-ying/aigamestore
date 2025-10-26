// animal.js - Animal management

import { gameState, ANIMAL_TYPES } from './globals.js';

export class Animal {
  constructor(type, x, y) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.data = ANIMAL_TYPES[type];
    this.lastProductionTime = gameState.gameTime;
    this.ready = false;
    this.animationOffset = Math.random() * 100;
  }
  
  update() {
    const elapsed = gameState.gameTime - this.lastProductionTime;
    if (elapsed >= this.data.productionTime) {
      this.ready = true;
    }
  }
  
  collect() {
    if (this.ready) {
      this.ready = false;
      this.lastProductionTime = gameState.gameTime;
      return {
        product: this.data.product,
        xp: this.data.xp,
        score: this.data.score
      };
    }
    return null;
  }
}

export function createAnimal(type, x, y) {
  if (ANIMAL_TYPES[type]) {
    return new Animal(type, x, y);
  }
  return null;
}