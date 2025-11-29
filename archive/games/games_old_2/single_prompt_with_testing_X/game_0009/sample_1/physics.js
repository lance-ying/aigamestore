// physics.js - Physics and collision handling

import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Events } = Matter;

import { gameState } from './globals.js';

export function setupPhysicsEvents() {
  // Collision detection
  Events.on(gameState.engine, 'collisionStart', (event) => {
    const pairs = event.pairs;
    
    pairs.forEach(pair => {
      const bodyA = pair.bodyA;
      const bodyB = pair.bodyB;
      
      // Check for ball-glass collisions
      if ((bodyA.label === 'ball' && bodyB.label === 'glass') ||
          (bodyA.label === 'glass' && bodyB.label === 'ball')) {
        // Physics handles the collision naturally
      }
      
      // Check for glass-glass collisions
      if (bodyA.label === 'glass' && bodyB.label === 'glass') {
        // Physics handles the collision naturally
      }
    });
  });
}

export function updatePhysics() {
  // Matter.js engine is updated in the main game loop
  // This function can be used for additional physics-related updates
}