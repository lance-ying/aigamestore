// projectiles.js - Projectile implementation

import { gameState, COLORS } from './globals.js';
import { removeFromArray, isOnScreen, distance } from './utils.js';
import { createParticleBurst } from './particles.js';

export class EnergySlash {
  constructor(x, y, angle, p) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.speed = 8;
    this.vx = Math.cos(angle) * this.speed;
    this.vy = Math.sin(angle) * this.speed;
    this.width = 30;
    this.height = 10;
    this.damage = 20;
    this.lifetime = 30;
    this.age = 0;
    
    // Trail effect
    this.trail = [];
    
    gameState.projectiles.push(this);
  }
  
  update(p) {
    // Add to trail
    this.trail.push({ x: this.x, y: this.y, age: 0 });
    if (this.trail.length > 5) {
      this.trail.shift();
    }
    
    // Update trail ages
    for (const point of this.trail) {
      point.age++;
    }
    
    // Move
    this.x += this.vx;
    this.y += this.vy;
    this.age++;
    
    // Check lifetime
    if (this.age >= this.lifetime) {
      this.destroy();
      return;
    }
    
    // Check collision with enemies
    for (const enemy of gameState.enemies) {
      const dist = distance(this.x, this.y, enemy.x, enemy.y);
      if (dist < 15 + enemy.radius) {
        enemy.takeDamage(this.damage);
        this.destroy();
        return;
      }
    }
  }
  
  destroy() {
    createParticleBurst(this.x, this.y, 5, COLORS.energy);
    removeFromArray(gameState.projectiles, this);
  }
  
  render(p) {
    if (!isOnScreen(this.x, this.y)) return;
    
    // Render trail
    for (let i = 0; i < this.trail.length; i++) {
      const point = this.trail[i];
      const screenX = point.x - gameState.cameraX + gameState.cameraShakeX;
      const screenY = point.y - gameState.cameraY + gameState.cameraShakeY;
      
      const alpha = 100 - (point.age * 20);
      p.fill(...COLORS.energy, alpha);
      p.noStroke();
      p.circle(screenX, screenY, 8);
    }
    
    // Render main projectile
    const screenX = this.x - gameState.cameraX + gameState.cameraShakeX;
    const screenY = this.y - gameState.cameraY + gameState.cameraShakeY;
    
    p.push();
    p.translate(screenX, screenY);
    p.rotate(this.angle);
    
    // Glow
    p.fill(...COLORS.energy, 150);
    p.noStroke();
    p.ellipse(0, 0, this.width * 1.5, this.height * 1.5);
    
    // Main shape
    p.fill(...COLORS.energy);
    p.stroke(255);
    p.strokeWeight(2);
    p.ellipse(0, 0, this.width, this.height);
    
    p.pop();
  }
}