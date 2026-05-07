// physics.js - Physics and collision handling

import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Events } = Matter;

import { gameState } from './globals.js';

export function setupPhysics(engine) {
  // Collision detection
  Events.on(engine, 'collisionStart', (event) => {
    const pairs = event.pairs;
    
    pairs.forEach(pair => {
      const bodyA = pair.bodyA;
      const bodyB = pair.bodyB;
      
      // Sugar particle interactions are handled in game update loop
      // This is kept minimal for performance
    });
  });
  
  // Continuous collision checking would be too expensive
  // Instead, we check interactions in the game loop
}

export function checkParticleInteractions() {
  gameState.sugarParticles.forEach(particle => {
    if (particle.markedForRemoval) return;
    
    const px = particle.body.position.x;
    const py = particle.body.position.y;
    
    // Check cups
    gameState.cups.forEach(cup => {
      if (!particle.inCup && cup.containsPoint(px, py)) {
        const velocityMag = Math.sqrt(
          particle.body.velocity.x ** 2 + 
          particle.body.velocity.y ** 2
        );
        
        // Only count if moving slowly (settled)
        if (velocityMag < 2.0) {
          if (cup.addSugar(particle)) {
            particle.inCup = true;
            particle.markedForRemoval = true;
            gameState.sugarInCups++;
            gameState.score += 10;
          }
        }
      }
    });
    
    // Check color filters
    gameState.colorFilters.forEach(filter => {
      if (filter.containsPoint(px, py)) {
        particle.changeColor(filter.color);
      }
    });
    
    // Check gravity switches
    gameState.gravitySwitches.forEach(gswitch => {
      if (gswitch.containsPoint(px, py)) {
        gswitch.activate();
      }
    });
    
    // Check teleporters
    gameState.teleporters.forEach(teleporter => {
      if (teleporter.containsEntrance(px, py)) {
        teleporter.teleport(particle);
      }
    });
  });
}