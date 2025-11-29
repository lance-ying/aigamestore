import { CANVAS_WIDTH, CANVAS_HEIGHT, HOUSE_COLORS } from './globals.js';

export class Player {
  constructor(x, y, house = 'GRYFFINDOR') {
    this.x = x;
    this.y = y;
    this.house = house;
    this.color = HOUSE_COLORS[house];
    this.size = 30;
  }
  
  render(p) {
    p.push();
    p.fill(...this.color);
    p.stroke(255);
    p.strokeWeight(2);
    p.circle(this.x, this.y, this.size);
    
    // Simple wizard hat
    p.fill(20, 20, 60);
    p.triangle(
      this.x, this.y - this.size/2 - 15,
      this.x - 12, this.y - this.size/2,
      this.x + 12, this.y - this.size/2
    );
    p.pop();
  }
  
  update() {
    // Player is static in this game
  }
}