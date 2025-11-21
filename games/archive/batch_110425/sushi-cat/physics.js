// physics.js - Physics and collision handling

import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Events } = Matter;
import { gameState } from './globals.js';

export function setupCollisionHandling(p) {
  Events.on(gameState.engine, 'collisionStart', (event) => {
    const pairs = event.pairs;
    
    pairs.forEach(pair => {
      const bodyA = pair.bodyA;
      const bodyB = pair.bodyB;
      
      // Check for player-sushi collision
      if ((bodyA.label === 'player' && bodyB.label === 'sushi') ||
          (bodyA.label === 'sushi' && bodyB.label === 'player')) {
        
        const sushiBody = bodyA.label === 'sushi' ? bodyA : bodyB;
        
        // Find the sushi entity and collect it
        const sushi = gameState.sushiPieces.find(s => s.body === sushiBody);
        if (sushi && !sushi.collected) {
          sushi.collect();
        }
      }
    });
  });
}