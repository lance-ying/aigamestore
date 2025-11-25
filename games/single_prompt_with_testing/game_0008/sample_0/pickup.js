// pickup.js - Collectible items and pickups
import { gameState } from './globals.js';

export class SoulPickup {
  constructor(p, x, y, value) {
    this.x = x;
    this.y = y;
    this.value = value;
    this.collected = false;
    this.floatOffset = p.random(0, Math.PI * 2);
    this.p = p;
  }

  update() {
    this.floatOffset += 0.05;
    
    if (gameState.player) {
      let dist = Math.sqrt((this.x - gameState.player.x) ** 2 + (this.y - gameState.player.y) ** 2);
      if (dist < 25) {
        this.collect();
      }
    }
  }

  collect() {
    if (!this.collected) {
      this.collected = true;
      gameState.score += this.value;
    }
  }

  draw(p, cameraY) {
    if (this.collected) return;
    
    let screenY = this.y - cameraY + Math.sin(this.floatOffset) * 3;
    
    p.push();
    p.noStroke();
    
    // Glow
    p.fill(150, 200, 255, 50);
    p.circle(this.x, screenY, 20);
    
    // Core
    p.fill(180, 220, 255);
    p.circle(this.x, screenY, 12);
    
    // Inner light
    p.fill(220, 240, 255);
    p.circle(this.x, screenY, 6);
    
    p.pop();
  }
}

export class DashPickup {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.collected = false;
    this.floatOffset = 0;
    this.pulseOffset = 0;
  }

  update() {
    this.floatOffset += 0.05;
    this.pulseOffset += 0.1;
    
    if (gameState.player && !this.collected) {
      let dist = Math.sqrt((this.x - gameState.player.x) ** 2 + (this.y - gameState.player.y) ** 2);
      if (dist < 30) {
        this.collect();
      }
    }
  }

  collect() {
    if (!this.collected) {
      this.collected = true;
      gameState.dashUnlocked = true;
    }
  }

  draw(p, cameraY) {
    if (this.collected) return;
    
    let screenY = this.y - cameraY + Math.sin(this.floatOffset) * 5;
    let pulse = 1 + Math.sin(this.pulseOffset) * 0.2;
    
    p.push();
    p.translate(this.x, screenY);
    
    // Outer glow
    p.noStroke();
    p.fill(255, 200, 100, 80);
    p.circle(0, 0, 40 * pulse);
    
    // Symbol
    p.fill(255, 220, 150);
    p.circle(0, 0, 20 * pulse);
    
    // Dash icon
    p.fill(200, 160, 80);
    p.triangle(-8 * pulse, 0, 8 * pulse, -4 * pulse, 8 * pulse, 4 * pulse);
    
    p.pop();
  }
}