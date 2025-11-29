// collectibles.js - Coins and power-ups
import { gameState } from './globals.js';

export class Coin {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = 16;
    this.height = 16;
    this.collected = false;
    this.rotation = 0;
    this.floatOffset = 0;
    this.value = 10;
  }

  update() {
    this.rotation += 0.1;
    this.floatOffset += 0.08;
  }

  render() {
    const p = this.p;
    const camX = gameState.camera.x;
    const screenX = this.x - camX;
    const screenY = this.y + this.p.sin(this.floatOffset) * 3;
    
    if (this.collected) return;
    
    p.push();
    p.translate(screenX, screenY);
    p.rotate(this.rotation);
    
    // Gold coin
    p.fill(255, 215, 0);
    p.stroke(218, 165, 32);
    p.strokeWeight(2);
    p.ellipse(0, 0, 14, 14);
    
    // Coin detail
    p.fill(255, 223, 0);
    p.noStroke();
    p.ellipse(0, 0, 8, 8);
    
    // Shine
    p.fill(255, 255, 200);
    p.ellipse(-2, -2, 4, 4);
    
    p.pop();
  }

  getBounds() {
    return {
      x: this.x - this.width / 2,
      y: this.y - this.height / 2,
      width: this.width,
      height: this.height
    };
  }
}

export class Cloverleaf {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = 20;
    this.height = 20;
    this.collected = false;
    this.rotation = 0;
    this.pulseScale = 1;
    this.pulseDir = 0.02;
  }

  update() {
    this.rotation += 0.05;
    this.pulseScale += this.pulseDir;
    if (this.pulseScale > 1.2 || this.pulseScale < 0.9) {
      this.pulseDir *= -1;
    }
  }

  render() {
    const p = this.p;
    const camX = gameState.camera.x;
    const screenX = this.x - camX;
    const screenY = this.y;
    
    if (this.collected) return;
    
    p.push();
    p.translate(screenX, screenY);
    p.rotate(this.rotation);
    p.scale(this.pulseScale);
    
    // Four-leaf clover
    p.fill(50, 205, 50);
    p.noStroke();
    
    // Four leaves
    for (let i = 0; i < 4; i++) {
      p.push();
      p.rotate(i * p.PI / 2);
      p.ellipse(0, -6, 8, 10);
      p.pop();
    }
    
    // Center
    p.fill(34, 139, 34);
    p.ellipse(0, 0, 6, 6);
    
    // Stem
    p.fill(34, 139, 34);
    p.rect(-1, 6, 2, 8);
    
    p.pop();
  }

  getBounds() {
    return {
      x: this.x - this.width / 2,
      y: this.y - this.height / 2,
      width: this.width,
      height: this.height
    };
  }
}