// physics.js
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Events } = Matter;
import { gameState } from './globals.js';

export function setupCollisionHandling(engine) {
  Events.on(engine, 'collisionStart', (event) => {
    const pairs = event.pairs;
    
    pairs.forEach(pair => {
      const bodyA = pair.bodyA;
      const bodyB = pair.bodyB;
      
      // Check for ball-hazard collision
      if ((bodyA.label === 'ball' && bodyB.label === 'hazard') ||
          (bodyB.label === 'ball' && bodyA.label === 'hazard')) {
        if (gameState.ball) {
          gameState.ball.reset();
          gameState.strokes++;
        }
      }
    });
  });
}