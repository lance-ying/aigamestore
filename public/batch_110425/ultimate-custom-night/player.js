// player.js - Player representation (office manager)

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Player {
  constructor() {
    // Player is stationary in office
    this.x = CANVAS_WIDTH / 2;
    this.y = CANVAS_HEIGHT / 2;
    this.alive = true;
    this.stress = 0; // 0-100, increases with threats
  }
  
  update() {
    // Calculate stress based on nearby animatronics
    let threatLevel = 0;
    for (const anim of gameState.animatronics) {
      if (anim.position > 70) {
        threatLevel += 1;
      }
      if (anim.atEntryPoint) {
        threatLevel += 2;
      }
    }
    
    this.stress = Math.min(100, threatLevel * 5);
  }
  
  getPosition() {
    return { x: this.x, y: this.y };
  }
}