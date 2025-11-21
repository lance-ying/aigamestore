// physics.js - Physics and collision handling

import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Events, Body } = Matter;

import { gameState, COLLISION_FORCE } from './globals.js';
import { DroppedBlock } from './entities.js';

export function setupCollisionHandling(p) {
  Events.on(gameState.engine, 'collisionStart', (event) => {
    const pairs = event.pairs;
    
    pairs.forEach(pair => {
      const bodyA = pair.bodyA;
      const bodyB = pair.bodyB;
      
      // Racer collision with racer
      if ((bodyA.label === 'player' || bodyA.label === 'ai') &&
          (bodyB.label === 'player' || bodyB.label === 'ai')) {
        handleRacerCollision(p, bodyA, bodyB);
      }
    });
  });
}

function handleRacerCollision(p, bodyA, bodyB) {
  // Find the racers
  let racerA = null;
  let racerB = null;
  
  if (gameState.player && gameState.player.body === bodyA) {
    racerA = gameState.player;
  } else {
    racerA = gameState.aiRacers.find(ai => ai.body === bodyA);
  }
  
  if (gameState.player && gameState.player.body === bodyB) {
    racerB = gameState.player;
  } else {
    racerB = gameState.aiRacers.find(ai => ai.body === bodyB);
  }
  
  if (!racerA || !racerB) return;
  
  // Calculate collision velocity
  const relativeVelocity = Math.sqrt(
    Math.pow(bodyA.velocity.x - bodyB.velocity.x, 2) +
    Math.pow(bodyA.velocity.y - bodyB.velocity.y, 2)
  );
  
  // If collision is strong enough, drop blocks
  if (relativeVelocity > 2) {
    // Apply collision force
    const angle = Math.atan2(
      bodyB.position.y - bodyA.position.y,
      bodyB.position.x - bodyA.position.x
    );
    
    Body.applyForce(bodyA, bodyA.position, {
      x: -Math.cos(angle) * COLLISION_FORCE * 0.001,
      y: -Math.sin(angle) * COLLISION_FORCE * 0.001
    });
    
    Body.applyForce(bodyB, bodyB.position, {
      x: Math.cos(angle) * COLLISION_FORCE * 0.001,
      y: Math.sin(angle) * COLLISION_FORCE * 0.001
    });
    
    // Drop blocks from both racers
    if (racerA.blocks > 0) {
      const dropped = racerA.dropBlocks();
      createDroppedBlocks(p, racerA, dropped);
    }
    
    if (racerB.blocks > 0) {
      const dropped = racerB.dropBlocks();
      createDroppedBlocks(p, racerB, dropped);
    }
  }
}

function createDroppedBlocks(p, racer, count) {
  const colors = [
    [255, 50, 50],
    [50, 100, 255],
    [50, 255, 100],
    [255, 255, 50]
  ];
  
  for (let i = 0; i < count; i++) {
    const offsetX = (Math.random() - 0.5) * 40;
    const offsetY = (Math.random() - 0.5) * 40;
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    const droppedBlock = new DroppedBlock(
      p,
      racer.body.position.x + offsetX,
      racer.worldY + offsetY,
      color
    );
    
    gameState.droppedBlocks.push(droppedBlock);
  }
}