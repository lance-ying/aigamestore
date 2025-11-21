// physics.js - Physics and collision handling

import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Events } = Matter;

import { gameState } from './globals.js';

export function setupCollisionHandling(engine, p) {
  Events.on(engine, 'collisionStart', (event) => {
    const pairs = event.pairs;
    
    pairs.forEach(pair => {
      const bodyA = pair.bodyA;
      const bodyB = pair.bodyB;
      
      // Calculate collision velocity
      const relativeVelocity = Math.sqrt(
        Math.pow(bodyA.velocity.x - bodyB.velocity.x, 2) +
        Math.pow(bodyA.velocity.y - bodyB.velocity.y, 2)
      );
      
      // Bird hitting pig
      if ((bodyA.label === 'bird' && bodyB.label === 'pig') ||
          (bodyA.label === 'pig' && bodyB.label === 'bird')) {
        const pig = gameState.pigs.find(p => p.body === bodyA || p.body === bodyB);
        if (pig && relativeVelocity > 1.5) {
          const damage = relativeVelocity * 15;
          pig.takeDamage(damage);
        }
      }
      
      // Bird split hitting pig
      if ((bodyA.label === 'bird_split' && bodyB.label === 'pig') ||
          (bodyA.label === 'pig' && bodyB.label === 'bird_split')) {
        const pig = gameState.pigs.find(p => p.body === bodyA || p.body === bodyB);
        if (pig && relativeVelocity > 1) {
          const damage = relativeVelocity * 12;
          pig.takeDamage(damage);
        }
      }
      
      // Bird hitting structure
      if ((bodyA.label === 'bird' && bodyB.label === 'structure') ||
          (bodyA.label === 'structure' && bodyB.label === 'bird')) {
        const structure = gameState.structures.find(s => s.body === bodyA || s.body === bodyB);
        if (structure && relativeVelocity > 3) {
          const damage = relativeVelocity * 5;
          structure.takeDamage(damage);
        }
      }
      
      // Structure hitting pig - increased damage for easier chain reactions
      if ((bodyA.label === 'structure' && bodyB.label === 'pig') ||
          (bodyA.label === 'pig' && bodyB.label === 'structure')) {
        const pig = gameState.pigs.find(p => p.body === bodyA || p.body === bodyB);
        if (pig && relativeVelocity > 1.0) {
          const damage = relativeVelocity * 15;
          pig.takeDamage(damage);
        }
      }
      
      // Structure hitting structure
      if (bodyA.label === 'structure' && bodyB.label === 'structure') {
        if (relativeVelocity > 5) {
          const structA = gameState.structures.find(s => s.body === bodyA);
          const structB = gameState.structures.find(s => s.body === bodyB);
          const damage = (relativeVelocity - 5) * 3;
          if (structA) structA.takeDamage(damage);
          if (structB) structB.takeDamage(damage);
        }
      }
    });
  });
}