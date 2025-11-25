// physics.js - Matter.js collision handling

import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Events } = Matter;

import { gameState } from './globals.js';

export function setupCollisionHandling(engine) {
  Events.on(engine, 'collisionStart', (event) => {
    const pairs = event.pairs;
    
    pairs.forEach(pair => {
      const bodyA = pair.bodyA;
      const bodyB = pair.bodyB;
      
      // Player collision with enemy
      if ((bodyA.label === 'player' && bodyB.label === 'enemy') ||
          (bodyA.label === 'enemy' && bodyB.label === 'player')) {
        
        if (gameState.player && !gameState.invincible) {
          gameState.player.takeDamage();
        }
      }
    });
  });
}