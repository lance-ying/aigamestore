// boat.js - Boat class

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Boat {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 300;
    this.height = 80;
    this.bobOffset = 0;
    this.bobSpeed = 0.02;
  }

  update() {
    // Gentle bobbing animation
    this.bobOffset += this.bobSpeed;
  }

  draw(p) {
    p.push();
    
    const bobY = this.y + Math.sin(this.bobOffset) * 3;
    
    // Water waves
    p.fill(60, 120, 180, 100);
    for (let i = 0; i < 5; i++) {
      const waveX = (this.bobOffset * 20 + i * 30) % CANVAS_WIDTH;
      p.ellipse(waveX, bobY + 40, 30, 10);
    }
    
    // Boat hull
    p.fill(120, 80, 50);
    p.beginShape();
    p.vertex(this.x - this.width / 2 + 20, bobY);
    p.vertex(this.x - this.width / 2, bobY + 30);
    p.vertex(this.x + this.width / 2, bobY + 30);
    p.vertex(this.x + this.width / 2 - 20, bobY);
    p.endShape(p.CLOSE);
    
    // Deck
    p.fill(150, 100, 60);
    p.rect(this.x - this.width / 2 + 10, bobY - 10, this.width - 20, 10);
    
    // Mast
    p.fill(100, 70, 40);
    p.rect(this.x - 5, bobY - 80, 10, 70);
    
    // Sail
    p.fill(240, 230, 220, 200);
    p.triangle(
      this.x, bobY - 75,
      this.x + 40, bobY - 50,
      this.x, bobY - 25
    );
    
    // Kitchen area (small structure)
    p.fill(140, 90, 50);
    p.rect(this.x - 60, bobY - 30, 40, 20);
    p.fill(100, 60, 30);
    p.rect(this.x - 55, bobY - 32, 30, 3);
    
    // Kitchen smoke when cooking
    p.fill(200, 200, 200, 100);
    p.ellipse(this.x - 40, bobY - 35, 10, 10);
    p.ellipse(this.x - 38, bobY - 40, 8, 8);
    
    p.pop();
  }

  getDeckY() {
    return this.y + Math.sin(this.bobOffset) * 3 - 10;
  }
}