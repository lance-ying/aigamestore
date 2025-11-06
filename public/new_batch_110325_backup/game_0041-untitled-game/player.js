// player.js - Player/Detective character

import { gameState } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.game_x = x;
    this.game_y = y;
    this.width = 30;
    this.height = 50;
    this.color = [60, 120, 200];
  }
  
  update() {
    // Player position is mostly static in this point-and-click game
    this.game_x = this.x;
    this.game_y = this.y;
  }
  
  render(p) {
    p.push();
    // Draw detective character (simplified)
    p.fill(...this.color);
    p.stroke(0);
    p.strokeWeight(2);
    
    // Body
    p.rect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
    
    // Head
    p.fill(220, 180, 150);
    p.ellipse(this.x, this.y - this.height / 2 - 10, 20, 20);
    
    // Detective hat
    p.fill(40, 40, 40);
    p.rect(this.x - 12, this.y - this.height / 2 - 20, 24, 8);
    p.rect(this.x - 8, this.y - this.height / 2 - 28, 16, 8);
    
    // Coat details
    p.stroke(40, 80, 150);
    p.line(this.x, this.y - this.height / 2, this.x, this.y + this.height / 2);
    
    p.pop();
  }
}

export function createPlayer(x, y) {
  const player = new Player(x, y);
  gameState.player = player;
  return player;
}