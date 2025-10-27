// physics.js - Physics and collision handling

import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Events, World, Body } = Matter;

import { gameState, FRUIT_TYPES, logs } from './globals.js';
import { Fruit } from './entities.js';

export function setupPhysics() {
  Events.on(gameState.engine, 'collisionStart', handleCollisions);
}

function handleCollisions(event) {
  if (gameState.gamePhase !== 'PLAYING') return;
  
  const pairs = event.pairs;
  
  pairs.forEach(pair => {
    const bodyA = pair.bodyA;
    const bodyB = pair.bodyB;
    
    // Check if both bodies are fruits
    if (bodyA.label === 'fruit' && bodyB.label === 'fruit') {
      const fruitA = bodyA.fruitInstance;
      const fruitB = bodyB.fruitInstance;
      
      // Check if they're the same type and not already merged
      if (fruitA && fruitB && 
          !fruitA.merged && !fruitB.merged &&
          fruitA.typeIndex === fruitB.typeIndex &&
          fruitA.typeIndex < FRUIT_TYPES.length - 1) {
        
        // Mark both as merged
        fruitA.merged = true;
        fruitB.merged = true;
        
        // Calculate merge position (midpoint)
        const mergeX = (bodyA.position.x + bodyB.position.x) / 2;
        const mergeY = (bodyA.position.y + bodyB.position.y) / 2;
        const newTypeIndex = fruitA.typeIndex + 1;
        
        // Add to merge queue to process after physics update
        gameState.mergeQueue.push({
          x: mergeX,
          y: mergeY,
          typeIndex: newTypeIndex,
          oldBodies: [bodyA, bodyB],
          oldFruits: [fruitA, fruitB]
        });
      }
    }
  });
}

export function processMerges() {
  if (gameState.mergeQueue.length === 0) return;
  
  gameState.mergeQueue.forEach(merge => {
    // Remove old bodies
    World.remove(gameState.world, merge.oldBodies);
    
    // Remove old fruits from entities
    gameState.entities = gameState.entities.filter(
      e => e !== merge.oldFruits[0] && e !== merge.oldFruits[1]
    );
    
    // Create new merged fruit
    const newFruit = new Fruit(merge.x, merge.y, merge.typeIndex);
    World.add(gameState.world, newFruit.body);
    gameState.entities.push(newFruit);
    
    // Add score
    const scoreGained = FRUIT_TYPES[merge.typeIndex].score;
    gameState.score += scoreGained;
    
    // Update high score
    if (gameState.score > gameState.highScore) {
      gameState.highScore = gameState.score;
    }
  });
  
  // Clear merge queue
  gameState.mergeQueue = [];
}

export function checkDangerZone() {
  if (gameState.gamePhase !== 'PLAYING') return;
  
  // Check if any fruit is above danger line
  let fruitInDanger = false;
  
  gameState.entities.forEach(entity => {
    if (entity instanceof Fruit && !entity.merged) {
      const topY = entity.body.position.y - entity.fruitData.radius;
      if (topY < gameState.dangerLineY) {
        fruitInDanger = true;
      }
    }
  });
  
  if (fruitInDanger) {
    gameState.dangerFrameCount++;
    
    if (gameState.dangerFrameCount >= gameState.dangerGraceFrames) {
      endGame(false);
    }
  } else {
    gameState.dangerFrameCount = 0;
  }
}

function endGame(won) {
  gameState.gamePhase = won ? 'GAME_OVER_WIN' : 'GAME_OVER_LOSE';
  
  logs.game_info.push({
    game_status: gameState.gamePhase,
    data: { score: gameState.score, highScore: gameState.highScore },
    framecount: gameState.frameCount,
    timestamp: Date.now()
  });
}