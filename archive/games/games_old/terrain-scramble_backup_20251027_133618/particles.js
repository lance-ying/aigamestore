// particles.js - Particle effects

import { gameState } from './globals.js';

export class ParticleEffect {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.particles = [];
    this.lifetime = 0;
    this.maxLifetime = type === 'exhaust' ? 20 : 30;
    
    this.createParticles();
  }
  
  createParticles() {
    const count = this.type === 'exhaust' ? 3 : 8;
    
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = this.type === 'exhaust' ? 1 + Math.random() : 2 + Math.random() * 2;
      
      this.particles.push({
        x: this.x,
        y: this.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: this.type === 'exhaust' ? 3 + Math.random() * 2 : 5 + Math.random() * 5,
        alpha: 255
      });
    }
  }
  
  update() {
    this.lifetime++;
    
    for (let particle of this.particles) {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.1; // Gravity
      particle.alpha = 255 * (1 - this.lifetime / this.maxLifetime);
    }
    
    return this.lifetime >= this.maxLifetime;
  }
  
  render(p, cameraX) {
    for (let particle of this.particles) {
      const screenX = particle.x - cameraX;
      
      if (this.type === 'exhaust') {
        p.fill(150, 150, 150, particle.alpha);
      } else if (this.type === 'collection') {
        p.fill(100, 255, 100, particle.alpha);
      } else if (this.type === 'explosion') {
        p.fill(255, 100, 50, particle.alpha);
      }
      
      p.noStroke();
      p.circle(screenX, particle.y, particle.size);
    }
  }
}

export function addParticleEffect(x, y, type) {
  gameState.particleEffects.push(new ParticleEffect(x, y, type));
}

export function updateParticles() {
  gameState.particleEffects = gameState.particleEffects.filter(effect => !effect.update());
}