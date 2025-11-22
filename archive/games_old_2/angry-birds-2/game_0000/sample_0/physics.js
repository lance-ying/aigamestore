// physics.js - Physics and collision handling

import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Events } = Matter;
import { gameState } from './globals.js';

export function setupCollisionHandling() {
  Events.on(gameState.engine, 'collisionStart', (event) => {
    const pairs = event.pairs;
    
    pairs.forEach(pair => {
      const bodyA = pair.bodyA;
      const bodyB = pair.bodyB;
      
      // Calculate collision impact
      const relativeVelocity = Math.sqrt(
        Math.pow(bodyA.velocity.x - bodyB.velocity.x, 2) +
        Math.pow(bodyA.velocity.y - bodyB.velocity.y, 2)
      );
      
      // Bird hitting pig
      if ((bodyA.label === 'bird' && bodyB.label === 'pig') ||
          (bodyA.label === 'pig' && bodyB.label === 'bird')) {
        const pig = gameState.pigs.find(p => p.body === bodyA || p.body === bodyB);
        if (pig && relativeVelocity > 2) {
          pig.takeDamage(relativeVelocity * 15);
        }
      }
      
      // Bird hitting block
      if ((bodyA.label === 'bird' && bodyB.label === 'block') ||
          (bodyA.label === 'block' && bodyB.label === 'bird')) {
        const block = gameState.structures.find(b => b.body === bodyA || b.body === bodyB);
        if (block && relativeVelocity > 2) {
          block.takeDamage(relativeVelocity * 10);
        }
      }
      
      // Block hitting pig
      if ((bodyA.label === 'block' && bodyB.label === 'pig') ||
          (bodyA.label === 'pig' && bodyB.label === 'block')) {
        const pig = gameState.pigs.find(p => p.body === bodyA || p.body === bodyB);
        if (pig && relativeVelocity > 3) {
          pig.takeDamage(relativeVelocity * 12);
        }
      }
      
      // Block hitting block
      if (bodyA.label === 'block' && bodyB.label === 'block') {
        const blockA = gameState.structures.find(b => b.body === bodyA);
        const blockB = gameState.structures.find(b => b.body === bodyB);
        if (blockA && relativeVelocity > 5) {
          blockA.takeDamage(relativeVelocity * 5);
        }
        if (blockB && relativeVelocity > 5) {
          blockB.takeDamage(relativeVelocity * 5);
        }
      }
    });
  });
}