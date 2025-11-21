// physics.js - Matter.js collision handling

import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Events } = Matter;
import { gameState } from './globals.js';

export function setupPhysics(engine) {
  // Handle collision detection for color filters
  Events.on(engine, 'collisionStart', (event) => {
    const pairs = event.pairs;
    
    pairs.forEach(pair => {
      let sugarBody = null;
      let filterBody = null;
      
      // Check if collision involves sugar and color filter
      if (pair.bodyA.label === 'sugar' && pair.bodyB.label === 'color_filter') {
        sugarBody = pair.bodyA;
        filterBody = pair.bodyB;
      } else if (pair.bodyB.label === 'sugar' && pair.bodyA.label === 'color_filter') {
        sugarBody = pair.bodyB;
        filterBody = pair.bodyA;
      }
      
      if (sugarBody && filterBody && filterBody.filterReference) {
        // Find the particle and change its color
        const particle = gameState.sugarParticles.find(p => p.body === sugarBody);
        if (particle) {
          particle.setColor(filterBody.filterReference.color);
        }
      }
    });
  });
}