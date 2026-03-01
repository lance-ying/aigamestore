import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Engine, World, Events, Body, Vector } = Matter;
import { gameState, CATEGORIES } from './globals.js';
import { Target } from './entities.js';

export function createPhysicsEngine() {
  const engine = Engine.create();
  engine.gravity.y = 1.0; // Standard gravity
  engine.gravity.scale = 0.001;
  
  // Optimize constraint iterations for stable stacks
  engine.constraintIterations = 4;
  engine.positionIterations = 8;
  engine.velocityIterations = 8;

  return engine;
}

export function setupCollisionEvents(engine) {
  Events.on(engine, 'collisionStart', (event) => {
    const pairs = event.pairs;
    
    for (let i = 0; i < pairs.length; i++) {
      const pair = pairs[i];
      const bodyA = pair.bodyA;
      const bodyB = pair.bodyB;

      // Check collision between LETTER and TARGET
      if (checkCollisionType(bodyA, bodyB, 'letter', 'target')) {
        const targetBody = bodyA.label === 'target' ? bodyA : bodyB;
        handleTargetHit(targetBody);
      }
    }
  });
}

function checkCollisionType(bodyA, bodyB, labelA, labelB) {
  return (bodyA.label === labelA && bodyB.label === labelB) ||
         (bodyA.label === labelB && bodyB.label === labelA);
}

function handleTargetHit(targetBody) {
  // Find the target entity associated with this body
  const targetEntity = gameState.targets.find(t => t.body === targetBody);
  
  if (targetEntity && !targetEntity.collected) {
    targetEntity.collect();
  }
}

// Cleanup function to remove bodies safely
export function clearWorld(world) {
  World.clear(world, false); // Keep the world, clear bodies
  // Note: We need to be careful not to clear the engine itself if p5 is managing the loop
}