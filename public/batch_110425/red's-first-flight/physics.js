// physics.js - Physics and collision handling

import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Events } = Matter;

import { gameState } from './globals.js';

export function setupPhysics() {
  Events.on(gameState.engine, 'collisionStart', handleCollisions);
  Events.on(gameState.engine, 'collisionActive', handleCollisions);
}

export function handleCollisions(event) {
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
      const pig = gameState.pigs.find(p => 
        p.body === bodyA || p.body === bodyB
      );
      if (pig && !pig.eliminated && relativeVelocity > 2) {
        const damage = relativeVelocity * 15;
        pig.takeDamage(damage);
      }
    }
    
    // Bird hitting block
    if ((bodyA.label === 'bird' && bodyB.label === 'block') ||
        (bodyA.label === 'block' && bodyB.label === 'bird')) {
      const block = gameState.blocks.find(b => 
        b.body === bodyA || b.body === bodyB
      );
      if (block && !block.destroyed && relativeVelocity > 3) {
        const damage = relativeVelocity * 8;
        block.takeDamage(damage);
      }
    }
    
    // Block hitting pig
    if ((bodyA.label === 'block' && bodyB.label === 'pig') ||
        (bodyA.label === 'pig' && bodyB.label === 'block')) {
      const pig = gameState.pigs.find(p => 
        p.body === bodyA || p.body === bodyB
      );
      if (pig && !pig.eliminated && relativeVelocity > 3) {
        const damage = relativeVelocity * 12;
        pig.takeDamage(damage);
      }
    }
    
    // Block hitting block (chain reactions)
    if (bodyA.label === 'block' && bodyB.label === 'block') {
      const blockA = gameState.blocks.find(b => b.body === bodyA);
      const blockB = gameState.blocks.find(b => b.body === bodyB);
      
      if (blockA && !blockA.destroyed && relativeVelocity > 5) {
        const damage = relativeVelocity * 5;
        blockA.takeDamage(damage);
      }
      if (blockB && !blockB.destroyed && relativeVelocity > 5) {
        const damage = relativeVelocity * 5;
        blockB.takeDamage(damage);
      }
    }
  });
}

export function removeDestroyedBodies() {
  // Remove destroyed pigs
  gameState.pigs = gameState.pigs.filter(pig => {
    if (pig.eliminated) {
      Matter.World.remove(gameState.world, pig.body);
      return false;
    }
    return true;
  });
  
  // Remove destroyed blocks
  gameState.blocks = gameState.blocks.filter(block => {
    if (block.destroyed) {
      Matter.World.remove(gameState.world, block.body);
      return false;
    }
    return true;
  });
  
  // Remove settled birds that are off screen
  gameState.birds = gameState.birds.filter(bird => {
    if (bird.settled && bird.body.position.y > 450) {
      Matter.World.remove(gameState.world, bird.body);
      return false;
    }
    return true;
  });
}