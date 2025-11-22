// player.js - Player class

import { gameState } from './globals.js';

export class Player {
  constructor() {
    this.x = 0;
    this.y = 0;
  }
  
  update() {
    // Player doesn't have a physical representation in this game
    // This is here for structure and potential future use
  }
  
  render(p) {
    // Player rendering would go here if needed
  }
}