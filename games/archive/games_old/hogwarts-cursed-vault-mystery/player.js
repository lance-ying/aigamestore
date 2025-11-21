import { gameState } from './globals.js';

export class Player {
  constructor() {
    this.x = 50;
    this.y = 50;
    this.width = 30;
    this.height = 50;
    this.houseColor = [200, 30, 30];
  }
  
  update() {
    // Player position is mostly UI-based, not actively moving
  }
  
  render(p) {
    p.push();
    p.fill(40, 40, 60);
    p.rect(this.x, this.y, this.width, this.height);
    p.fill(...this.houseColor);
    p.rect(this.x + 5, this.y + 15, this.width - 10, 8);
    p.fill(220, 200, 180);
    p.ellipse(this.x + this.width/2, this.y + 8, 12, 12);
    p.pop();
  }
}