// projectile.js - Projectile class

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Projectile {
  constructor(p, x, y, vx, vy, owner = 'enemy') {
    this.p = p;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.width = 8;
    this.height = 8;
    this.owner = owner;
    this.alive = true;
    this.trail = [];
  }
  
  update() {
    if (!this.alive) return;
    
    // Add to trail
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 5) this.trail.shift();
    
    this.x += this.vx;
    this.y += this.vy;
    
    // Remove if out of bounds
    if (this.x < -10 || this.x > CANVAS_WIDTH + 10 || 
        this.y < -10 || this.y > CANVAS_HEIGHT + 10) {
      this.alive = false;
    }
  }
  
  deflect(direction) {
    this.vx = direction.x * 5;
    this.vy = direction.y * 5;
    this.owner = 'player';
  }
  
  render() {
    if (!this.alive) return;
    
    const p = this.p;
    
    // Trail
    p.push();
    p.noStroke();
    for (let i = 0; i < this.trail.length; i++) {
      const alpha = (i / this.trail.length) * 100;
      const color = this.owner === 'enemy' ? [255, 200, 0, alpha] : [100, 200, 255, alpha];
      p.fill(...color);
      p.ellipse(this.trail[i].x, this.trail[i].y, 4, 4);
    }
    p.pop();
    
    // Projectile
    p.push();
    const color = this.owner === 'enemy' ? p.color(255, 200, 0) : p.color(100, 200, 255);
    p.fill(color);
    p.noStroke();
    p.ellipse(this.x, this.y, this.width, this.height);
    
    // Glow
    p.fill(255, 255, 255, 100);
    p.ellipse(this.x, this.y, this.width * 0.6, this.height * 0.6);
    p.pop();
  }
}