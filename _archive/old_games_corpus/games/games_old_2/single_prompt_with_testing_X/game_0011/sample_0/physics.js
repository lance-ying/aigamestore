// physics.js - Matter.js collision handling

import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Events } = Matter;

import { gameState } from './globals.js';

export function setupCollisionHandling(p) {
  Events.on(gameState.engine, 'collisionStart', (event) => {
    const pairs = event.pairs;
    
    pairs.forEach(pair => {
      const bodyA = pair.bodyA;
      const bodyB = pair.bodyB;
      
      // Calculate impact velocity
      const relativeVelocity = Math.sqrt(
        Math.pow(bodyA.velocity.x - bodyB.velocity.x, 2) +
        Math.pow(bodyA.velocity.y - bodyB.velocity.y, 2)
      );
      
      // Log significant collisions
      if (relativeVelocity > 2) {
        p.logs.game_info.push({
          data: { 
            event: 'collision',
            bodyA: bodyA.label,
            bodyB: bodyB.label,
            velocity: relativeVelocity.toFixed(2)
          },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    });
  });
}