// physics.js - Physics collision handling

import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Events } = Matter;

import { gameState } from './globals.js';

export function setupCollisionHandling(engine, p) {
  Events.on(engine, 'collisionStart', (event) => {
    const pairs = event.pairs;
    
    pairs.forEach(pair => {
      const { bodyA, bodyB } = pair;
      
      // Calculate collision velocity
      const relativeVelocity = {
        x: bodyA.velocity.x - bodyB.velocity.x,
        y: bodyA.velocity.y - bodyB.velocity.y
      };
      
      const speed = Math.sqrt(
        relativeVelocity.x ** 2 + relativeVelocity.y ** 2
      );
      
      // Log significant collisions
      if (speed > 5) {
        p.logs.game_info.push({
          data: {
            event: 'collision',
            bodyA: bodyA.label,
            bodyB: bodyB.label,
            speed: speed.toFixed(2)
          },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    });
  });
}