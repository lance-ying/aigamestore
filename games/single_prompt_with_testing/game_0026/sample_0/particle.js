// particle.js - Particle effects

export function updateParticles(gameState) {
  for (let i = gameState.particles.length - 1; i >= 0; i--) {
    const particle = gameState.particles[i];
    
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.life--;
    
    // Apply gravity if exists
    if (particle.vy !== undefined) {
      particle.vy += 0.2;
    }
    
    if (particle.life <= 0) {
      gameState.particles.splice(i, 1);
    }
  }
}

export function renderParticles(p, particles) {
  p.push();
  p.noStroke();
  
  for (const particle of particles) {
    const alpha = (particle.life / particle.maxLife) * 255;
    p.fill(...particle.color, alpha);
    p.ellipse(particle.x, particle.y, particle.size, particle.size);
  }
  
  p.pop();
}