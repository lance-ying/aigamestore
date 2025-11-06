// particle.js - Particle effects

import { gameState } from './globals.js';

class Particle {
  constructor(x, y, vx, vy, color) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.life = 30;
    this.maxLife = 30;
    this.size = 4;
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.2; // gravity
    this.life--;
  }
  
  draw(p) {
    const alpha = (this.life / this.maxLife) * 255;
    p.fill(...this.color, alpha);
    p.noStroke();
    p.circle(this.x, this.y, this.size);
  }
  
  isDead() {
    return this.life <= 0;
  }
}

export function createParticles(p, x, y, color) {
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * 2 * i) / 8;
    const speed = 2 + Math.random() * 2;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed - 1;
    
    const particle = new Particle(x, y, vx, vy, color);
    gameState.particles.push(particle);
  }
}

export function updateParticles() {
  for (let i = gameState.particles.length - 1; i >= 0; i--) {
    gameState.particles[i].update();
    if (gameState.particles[i].isDead()) {
      gameState.particles.splice(i, 1);
    }
  }
}

export function drawParticles(p) {
  for (let particle of gameState.particles) {
    particle.draw(p);
  }
}