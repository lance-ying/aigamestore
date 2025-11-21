// physics.js - Matter.js collision handling

import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Events } = Matter;

import { gameState } from './globals.js';

export function setupCollisionHandling() {
  Events.on(gameState.engine, 'collisionStart', (event) => {
    const pairs = event.pairs;
    
    pairs.forEach(pair => {
      const { bodyA, bodyB } = pair;
      
      // Check player collision with hazard
      if ((bodyA.label.includes('player') && bodyB.label === 'hazard') ||
          (bodyB.label.includes('player') && bodyA.label === 'hazard')) {
        if (gameState.player) {
          gameState.player.respawn();
        }
      }
    });
  });
}

export function cleanupCollisionHandling() {
  Events.off(gameState.engine, 'collisionStart');
}