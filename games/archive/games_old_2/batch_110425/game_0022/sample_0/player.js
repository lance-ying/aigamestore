// player.js - Player entity class

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 30;
    this.height = 30;
    this.color = [255, 200, 100];
    this.animationFrame = 0;
  }
  
  update() {
    this.animationFrame++;
  }
  
  draw(p) {
    p.push();
    p.translate(this.x, this.y);
    
    // Draw squirrel character
    // Body
    p.fill(...this.color);
    p.ellipse(0, 0, this.width, this.height);
    
    // Tail
    const tailWave = Math.sin(this.animationFrame * 0.1) * 5;
    p.fill(200, 150, 80);
    p.beginShape();
    p.vertex(-this.width/2, 0);
    p.bezierVertex(-this.width, tailWave - 10, -this.width - 5, tailWave - 20, -this.width - 10, tailWave - 25);
    p.bezierVertex(-this.width - 5, tailWave - 20, -this.width, tailWave - 10, -this.width/2, 0);
    p.endShape(p.CLOSE);
    
    // Ears
    p.fill(180, 130, 70);
    p.triangle(-8, -15, -5, -25, -2, -15);
    p.triangle(2, -15, 5, -25, 8, -15);
    
    // Eyes
    p.fill(0);
    p.circle(-5, -3, 4);
    p.circle(5, -3, 4);
    
    // Nose
    p.fill(100, 70, 50);
    p.circle(0, 2, 3);
    
    p.pop();
  }
}