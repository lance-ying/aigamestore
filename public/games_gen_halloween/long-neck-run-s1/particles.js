// particles.js
export function updateParticles(p, particles, scrollSpeed) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const particle = particles[i];
    particle.x += particle.vx;
    particle.y += particle.vy + scrollSpeed;
    particle.vy += 0.2; // gravity
    particle.life--;
    
    if (particle.life <= 0) {
      particles.splice(i, 1);
    }
  }
}

export function renderParticles(p, particles) {
  for (const particle of particles) {
    const alpha = (particle.life / particle.maxLife) * 255;
    p.push();
    p.noStroke();
    p.fill(...particle.color, alpha);
    const size = particle.isCorrect ? 6 : 4;
    p.ellipse(particle.x, particle.y, size, size);
    p.pop();
  }
}