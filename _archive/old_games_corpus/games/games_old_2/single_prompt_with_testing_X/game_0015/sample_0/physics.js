// physics.js - Physics and collision handling

import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Events } = Matter;
import { gameState } from './globals.js';

export function setupPhysics() {
  // Setup collision events
  Events.on(gameState.engine, 'collisionStart', (event) => {
    const pairs = event.pairs;
    
    pairs.forEach(pair => {
      // Handle collisions if needed
      const bodyA = pair.bodyA;
      const bodyB = pair.bodyB;
      
      // Could add impact effects here
    });
  });
}

export function checkStability() {
  // Check if all non-removed shapes are stable (low velocity)
  const threshold = 0.1;
  
  for (let entity of gameState.entities) {
    if (entity.removed) continue;
    
    const vel = entity.body.velocity;
    const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y);
    const angVel = Math.abs(entity.body.angularVelocity);
    
    if (speed > threshold || angVel > threshold) {
      return false;
    }
  }
  
  return true;
}

export function checkWinCondition() {
  let redCount = 0;
  let greenOnPlatform = true;
  
  for (let entity of gameState.entities) {
    if (entity.removed) continue;
    
    if (entity.type === 'red') {
      redCount++;
    }
    
    if (entity.type === 'green') {
      if (!entity.isOnPlatform() || entity.isOffScreen()) {
        greenOnPlatform = false;
      }
    }
  }
  
  return {
    allRedGone: redCount === 0,
    allGreenOnPlatform: greenOnPlatform
  };
}