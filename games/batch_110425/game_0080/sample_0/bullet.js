// bullet.js - Bullet entities

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Bullet {
  constructor(p, x, y, angle, damage, speed = 8, owner = 'player') {
    this.p = p;
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.damage = damage;
    this.speed = speed;
    this.owner = owner;
    this.isDead = false;
    this.radius = owner === 'player' ? 4 : 3;
    
    this.vx = p.cos(angle) * speed;
    this.vy = p.sin(angle) * speed;
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    
    // Check boundaries
    if (this.x < 0 || this.x > CANVAS_WIDTH || this.y < 0 || this.y > CANVAS_HEIGHT) {
      this.isDead = true;
    }
  }
  
  render() {
    const p = this.p;
    
    p.push();
    p.noStroke();
    
    if (this.owner === 'player') {
      // Player bullets - bright cyan
      p.fill(100, 220, 255);
      p.circle(this.x, this.y, this.radius * 2);
      
      // Glow effect
      p.fill(100, 220, 255, 100);
      p.circle(this.x, this.y, this.radius * 3);
    } else {
      // Enemy bullets - red/orange
      p.fill(255, 100, 80);
      p.circle(this.x, this.y, this.radius * 2);
      
      // Glow effect
      p.fill(255, 100, 80, 100);
      p.circle(this.x, this.y, this.radius * 3);
    }
    
    p.pop();
  }
}