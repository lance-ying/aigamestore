// player.js - Player and Dealer classes

import { MAX_HEALTH } from './globals.js';

export class Player {
  constructor(name, isDealer = false) {
    this.name = name;
    this.isDealer = isDealer;
    this.health = MAX_HEALTH;
    this.x = isDealer ? 450 : 150;
    this.y = 200;
    this.width = 80;
    this.height = 100;
  }
  
  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
  }
  
  heal(amount) {
    this.health = Math.min(MAX_HEALTH, this.health + amount);
  }
  
  isDead() {
    return this.health <= 0;
  }
  
  reset() {
    this.health = MAX_HEALTH;
  }
}