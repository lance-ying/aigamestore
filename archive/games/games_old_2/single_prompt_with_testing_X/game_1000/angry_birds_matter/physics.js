// physics.js - Physics and collision handling

import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Events } = Matter;

import { gameState } from './globals.js';

export function setupCollisionHandling(engine) {
  Events.on(engine, 'collisionStart', (event) => {
    const pairs = event.pairs;
    
    pairs.forEach(pair => {
      const bodyA = pair.bodyA;
      const bodyB = pair.bodyB;
      
      // Calculate collision force
      const velocity = Math.sqrt(
        Math.pow(bodyA.velocity.x - bodyB.velocity.x, 2) +
        Math.pow(bodyA.velocity.y - bodyB.velocity.y, 2)
      );
      
      const damage = velocity * 5;
      
      // Bird hitting pig
      if ((bodyA.label === 'bird' && bodyB.label === 'pig') ||
          (bodyA.label === 'pig' && bodyB.label === 'bird')) {
        const pig = gameState.pigs.find(p => p.body === bodyA || p.body === bodyB);
        if (pig && pig.alive && damage > 2) {
          pig.takeDamage(damage);
          if (!pig.alive) {
            gameState.pigsRemaining--;
            gameState.score += 100;
          }
        }
      }
      
      // Bird hitting structure
      if ((bodyA.label === 'bird' && bodyB.label === 'structure') ||
          (bodyA.label === 'structure' && bodyB.label === 'bird')) {
        const structure = gameState.structures.find(s => s.body === bodyA || s.body === bodyB);
        if (structure && !structure.destroyed && damage > 2) {
          structure.takeDamage(damage);
          if (structure.destroyed) {
            gameState.score += 10;
          }
        }
      }
      
      // Structure hitting pig
      if ((bodyA.label === 'structure' && bodyB.label === 'pig') ||
          (bodyA.label === 'pig' && bodyB.label === 'structure')) {
        const pig = gameState.pigs.find(p => p.body === bodyA || p.body === bodyB);
        if (pig && pig.alive && damage > 3) {
          pig.takeDamage(damage);
          if (!pig.alive) {
            gameState.pigsRemaining--;
            gameState.score += 100;
          }
        }
      }
      
      // Structure hitting structure
      if (bodyA.label === 'structure' && bodyB.label === 'structure') {
        const structureA = gameState.structures.find(s => s.body === bodyA);
        const structureB = gameState.structures.find(s => s.body === bodyB);
        
        if (structureA && !structureA.destroyed && damage > 5) {
          structureA.takeDamage(damage / 2);
          if (structureA.destroyed) {
            gameState.score += 10;
          }
        }
        
        if (structureB && !structureB.destroyed && damage > 5) {
          structureB.takeDamage(damage / 2);
          if (structureB.destroyed) {
            gameState.score += 10;
          }
        }
      }
    });
  });
}

export function cleanupDestroyedBodies(world) {
  // Remove destroyed structures
  const destroyedStructures = gameState.structures.filter(s => s.destroyed);
  destroyedStructures.forEach(structure => {
    Matter.World.remove(world, structure.body);
  });
  gameState.structures = gameState.structures.filter(s => !s.destroyed);
  
  // Remove dead pigs
  const deadPigs = gameState.pigs.filter(p => !p.alive);
  deadPigs.forEach(pig => {
    Matter.World.remove(world, pig.body);
  });
  gameState.pigs = gameState.pigs.filter(p => p.alive);
}