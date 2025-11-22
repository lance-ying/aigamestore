import { CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 16;
    this.color = [50, 150, 255];
  }
  
  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }
  
  draw(p) {
    p.push();
    p.fill(...this.color);
    p.stroke(255);
    p.strokeWeight(2);
    
    // Draw player as a person icon
    p.ellipse(this.x, this.y - 8, 10, 10); // head
    p.line(this.x, this.y - 3, this.x, this.y + 5); // body
    p.line(this.x - 5, this.y, this.x + 5, this.y); // arms
    p.line(this.x, this.y + 5, this.x - 4, this.y + 12); // left leg
    p.line(this.x, this.y + 5, this.x + 4, this.y + 12); // right leg
    
    p.pop();
  }
}