import { gameState } from './globals.js';

export function updateParticles() {
  for (let i = gameState.particles.length - 1; i >= 0; i--) {
    const particle = gameState.particles[i];
    
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.vy += 0.3; // Gravity
    particle.life--;
    
    if (particle.life <= 0) {
      gameState.particles.splice(i, 1);
    }
  }
}

export function drawParticles(p) {
  p.push();
  p.noStroke();
  
  for (const particle of gameState.particles) {
    const alpha = 255 * (particle.life / particle.maxLife);
    p.fill(...particle.color, alpha);
    const size = 6 * (particle.life / particle.maxLife);
    const screenX = particle.x - gameState.cameraX;
    p.ellipse(screenX, particle.y, size, size);
  }
  
  p.pop();
}