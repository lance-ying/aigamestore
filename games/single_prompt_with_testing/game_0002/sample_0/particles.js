// particles.js - Particle effects system

export function updateParticles(gameState) {
  for (let i = gameState.particles.length - 1; i >= 0; i--) {
    const particle = gameState.particles[i];
    
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.vx *= 0.95;
    particle.vy *= 0.95;
    particle.life--;
    
    if (particle.life <= 0) {
      gameState.particles.splice(i, 1);
    }
  }
}

export function renderParticles(p, particles) {
  for (const particle of particles) {
    const alpha = (particle.life / particle.maxLife) * 255;
    p.fill(...particle.color, alpha);
    p.noStroke();
    const size = (particle.life / particle.maxLife) * 6 + 2;
    p.ellipse(particle.x, particle.y, size, size);
  }
}