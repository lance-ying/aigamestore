import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Events } = Matter;
import { gameState } from './globals.js';

export function setupPhysics() {
  Events.on(gameState.engine, 'collisionStart', (event) => {
    const pairs = event.pairs;
    
    pairs.forEach(pair => {
      const bodyA = pair.bodyA;
      const bodyB = pair.bodyB;
      
      // Check for hard impacts
      const impactVelocity = Math.sqrt(
        Math.pow(pair.collision.penetration.x, 2) +
        Math.pow(pair.collision.penetration.y, 2)
      );
      
      // Damage from high-speed collisions
      if ((bodyA.label === 'chassis' || bodyB.label === 'chassis') && 
          impactVelocity > 10) {
        // Significant impact detected
        if (gameState.player) {
          gameState.player.health -= impactVelocity * 2;
        }
      }
    });
  });
}