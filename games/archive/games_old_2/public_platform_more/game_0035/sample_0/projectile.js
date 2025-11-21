// projectile.js - Projectile entity

import { gameState } from './globals.js';

export class Projectile {
  constructor(x, y, target, damage, color, type) {
    this.x = x;
    this.y = y;
    this.target = target;
    this.damage = damage;
    this.color = color;
    this.type = type;
    this.speed = 8;
    this.alive = true;
    this.trail = [];
  }
  
  update(p) {
    if (!this.target || !this.target.alive) {
      this.alive = false;
      return;
    }
    
    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < this.speed) {
      // Hit target
      const killed = this.target.takeDamage(this.damage, p);
      
      // Track kills for towers
      if (killed) {
        for (let tower of gameState.towers) {
          if (tower.target === this.target) {
            tower.kills++;
          }
        }
      }
      
      this.alive = false;
    } else {
      this.x += (dx / dist) * this.speed;
      this.y += (dy / dist) * this.speed;
    }
    
    // Update trail
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 5) {
      this.trail.shift();
    }
  }
  
  draw(p) {
    if (!this.alive) return;
    
    // Draw trail
    for (let i = 0; i < this.trail.length; i++) {
      const alpha = (i / this.trail.length) * 150;
      p.fill(...this.color, alpha);
      p.noStroke();
      const size = 4 + (i / this.trail.length) * 4;
      p.circle(this.trail[i].x, this.trail[i].y, size);
    }
    
    // Draw projectile
    p.fill(...this.color);
    p.stroke(255);
    p.strokeWeight(1);
    
    if (this.type === 'ARTILLERY') {
      p.circle(this.x, this.y, 10);
    } else {
      p.circle(this.x, this.y, 6);
    }
  }
}