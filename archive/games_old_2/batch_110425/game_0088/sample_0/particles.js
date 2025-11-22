// particles.js - Particle effects
import { gameState } from './globals.js';
import { Particle } from './entities.js';

export function createParticles(p, x, y, baseColor) {
  const particleCount = 8;
  
  for (let i = 0; i < particleCount; i++) {
    const angle = (i / particleCount) * p.TWO_PI;
    const speed = p.random(2, 5);
    const vx = p.cos(angle) * speed;
    const vy = p.sin(angle) * speed - 2;
    const life = Math.floor(p.random(20, 40));
    
    const particle = new Particle(x, y, vx, vy, baseColor, life);
    gameState.particles.push(particle);
  }
}

export function updateParticles(p) {
  for (let i = gameState.particles.length - 1; i >= 0; i--) {
    const particle = gameState.particles[i];
    particle.update(p);
    
    if (!particle.alive) {
      gameState.particles.splice(i, 1);
    }
  }
}

export function drawParticles(p) {
  for (const particle of gameState.particles) {
    particle.draw(p);
  }
}