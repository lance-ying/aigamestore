import { gameState, CANVAS_HEIGHT } from './globals.js';

export class Projectile {
  constructor(p, x, y, vx, vy, owner = 'player', chargeLevel = 0) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.owner = owner;
    this.chargeLevel = chargeLevel;
    
    // Base properties
    if (owner === 'player') {
      this.radius = 4 + (chargeLevel * 2);
      this.damage = 15 + (chargeLevel * 10);
    } else if (owner === 'boss') {
      this.radius = 5;
      this.damage = 20;
    } else {
      this.radius = 5;
      this.damage = 10;
    }
    
    this.active = true;
    this.life = 120;
    this.trail = [];
  }

  update() {
    // Store trail for charged shots
    if (this.chargeLevel > 0 && this.trail.length < 5) {
      this.trail.push({ x: this.x, y: this.y });
    } else if (this.trail.length > 0) {
      this.trail.shift();
      this.trail.push({ x: this.x, y: this.y });
    }
    
    this.x += this.vx;
    this.y += this.vy;
    this.life--;
    
    if (this.life <= 0 || this.y < -50 || this.y > CANVAS_HEIGHT + 50 || 
        this.x < -50 || this.x > gameState.stageWidth + 50) {
      this.active = false;
    }
  }

  draw() {
    if (!this.active) return;
    
    const p = this.p;
    const screenX = this.x - gameState.camera.x;
    const screenY = this.y - gameState.camera.y;
    
    p.push();
    
    if (this.owner === 'player') {
      // Draw trail for charged shots
      if (this.chargeLevel > 0) {
        for (let i = 0; i < this.trail.length; i++) {
          const t = this.trail[i];
          const tScreenX = t.x - gameState.camera.x;
          const tScreenY = t.y - gameState.camera.y;
          const alpha = (i / this.trail.length) * 150;
          p.fill(100, 200, 255, alpha);
          p.noStroke();
          p.ellipse(tScreenX, tScreenY, this.radius * 1.5, this.radius * 1.5);
        }
      }
      
      // Player projectile (blue energy)
      p.translate(screenX, screenY);
      
      if (this.chargeLevel >= 3) {
        // Max charge - large with glow
        p.fill(200, 240, 255, 200);
        p.ellipse(0, 0, this.radius * 4, this.radius * 4);
        p.fill(150, 220, 255, 255);
        p.ellipse(0, 0, this.radius * 3, this.radius * 3);
      } else if (this.chargeLevel >= 2) {
        // Mid charge
        p.fill(150, 220, 255, 200);
        p.ellipse(0, 0, this.radius * 3, this.radius * 3);
      } else if (this.chargeLevel >= 1) {
        // Low charge
        p.fill(120, 210, 255, 200);
        p.ellipse(0, 0, this.radius * 2.5, this.radius * 2.5);
      }
      
      // Core
      p.fill(100, 200, 255);
      p.noStroke();
      p.ellipse(0, 0, this.radius * 2, this.radius * 2);
      p.fill(200, 230, 255, 150);
      p.ellipse(0, 0, this.radius * 3, this.radius * 3);
    } else if (this.owner === 'boss') {
      // Boss projectile (purple)
      p.translate(screenX, screenY);
      p.fill(200, 50, 255);
      p.ellipse(0, 0, this.radius * 2, this.radius * 2);
      p.fill(255, 100, 255, 100);
      p.ellipse(0, 0, this.radius * 3, this.radius * 3);
    } else {
      // Enemy projectile (red)
      p.translate(screenX, screenY);
      p.fill(255, 50, 50);
      p.ellipse(0, 0, this.radius * 2, this.radius * 2);
      p.fill(255, 100, 100, 100);
      p.ellipse(0, 0, this.radius * 3, this.radius * 3);
    }
    
    p.pop();
  }
}