// particles.js - Particle system

export function updateParticles(gameState) {
  for (let i = gameState.particles.length - 1; i >= 0; i--) {
    const p = gameState.particles[i];
    
    // Update physics
    p.vy = (p.vy || 0) + 0.3;
    p.x += p.vx;
    p.y += p.vy;
    p.life -= p.decay;
    
    // Remove dead particles
    if (p.life <= 0) {
      gameState.particles.splice(i, 1);
    }
  }
}

export function drawParticles(p5Instance, gameState) {
  const p = p5Instance;
  
  for (let particle of gameState.particles) {
    p.push();
    p.noStroke();
    const alpha = particle.life * 255;
    p.fill(...particle.color, alpha);
    p.circle(particle.x, particle.y, particle.size * particle.life);
    p.pop();
  }
}