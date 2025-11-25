// platform.js
import { gameState } from './globals.js';

export class Platform {
  constructor(x, y, width, height, type = 'normal') {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = type; // 'normal', 'moving', 'crumbling'
  }

  render(p) {
    p.push();
    p.translate(0, -gameState.cameraY);
    
    // Draw platform based on type
    if (this.type === 'normal') {
      p.fill(139, 90, 60);
      p.stroke(100, 60, 40);
      p.strokeWeight(2);
      p.rect(this.x, this.y, this.width, this.height, 4);
      
      // Brick pattern
      p.stroke(120, 75, 50);
      p.strokeWeight(1);
      for (let i = 0; i < this.width; i += 30) {
        p.line(this.x + i, this.y, this.x + i, this.y + this.height);
      }
    } else if (this.type === 'moving') {
      p.fill(100, 140, 180);
      p.stroke(70, 100, 140);
      p.strokeWeight(2);
      p.rect(this.x, this.y, this.width, this.height, 4);
    }
    
    p.pop();
  }
}

export class DestructibleBlock {
  constructor(x, y, size) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.destroyed = false;
    this.breakingTimer = 0;
  }

  destroy() {
    this.destroyed = true;
  }

  render(p) {
    if (this.destroyed) return;
    
    p.push();
    p.translate(0, -gameState.cameraY);
    
    // Crate appearance
    p.fill(180, 140, 90);
    p.stroke(120, 90, 60);
    p.strokeWeight(2);
    p.rect(this.x, this.y, this.size, this.size);
    
    // X marks
    p.stroke(100, 70, 40);
    p.line(this.x + 4, this.y + 4, this.x + this.size - 4, this.y + this.size - 4);
    p.line(this.x + this.size - 4, this.y + 4, this.x + 4, this.y + this.size - 4);
    
    p.pop();
  }
}

export class Pizza {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 20;
    this.collected = false;
    this.bobTimer = 0;
  }

  collect() {
    this.collected = true;
    gameState.score += 100;
  }

  update(p) {
    this.bobTimer += 0.1;
  }

  render(p) {
    if (this.collected) return;
    
    p.push();
    p.translate(0, -gameState.cameraY);
    
    const bobOffset = p.sin(this.bobTimer) * 3;
    
    // Pizza slice
    p.fill(255, 200, 80);
    p.stroke(200, 150, 50);
    p.strokeWeight(2);
    p.arc(this.x, this.y + bobOffset, this.size, this.size, 0, p.PI * 1.5, p.PIE);
    
    // Pepperoni
    p.fill(200, 50, 50);
    p.noStroke();
    p.ellipse(this.x - 2, this.y + bobOffset - 2, 4, 4);
    p.ellipse(this.x + 2, this.y + bobOffset + 2, 4, 4);
    
    // Cheese drip
    p.fill(255, 230, 100);
    p.triangle(this.x, this.y + bobOffset + 5, this.x - 3, this.y + bobOffset + 8, this.x + 3, this.y + bobOffset + 8);
    
    p.pop();
  }
}

export class ExitDoor {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 40;
    this.height = 60;
    this.glowTimer = 0;
  }

  update(p) {
    this.glowTimer += 0.1;
  }

  render(p) {
    p.push();
    p.translate(0, -gameState.cameraY);
    
    // Glow effect
    const glowAlpha = 100 + p.sin(this.glowTimer) * 50;
    p.fill(255, 215, 0, glowAlpha);
    p.noStroke();
    p.rect(this.x - 5, this.y - 5, this.width + 10, this.height + 10, 10);
    
    // Door
    p.fill(200, 100, 50);
    p.stroke(150, 70, 30);
    p.strokeWeight(3);
    p.rect(this.x, this.y, this.width, this.height, 5);
    
    // Door window
    p.fill(100, 200, 255);
    p.rect(this.x + 10, this.y + 10, 20, 25, 3);
    
    // Door knob
    p.fill(255, 215, 0);
    p.ellipse(this.x + this.width - 10, this.y + this.height / 2, 6, 6);
    
    // Exit text
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(10);
    p.text("EXIT", this.x + this.width / 2, this.y + this.height + 15);
    
    p.pop();
  }
}