// particles.js - Particle system updates

import { gameState } from './globals.js';

export function updateParticles(p) {
  // Update all particles
  for (let i = gameState.particles.length - 1; i >= 0; i--) {
    const particle = gameState.particles[i];
    particle.update();
    
    if (particle.isDead()) {
      gameState.particles.splice(i, 1);
    }
  }
}

export function renderParticles(p) {
  gameState.particles.forEach(particle => particle.render(p));
}