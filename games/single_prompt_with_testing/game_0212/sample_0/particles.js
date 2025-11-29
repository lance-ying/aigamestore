// particles.js - Particle system for visual effects

import { gameState, PARTICLE_LIFETIME } from './globals.js';
import { removeFromArray } from './utils.js';

export class Particle {
  constructor(x, y, vx, vy, color, size = 3) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.size = size;
    this.lifetime = PARTICLE_LIFETIME;
    this.age = 0;
    this.alpha = 1;
    
    gameState.particles.push(this);
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    
    // Apply friction
    this.vx *= 0.95;
    this.vy *= 0.95;
    
    this.age++;
    this.alpha = 1 - (this.age / this.lifetime);
    
    if (this.isDead()) {
      this.destroy();
    }
  }
  
  isDead() {
    return this.age >= this.lifetime;
  }
  
  destroy() {
    removeFromArray(gameState.particles, this);
  }
  
  render(p) {
    p.push();
    p.noStroke();
    p.fill(this.color[0], this.color[1], this.color[2], this.alpha * 255);
    p.circle(this.x, this.y, this.size);
    p.pop();
  }
}

export class ExplosionEffect {
  constructor(x, y, color, count = 15) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = 2 + Math.random() * 2;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const size = 2 + Math.random() * 3;
      
      new Particle(x, y, vx, vy, color, size);
    }
  }
}

export class TrailEffect {
  constructor(x, y, color, size = 2) {
    const vx = (Math.random() - 0.5) * 0.5;
    const vy = (Math.random() - 0.5) * 0.5;
    new Particle(x, y, vx, vy, color, size);
  }
}

export class StarField {
  constructor() {
    this.stars = [];
    for (let i = 0; i < 100; i++) {
      this.stars.push({
        x: Math.random() * 600,
        y: Math.random() * 400,
        size: Math.random() * 2 + 0.5,
        brightness: Math.random() * 0.5 + 0.5,
        twinkleSpeed: Math.random() * 0.02 + 0.01
      });
    }
  }
  
  update(frameCount) {
    this.stars.forEach(star => {
      star.brightness = 0.5 + Math.sin(frameCount * star.twinkleSpeed) * 0.3;
    });
  }
  
  render(p) {
    p.push();
    p.noStroke();
    this.stars.forEach(star => {
      p.fill(255, 255, 255, star.brightness * 255);
      p.circle(star.x, star.y, star.size);
    });
    p.pop();
  }
}