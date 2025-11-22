// physics.js - Physics and collision handling
import { gameState } from './globals.js';
import { Particle } from './entities.js';

export function checkCollisions(p) {
  const birds = gameState.birds.filter(b => b.active && b.launched);
  const pigs = gameState.pigs.filter(pig => pig.active);
  const structures = gameState.structures.filter(s => s.active);
  
  // Bird-Pig collisions
  birds.forEach(bird => {
    pigs.forEach(pig => {
      if (p.collideCircleCircle(bird.x, bird.y, bird.radius * 2, pig.x, pig.y, pig.radius * 2)) {
        const damage = p.sqrt(bird.vx * bird.vx + bird.vy * bird.vy) * 15;
        pig.takeDamage(damage);
        pig.vx = bird.vx * 0.3;
        pig.vy = bird.vy * 0.3;
        
        bird.vx *= -0.3;
        bird.vy *= -0.3;
        
        createImpactParticles(p, bird.x, bird.y, [120, 200, 80]);
        gameState.score += Math.floor(damage);
      }
    });
    
    // Bird-Structure collisions
    structures.forEach(structure => {
      if (p.collideCircleCircle(bird.x, bird.y, bird.radius * 2, structure.x, structure.y, 
          p.max(structure.w, structure.h))) {
        const damage = p.sqrt(bird.vx * bird.vx + bird.vy * bird.vy) * 10;
        structure.takeDamage(damage);
        structure.vx = bird.vx * 0.2;
        structure.vy = bird.vy * 0.2;
        structure.angularVelocity = (bird.vx - structure.vx) * 0.01;
        
        bird.vx *= -0.2;
        bird.vy *= -0.2;
        
        const color = structure.type === 'wood' ? [160, 100, 50] : 
                     structure.type === 'stone' ? [150, 150, 150] : [150, 200, 255];
        createImpactParticles(p, bird.x, bird.y, color);
      }
    });
  });
  
  // Structure-Pig collisions
  structures.forEach(structure => {
    pigs.forEach(pig => {
      if (p.collideCircleCircle(structure.x, structure.y, p.max(structure.w, structure.h),
          pig.x, pig.y, pig.radius * 2)) {
        const relVel = p.sqrt(
          (structure.vx - pig.vx) ** 2 + 
          (structure.vy - pig.vy) ** 2
        );
        if (relVel > 2) {
          pig.takeDamage(relVel * 5);
          pig.vx += structure.vx * 0.3;
          pig.vy += structure.vy * 0.3;
        }
      }
    });
  });
  
  // Black bird explosion damage
  birds.forEach(bird => {
    if (bird.type === 'BLACK' && bird.abilityUsed && !bird.active) {
      const explosionRadius = 80;
      
      pigs.forEach(pig => {
        const dist = p.dist(bird.x, bird.y, pig.x, pig.y);
        if (dist < explosionRadius) {
          const damage = (1 - dist / explosionRadius) * 80;
          pig.takeDamage(damage);
          const angle = p.atan2(pig.y - bird.y, pig.x - bird.x);
          pig.vx += p.cos(angle) * 8;
          pig.vy += p.sin(angle) * 8;
        }
      });
      
      structures.forEach(structure => {
        const dist = p.dist(bird.x, bird.y, structure.x, structure.y);
        if (dist < explosionRadius) {
          const damage = (1 - dist / explosionRadius) * 60;
          structure.takeDamage(damage);
          const angle = p.atan2(structure.y - bird.y, structure.x - bird.x);
          structure.vx += p.cos(angle) * 6;
          structure.vy += p.sin(angle) * 6;
          structure.angularVelocity += (p.random() - 0.5) * 0.2;
        }
      });
    }
  });
}

function createImpactParticles(p, x, y, color) {
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * p.TWO_PI;
    const speed = p.random(2, 4);
    const particle = new Particle(
      p,
      x,
      y,
      p.cos(angle) * speed,
      p.sin(angle) * speed,
      color
    );
    gameState.particles.push(particle);
  }
}