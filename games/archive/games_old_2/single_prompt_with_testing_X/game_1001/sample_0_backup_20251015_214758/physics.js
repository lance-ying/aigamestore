// physics.js - Physics and collision handling

import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Events, World, Body } = Matter;

import { gameState, FRUIT_TYPES } from './globals.js';
import { Fruit } from './entities.js';

let mergeQueue = [];

export function setupCollisionHandling(p) {
  Events.on(gameState.engine, 'collisionStart', (event) => {
    if (gameState.gamePhase !== "PLAYING") return;
    
    const pairs = event.pairs;
    
    pairs.forEach(pair => {
      const bodyA = pair.bodyA;
      const bodyB = pair.bodyB;
      
      // Check if both are fruits
      if (bodyA.label === 'fruit' && bodyB.label === 'fruit') {
        const fruitA = bodyA.fruitInstance;
        const fruitB = bodyB.fruitInstance;
        
        // Check if same type and not already merged
        if (fruitA && fruitB && 
            !fruitA.merged && !fruitB.merged &&
            !fruitA.markedForRemoval && !fruitB.markedForRemoval &&
            fruitA.typeIndex === fruitB.typeIndex &&
            fruitA.typeIndex < FRUIT_TYPES.length - 1) {
          
          // Mark for merge
          fruitA.merged = true;
          fruitB.merged = true;
          
          // Add to merge queue
          mergeQueue.push({
            fruitA: fruitA,
            fruitB: fruitB,
            position: {
              x: (bodyA.position.x + bodyB.position.x) / 2,
              y: (bodyA.position.y + bodyB.position.y) / 2
            },
            newTypeIndex: fruitA.typeIndex + 1
          });
        }
      }
    });
  });
}

export function processMerges(p) {
  if (mergeQueue.length === 0) return;
  
  // Process all merges in queue
  mergeQueue.forEach(merge => {
    // Remove old fruits
    merge.fruitA.destroy();
    merge.fruitB.destroy();
    
    // Remove from fruits array
    const indexA = gameState.fruits.indexOf(merge.fruitA);
    if (indexA > -1) gameState.fruits.splice(indexA, 1);
    
    const indexB = gameState.fruits.indexOf(merge.fruitB);
    if (indexB > -1) gameState.fruits.splice(indexB, 1);
    
    // Create new fruit
    const newFruit = new Fruit(p, merge.position.x, merge.position.y, merge.newTypeIndex);
    gameState.fruits.push(newFruit);
    
    // Add score
    const points = FRUIT_TYPES[merge.newTypeIndex].points;
    gameState.score += points;
    
    // Check if watermelon created (win condition)
    if (merge.newTypeIndex === FRUIT_TYPES.length - 1) {
      gameState.watermelonCreated = true;
    }
    
    // Visual feedback (could add particle effects here)
  });
  
  // Clear queue
  mergeQueue = [];
}