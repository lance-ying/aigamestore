// physics.js - Collision detection and physics

import { gameState } from './globals.js';

export function checkCollisions(p) {
  const allBirds = [...gameState.birds];
  if (gameState.currentBird && gameState.currentBird.launched) {
    allBirds.push(gameState.currentBird);
  }
  
  allBirds.forEach(bird => {
    if (!bird.active || !bird.launched) return;
    
    // Check collisions with pigs
    gameState.pigs.forEach(pig => {
      if (!pig.alive) return;
      
      const dist = p.dist(bird.x, bird.y, pig.x, pig.y);
      if (dist < bird.radius + pig.radius) {
        const damage = Math.floor(Math.sqrt(bird.vx * bird.vx + bird.vy * bird.vy) / 3);
        pig.takeDamage(Math.max(1, damage));
        
        // Bounce bird
        const angle = p.atan2(bird.y - pig.y, bird.x - pig.x);
        bird.vx = p.cos(angle) * Math.abs(bird.vx) * 0.5;
        bird.vy = p.sin(angle) * Math.abs(bird.vy) * 0.5;
      }
    });
    
    // Check collisions with structures
    gameState.structures.forEach(structure => {
      if (structure.destroyed) return;
      
      if (p.collideCircleRect(
        bird.x, bird.y, bird.radius * 2,
        structure.x - structure.width / 2,
        structure.y - structure.height / 2,
        structure.width,
        structure.height
      )) {
        const damage = Math.floor(Math.sqrt(bird.vx * bird.vx + bird.vy * bird.vy) / 4);
        structure.takeDamage(Math.max(1, damage));
        
        // Bounce bird
        bird.vx *= -0.4;
        bird.vy *= -0.4;
      }
    });
    
    // Ground collision
    if (bird.y + bird.radius > 380) {
      bird.y = 380 - bird.radius;
      bird.vy *= -0.3;
      bird.vx *= 0.8;
      
      if (Math.abs(bird.vy) < 1) {
        bird.vy = 0;
      }
    }
  });
  
  // Structure-structure collisions and stability
  gameState.structures.forEach(structure => {
    if (structure.destroyed) return;
    
    // Ground collision
    if (structure.y + structure.height / 2 > 380) {
      structure.y = 380 - structure.height / 2;
    }
  });
}

export function updatePhysics() {
  // Update all birds
  const allBirds = [...gameState.birds];
  if (gameState.currentBird && gameState.currentBird.launched) {
    allBirds.push(gameState.currentBird);
  }
  
  allBirds.forEach(bird => {
    if (bird.active) {
      bird.update();
    }
  });
  
  // Update pigs
  gameState.pigs.forEach(pig => pig.update());
  
  // Update particles
  gameState.particles = gameState.particles.filter(particle => {
    particle.update();
    return particle.isAlive();
  });
  
  // Clean up inactive birds
  gameState.birds = gameState.birds.filter(bird => bird.active);
}