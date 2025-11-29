// physics.js - Physics and collision handling

import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Events } = Matter;

import { gameState } from './globals.js';

export function setupPhysics() {
  // Setup collision detection
  Events.on(gameState.engine, 'collisionStart', handleCollisionStart);
}

function handleCollisionStart(event) {
  const pairs = event.pairs;
  
  pairs.forEach(pair => {
    const bodyA = pair.bodyA;
    const bodyB = pair.bodyB;
    
    // Check for mine collisions
    checkMineCollision(bodyA, bodyB);
    checkMineCollision(bodyB, bodyA);
    
    // Check for projectile hits on ragdolls
    checkProjectileHit(bodyA, bodyB);
    checkProjectileHit(bodyB, bodyA);
  });
}

function checkMineCollision(bodyA, bodyB) {
  if (bodyA.label === 'mine') {
    const mine = gameState.entities.find(e => e.body === bodyA);
    if (mine && mine.type === 'mine') {
      mine.checkCollision(bodyB);
    }
  }
}

function checkProjectileHit(bodyA, bodyB) {
  if (bodyA.label === 'projectile' && 
      (bodyB.label === 'ragdoll_head' || bodyB.label === 'ragdoll_torso')) {
    // Projectile hit a ragdoll - increase damage based on velocity
    const velocity = Math.sqrt(
      bodyA.velocity.x * bodyA.velocity.x + 
      bodyA.velocity.y * bodyA.velocity.y
    );
    
    if (velocity > 5 && bodyB.ragdoll) {
      // Apply extra force for dramatic effect
      const force = {
        x: bodyA.velocity.x * 0.01,
        y: bodyA.velocity.y * 0.01
      };
      Matter.Body.applyForce(bodyB, bodyB.position, force);
    }
  }
}

export function cleanupPhysics() {
  Events.off(gameState.engine, 'collisionStart', handleCollisionStart);
}