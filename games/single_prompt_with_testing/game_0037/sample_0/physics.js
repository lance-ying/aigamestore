// physics.js - Physics and collision handling
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Events, Body } = Matter;

import { gameState } from './globals.js';

export function setupCollisionHandling() {
  Events.on(gameState.engine, 'collisionStart', (event) => {
    const pairs = event.pairs;
    
    pairs.forEach(pair => {
      const bodyA = pair.bodyA;
      const bodyB = pair.bodyB;
      
      // Player collisions
      if (bodyA.label === 'player' || bodyB.label === 'player') {
        const player = bodyA.label === 'player' ? bodyA : bodyB;
        const other = bodyA.label === 'player' ? bodyB : bodyA;
        
        handlePlayerCollision(player, other);
      }
    });
  });
}

function handlePlayerCollision(playerBody, otherBody) {
  const player = gameState.player;
  
  switch (otherBody.label) {
    case 'ring':
      handleRingCollision(otherBody);
      break;
      
    case 'enemy':
      handleEnemyCollision(playerBody, otherBody);
      break;
      
    case 'goal':
      handleGoalCollision();
      break;
      
    case 'spring':
      handleSpringCollision(playerBody, otherBody);
      break;
  }
}

function handleRingCollision(ringBody) {
  // Find the ring entity
  const ring = gameState.rings.find(r => r.body === ringBody && !r.collected);
  if (ring) {
    ring.collect();
  }
}

function handleEnemyCollision(playerBody, enemyBody) {
  if (gameState.invincibilityTimer > 0) return;
  
  const player = gameState.player;
  const enemy = gameState.enemies.find(e => e.body === enemyBody && !e.destroyed);
  
  if (!enemy) return;
  
  // Check if player is attacking (jumping on enemy or spin dashing)
  const isAttacking = player.isSpinDashing || playerBody.velocity.y > 2;
  
  if (isAttacking) {
    // Destroy enemy
    enemy.destroy();
    // Bounce player
    Body.setVelocity(playerBody, { x: playerBody.velocity.x, y: -8 });
  } else {
    // Take damage
    player.takeDamage();
  }
}

function handleGoalCollision() {
  // Win condition
  gameState.gamePhase = 'GAME_OVER_WIN';
}

function handleSpringCollision(playerBody, springBody) {
  // Find spring entity
  const spring = gameState.entities.find(e => 
    e.body === springBody && e.constructor.name === 'Spring'
  );
  
  if (spring) {
    spring.activate();
    // Launch player upward
    Body.setVelocity(playerBody, { x: playerBody.velocity.x, y: -18 });
  }
}