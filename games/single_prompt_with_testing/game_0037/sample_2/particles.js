// particles.js - Particle system for visual effects

import { gameState } from './globals.js';

// Particle class
export class Particle {
  constructor(x, y, vx, vy, color, lifetime = 30) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.lifetime = lifetime;
    this.age = 0;
    this.size = Math.random() * 4 + 2;
    this.gravity = 0.2;
    
    gameState.particles.push(this);
  }
  
  update() {
    this.age++;
    
    if (this.age >= this.lifetime) {
      this.remove();
      return;
    }
    
    this.vx *= 0.98;
    this.vy += this.gravity;
    
    this.x += this.vx;
    this.y += this.vy;
  }
  
  remove() {
    const index = gameState.particles.indexOf(this);
    if (index > -1) {
      gameState.particles.splice(index, 1);
    }
  }
  
  render(p) {
    const screenX = this.x - gameState.cameraX;
    const screenY = this.y - gameState.cameraY;
    
    const alpha = 255 * (1 - this.age / this.lifetime);
    
    p.push();
    p.fill(this.color[0], this.color[1], this.color[2], alpha);
    p.noStroke();
    p.ellipse(screenX, screenY, this.size, this.size);
    p.pop();
  }
}

// Spark particle for ring collection
export class SparkParticle extends Particle {
  constructor(x, y) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 3 + 1;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    
    super(x, y, vx, vy, [255, 255, 0], 20);
    this.gravity = 0;
  }
  
  render(p) {
    const screenX = this.x - gameState.cameraX;
    const screenY = this.y - gameState.cameraY;
    
    const alpha = 255 * (1 - this.age / this.lifetime);
    const size = this.size * (1 - this.age / this.lifetime);
    
    p.push();
    p.fill(255, 255, 0, alpha);
    p.noStroke();
    p.star(screenX, screenY, size, size * 0.5, 4);
    p.pop();
  }
}

// Smoke particle for spin dash
export class SmokeParticle extends Particle {
  constructor(x, y) {
    const vx = (Math.random() - 0.5) * 2;
    const vy = (Math.random() - 0.5) * 2 - 1;
    
    super(x, y, vx, vy, [150, 150, 150], 30);
    this.gravity = -0.1;
    this.size = Math.random() * 8 + 4;
  }
  
  update() {
    super.update();
    this.size += 0.2; // Expand over time
  }
  
  render(p) {
    const screenX = this.x - gameState.cameraX;
    const screenY = this.y - gameState.cameraY;
    
    const alpha = 150 * (1 - this.age / this.lifetime);
    
    p.push();
    p.fill(150, 150, 150, alpha);
    p.noStroke();
    p.ellipse(screenX, screenY, this.size, this.size);
    p.pop();
  }
}

// Helper functions to create particle effects
export function createParticleBurst(x, y, count, color) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count;
    const speed = Math.random() * 4 + 2;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    new Particle(x, y, vx, vy, color, 40);
  }
}

export function createRingSparkle(x, y) {
  for (let i = 0; i < 8; i++) {
    new SparkParticle(x, y);
  }
}

export function createSpinDashSmoke(x, y) {
  new SmokeParticle(x, y);
}

// Star drawing helper for p5
if (typeof window !== 'undefined' && window.p5) {
  window.p5.prototype.star = function(x, y, radius1, radius2, npoints) {
    let angle = Math.PI * 2 / npoints;
    let halfAngle = angle / 2;
    
    this.beginShape();
    for (let a = -Math.PI / 2; a < Math.PI * 2 - Math.PI / 2; a += angle) {
      let sx = x + Math.cos(a) * radius1;
      let sy = y + Math.sin(a) * radius1;
      this.vertex(sx, sy);
      sx = x + Math.cos(a + halfAngle) * radius2;
      sy = y + Math.sin(a + halfAngle) * radius2;
      this.vertex(sx, sy);
    }
    this.endShape(this.CLOSE);
  };
}