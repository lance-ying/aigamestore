// particles.js - Particle system and visual effects

import { gameState } from './globals.js';

// Basic particle class
export class Particle {
  constructor(x, y, vx, vy, color, lifetime) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.lifetime = lifetime;
    this.age = 0;
    this.size = Math.random() * 4 + 2;
    this.gravity = 0.2;
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity;
    this.age++;
  }
  
  isDead() {
    return this.age >= this.lifetime;
  }
  
  render(p) {
    const alpha = 1 - (this.age / this.lifetime);
    p.fill(this.color[0], this.color[1], this.color[2], alpha * 255);
    p.noStroke();
    p.circle(this.x, this.y, this.size);
  }
}

// Slash effect class
export class SlashEffect {
  constructor(x, y, angle, range) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.range = range;
    this.lifetime = 8;
    this.age = 0;
    
    gameState.slashEffects.push(this);
  }
  
  update() {
    this.age++;
  }
  
  isDead() {
    return this.age >= this.lifetime;
  }
  
  render(p) {
    const alpha = 1 - (this.age / this.lifetime);
    const currentRange = this.range * (this.age / this.lifetime);
    
    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.angle);
    
    // Draw arc slash
    p.noFill();
    p.stroke(255, 255, 255, alpha * 255);
    p.strokeWeight(3);
    
    const arcAngle = Math.PI / 3;
    p.arc(0, 0, currentRange * 2, currentRange * 2, -arcAngle / 2, arcAngle / 2);
    
    // Add sparkle effect
    for (let i = 0; i < 3; i++) {
      const sparkAngle = -arcAngle / 2 + (arcAngle * i / 2);
      const sx = Math.cos(sparkAngle) * currentRange;
      const sy = Math.sin(sparkAngle) * currentRange;
      
      p.fill(255, 255, 200, alpha * 200);
      p.noStroke();
      p.circle(sx, sy, 3);
    }
    
    p.pop();
  }
}

// Helper functions to create particle effects
export function createParticleBurst(x, y, count, color) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const speed = Math.random() * 4 + 2;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    
    gameState.particles.push(
      new Particle(x, y, vx, vy, color, 30)
    );
  }
}

export function createBloodSplatter(x, y, count) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 5 + 1;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    
    const redShade = Math.floor(Math.random() * 100 + 155);
    gameState.particles.push(
      new Particle(x, y, vx, vy, [redShade, 0, 0], 40)
    );
  }
}

export function updateParticles() {
  // Update regular particles
  for (let i = gameState.particles.length - 1; i >= 0; i--) {
    gameState.particles[i].update();
    if (gameState.particles[i].isDead()) {
      gameState.particles.splice(i, 1);
    }
  }
  
  // Update slash effects
  for (let i = gameState.slashEffects.length - 1; i >= 0; i--) {
    gameState.slashEffects[i].update();
    if (gameState.slashEffects[i].isDead()) {
      gameState.slashEffects.splice(i, 1);
    }
  }
}

export function renderParticles(p) {
  gameState.particles.forEach(particle => particle.render(p));
  gameState.slashEffects.forEach(effect => effect.render(p));
}