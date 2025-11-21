import { gameState } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.screenX = x;
    this.screenY = y;
    this.gameX = x;
    this.gameY = y;
  }
  
  update() {
    // Player is static in this game
    this.screenX = this.x;
    this.screenY = this.y;
    this.gameX = this.x;
    this.gameY = this.y;
  }
  
  draw(p) {
    p.push();
    // Draw simple fisherman silhouette
    p.fill(40, 30, 20);
    // Body
    p.rect(this.x - 10, this.y - 40, 20, 40);
    // Head
    p.ellipse(this.x, this.y - 50, 20, 20);
    // Arms (right arm extended holding rod)
    p.stroke(40, 30, 20);
    p.strokeWeight(4);
    p.line(this.x, this.y - 35, this.x + 15, this.y - 25);
    // Rod
    p.stroke(80, 60, 40);
    p.strokeWeight(3);
    p.line(this.x + 15, this.y - 25, this.x + 40, this.y - 50);
    p.noStroke();
    p.pop();
  }
}