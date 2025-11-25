// physics.js
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Events } = Matter;
import { gameState } from './globals.js';

export function setupCollisionHandling() {
  Events.on(gameState.engine, 'collisionStart', (event) => {
    const pairs = event.pairs;
    
    pairs.forEach(pair => {
      const { bodyA, bodyB } = pair;
      
      // Handle projectile collisions (handled in projectile update)
    });
  });
}