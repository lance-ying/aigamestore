// physics.js - Physics and collision handling

import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Events, World, Body } = Matter;

import { gameState, FRUIT_TYPES, logs, LEVELS } from './globals.js';
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
        
        // Mark both as merged immediately
        fruitA.merged = true;
        fruitB.merged = true;
        
        // Calculate merge position (midpoint)
        const mergeX = (bodyA.position.x + bodyB.position.x) / 2;
        const mergeY = (bodyA.position.y + bodyB.position.y) / 2;
        const newTypeIndex = fruitA.typeIndex + 1;
        
        // Process merge immediately (automatic, no delay)
        executeMerge(bodyA, bodyB, fruitA, fruitB, mergeX, mergeY, newTypeIndex);
      }
    }
  });
}

function executeMerge(bodyA, bodyB, fruitA, fruitB, mergeX, mergeY, newTypeIndex) {
  // Remove old bodies from physics world
  World.remove(gameState.world, [bodyA, bodyB]);
  
  // Remove old fruits from entities array
  gameState.entities = gameState.entities.filter(
    e => e !== fruitA && e !== fruitB
  );
  
  // Create new merged fruit immediately
  const newFruit = new Fruit(mergeX, mergeY, newTypeIndex);
  World.add(gameState.world, newFruit.body);
  gameState.entities.push(newFruit);
  
  // Add score
  const scoreGained = FRUIT_TYPES[newTypeIndex].score;
  gameState.score += scoreGained;
  
  // Check level progression
  const nextLevelIndex = gameState.currentLevelIndex + 1;
  if (nextLevelIndex < LEVELS.length && gameState.score >= LEVELS[nextLevelIndex].threshold) {
    gameState.currentLevelIndex = nextLevelIndex;
    
    // Optional log for level up
    logs.game_info.push({
      game_status: 'LEVEL_UP',
      data: { 
        level: LEVELS[nextLevelIndex].name, 
        score: gameState.score,
        new_level_index: nextLevelIndex
      },
      framecount: gameState.frameCount,
      timestamp: Date.now()
    });
  }
  
  // Update high score
  if (gameState.score > gameState.highScore) {
    gameState.highScore = gameState.score;
  }
}

export function processMerges() {
  // No longer needed as merges are processed immediately in collision handler
  // Kept for compatibility
}

export function checkDangerZone() {
  if (gameState.gamePhase !== 'PLAYING') return;
  
  // Check if any fruit is above danger line
  let fruitInDanger = false;
  
  gameState.entities.forEach(entity => {
    if (entity instanceof Fruit && !entity.merged) {
      const topY = entity.body.position.y - entity.fruitData.radius;
      
      // Only check fruits that have been in the game for a bit (not freshly dropped)
      const velocity = entity.body.velocity;
      const isSettled = Math.abs(velocity.y) < 5 || velocity.y > 0;
      
      if (topY < gameState.dangerLineY && isSettled) {
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