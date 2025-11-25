// everdoor.js - Everdoor (final destination)

import { CANVAS_HEIGHT } from './globals.js';

export class Everdoor {
  constructor(x) {
    this.x = x;
    this.y = CANVAS_HEIGHT - 150;
    this.width = 60;
    this.height = 100;
    this.glowPhase = 0;
  }

  update() {
    this.glowPhase += 0.05;
  }

  draw(p) {
    p.push();
    
    // Glow
    const glowAlpha = 100 + Math.sin(this.glowPhase) * 50;
    p.fill(255, 255, 200, glowAlpha);
    p.noStroke();
    p.ellipse(this.x + this.width / 2, this.y + this.height / 2, this.width + 40, this.height + 40);
    
    // Door frame
    p.fill(80, 60, 100);
    p.rect(this.x, this.y, this.width, this.height, 10, 10, 0, 0);
    
    // Door
    p.fill(200, 180, 255, 150);
    p.rect(this.x + 5, this.y + 5, this.width - 10, this.height - 5, 8, 8, 0, 0);
    
    // Light rays
    p.stroke(255, 255, 200, 100);
    p.strokeWeight(2);
    for (let i = 0; i < 5; i++) {
      const angle = p.PI / 2 + (i - 2) * 0.3;
      const len = 50 + Math.sin(this.glowPhase + i) * 20;
      p.line(
        this.x + this.width / 2,
        this.y + this.height,
        this.x + this.width / 2 + Math.cos(angle) * len,
        this.y + this.height + Math.sin(angle) * len
      );
    }
    p.noStroke();
    
    // Portal swirl
    p.noFill();
    p.stroke(255, 255, 255, 100);
    p.strokeWeight(2);
    for (let r = 10; r < 30; r += 5) {
      p.arc(
        this.x + this.width / 2,
        this.y + this.height / 2,
        r, r,
        this.glowPhase, this.glowPhase + p.PI
      );
    }
    p.noStroke();
    
    p.pop();
  }

  isNear(playerX, boatX) {
    return Math.abs(boatX - this.x) < 100;
  }
}