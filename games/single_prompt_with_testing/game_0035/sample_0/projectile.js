// projectile.js - Projectile class

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { createHitEffect } from './particle.js';

export class Projectile {
  constructor(x, y, vx, vy, damage, owner, color) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.damage = damage;
    this.owner = owner; // 'player' or 'enemy'
    this.color = color;
    this.size = 6;
    this.dead = false;
    this.lifetime = 0;
    this.maxLifetime = 300;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.lifetime++;
    
    // Remove if out of bounds or too old
    if (this.x < 0 || this.x > CANVAS_WIDTH || 
        this.y < 0 || this.y > CANVAS_HEIGHT ||
        this.lifetime > this.maxLifetime) {
      this.dead = true;
    }
  }

  render(p) {
    p.push();
    p.noStroke();
    p.fill(...this.color);
    p.circle(this.x, this.y, this.size);
    
    // Trail effect
    p.fill(this.color[0], this.color[1], this.color[2], 100);
    p.circle(this.x - this.vx * 0.5, this.y - this.vy * 0.5, this.size * 0.7);
    p.pop();
  }

  onHit() {
    createHitEffect(this.x, this.y, this.color, 8);
    this.dead = true;
  }
}