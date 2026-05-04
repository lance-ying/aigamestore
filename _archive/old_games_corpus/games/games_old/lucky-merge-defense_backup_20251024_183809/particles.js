// particles.js - Particle effects
import { gameState } from './globals.js';

export function updateParticles() {
  for (let i = gameState.particles.length - 1; i >= 0; i--) {
    const p = gameState.particles[i];
    
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.1; // Gravity
    p.life--;
    
    if (p.life <= 0) {
      gameState.particles.splice(i, 1);
    }
  }
}

export function drawParticles(p) {
  for (const particle of gameState.particles) {
    p.push();
    p.noStroke();
    p.fill(...particle.color, particle.life * 8);
    p.circle(particle.x, particle.y, 4);
    p.pop();
  }
}