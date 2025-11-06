// spawner.js - Entity spawning logic
import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';
import { Block, Orb } from './entities.js';

export function updateDifficulty() {
  // Increase difficulty based on distance
  const progress = gameState.distance / 1000;
  
  gameState.scrollSpeed = 2 + Math.min(progress * 0.3, 3);
  gameState.minBlockValue = 5 + Math.floor(progress * 2);
  gameState.maxBlockValue = 15 + Math.floor(progress * 5);
  gameState.spawnInterval = Math.max(100 - progress * 10, 60);
}

export function spawnEntities(p) {
  // Check if we should spawn new row
  if (gameState.scrollOffset - gameState.lastSpawnY > gameState.spawnInterval) {
    gameState.lastSpawnY = gameState.scrollOffset;
    
    // Decide what to spawn
    const rand = p.random();
    
    if (rand < 0.6) {
      // Spawn blocks with gaps
      spawnBlockRow(p);
    } else if (rand < 0.9) {
      // Spawn orbs
      spawnOrbCluster(p);
    } else {
      // Mixed
      spawnMixed(p);
    }
  }
}

function spawnBlockRow(p) {
  const numBlocks = Math.floor(p.random(2, 5));
  const positions = [];
  
  // Generate positions ensuring there's always a gap
  for (let i = 0; i < numBlocks; i++) {
    let x = p.random(60, CANVAS_WIDTH - 60);
    
    // Ensure spacing
    let valid = true;
    for (let pos of positions) {
      if (Math.abs(x - pos) < 80) {
        valid = false;
        break;
      }
    }
    
    if (valid) {
      positions.push(x);
      const value = Math.floor(p.random(gameState.minBlockValue, gameState.maxBlockValue + 1));
      const block = new Block(x, -50, value);
      gameState.blocks.push(block);
      gameState.entities.push(block);
    }
  }
}

function spawnOrbCluster(p) {
  const numOrbs = Math.floor(p.random(3, 8));
  
  for (let i = 0; i < numOrbs; i++) {
    const x = p.random(40, CANVAS_WIDTH - 40);
    const y = -50 + p.random(-30, 30);
    const value = Math.floor(p.random(1, 4)); // 1-3 orbs value
    const orb = new Orb(x, y, value);
    gameState.orbs.push(orb);
    gameState.entities.push(orb);
  }
}

function spawnMixed(p) {
  // Spawn some blocks and some orbs
  const numBlocks = Math.floor(p.random(1, 3));
  const numOrbs = Math.floor(p.random(2, 5));
  
  for (let i = 0; i < numBlocks; i++) {
    const x = p.random(60, CANVAS_WIDTH - 60);
    const value = Math.floor(p.random(gameState.minBlockValue, gameState.maxBlockValue + 1));
    const block = new Block(x, -50, value);
    gameState.blocks.push(block);
    gameState.entities.push(block);
  }
  
  for (let i = 0; i < numOrbs; i++) {
    const x = p.random(40, CANVAS_WIDTH - 40);
    const y = -50 + p.random(-30, 30);
    const value = Math.floor(p.random(1, 4));
    const orb = new Orb(x, y, value);
    gameState.orbs.push(orb);
    gameState.entities.push(orb);
  }
}