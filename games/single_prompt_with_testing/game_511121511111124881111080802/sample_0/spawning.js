// spawning.js - Handles spawning of game objects (bricks and collectibles)

import {
  gameState,
  CANVAS_WIDTH,
  BRICK_WIDTH,
  BRICK_HEIGHT,
  COLLECTIBLE_RADIUS,
  MIN_BRICK_VALUE,
  randomInt,
  randomRange
} from './globals.js';

import { Brick, Collectible } from './entities.js';

// Spawn a new row of objects
export function spawnRow(p) {
  const y = gameState.nextSpawnY;
  
  // Calculate max brick value based on difficulty
  const maxValue = Math.floor(gameState.maxBrickValue);
  
  // Decide what to spawn in this row
  const rowType = Math.random();
  
  if (rowType < 0.3) {
    // Spawn collectibles row
    spawnCollectiblesRow(y);
  } else if (rowType < 0.6) {
    // Spawn bricks row
    spawnBricksRow(y, maxValue);
  } else if (rowType < 0.8) {
    // Spawn mixed row
    spawnMixedRow(y, maxValue);
  } else {
    // Spawn pattern row
    spawnPatternRow(y, maxValue);
  }
  
  // Update next spawn position
  gameState.nextSpawnY -= BRICK_HEIGHT * 2;
  gameState.rowsPassed++;
}

// Spawn a row of collectibles
function spawnCollectiblesRow(y) {
  const count = randomInt(3, 7);
  const spacing = CANVAS_WIDTH / (count + 1);
  
  for (let i = 0; i < count; i++) {
    const x = spacing * (i + 1);
    const value = randomInt(1, 3);
    new Collectible(x, y, value);
  }
}

// Spawn a row of bricks
function spawnBricksRow(y, maxValue) {
  const count = randomInt(2, 5);
  const positions = generateBrickPositions(count);
  
  positions.forEach(x => {
    // Calculate brick value based on snake length and difficulty
    const snakeLength = gameState.player ? gameState.player.getLength() : 5;
    const minValue = Math.max(MIN_BRICK_VALUE, Math.floor(snakeLength * 0.3));
    const maxValueForBrick = Math.min(maxValue, Math.floor(snakeLength * 1.5));
    const value = randomInt(minValue, Math.max(minValue, maxValueForBrick));
    
    new Brick(x, y, value);
  });
}

// Spawn a mixed row of bricks and collectibles
function spawnMixedRow(y, maxValue) {
  const totalItems = randomInt(4, 7);
  const positions = generateMixedPositions(totalItems);
  
  positions.forEach(x => {
    if (Math.random() < 0.6) {
      // Spawn brick
      const snakeLength = gameState.player ? gameState.player.getLength() : 5;
      const minValue = Math.max(MIN_BRICK_VALUE, Math.floor(snakeLength * 0.2));
      const maxValueForBrick = Math.min(maxValue, Math.floor(snakeLength * 1.2));
      const value = randomInt(minValue, Math.max(minValue, maxValueForBrick));
      new Brick(x, y, value);
    } else {
      // Spawn collectible
      const value = randomInt(1, 2);
      new Collectible(x, y, value);
    }
  });
}

// Spawn a pattern row with strategic placement
function spawnPatternRow(y, maxValue) {
  const pattern = randomInt(0, 3);
  
  switch (pattern) {
    case 0: // Wall with gaps
      spawnWallPattern(y, maxValue);
      break;
    case 1: // Zigzag
      spawnZigzagPattern(y, maxValue);
      break;
    case 2: // Funnel
      spawnFunnelPattern(y, maxValue);
      break;
    case 3: // Cluster
      spawnClusterPattern(y, maxValue);
      break;
  }
}

// Generate brick positions without overlap
function generateBrickPositions(count) {
  const positions = [];
  const minSpacing = BRICK_WIDTH + 20;
  const attempts = 100;
  
  for (let i = 0; i < count; i++) {
    let placed = false;
    for (let attempt = 0; attempt < attempts; attempt++) {
      const x = randomRange(BRICK_WIDTH / 2, CANVAS_WIDTH - BRICK_WIDTH / 2);
      
      // Check if position is valid (not overlapping)
      let valid = true;
      for (const pos of positions) {
        if (Math.abs(x - pos) < minSpacing) {
          valid = false;
          break;
        }
      }
      
      if (valid) {
        positions.push(x);
        placed = true;
        break;
      }
    }
  }
  
  return positions;
}

// Generate mixed positions with proper spacing
function generateMixedPositions(count) {
  const positions = [];
  const minSpacing = 40;
  const attempts = 100;
  
  for (let i = 0; i < count; i++) {
    let placed = false;
    for (let attempt = 0; attempt < attempts; attempt++) {
      const x = randomRange(30, CANVAS_WIDTH - 30);
      
      let valid = true;
      for (const pos of positions) {
        if (Math.abs(x - pos) < minSpacing) {
          valid = false;
          break;
        }
      }
      
      if (valid) {
        positions.push(x);
        placed = true;
        break;
      }
    }
  }
  
  return positions;
}

// Wall pattern with strategic gaps
function spawnWallPattern(y, maxValue) {
  const gapCount = randomInt(1, 2);
  const gapPositions = [];
  
  // Create gaps
  for (let i = 0; i < gapCount; i++) {
    gapPositions.push(randomRange(100, CANVAS_WIDTH - 100));
  }
  
  // Create wall bricks
  const brickCount = Math.floor(CANVAS_WIDTH / (BRICK_WIDTH + 10));
  for (let i = 0; i < brickCount; i++) {
    const x = i * (BRICK_WIDTH + 10) + BRICK_WIDTH / 2;
    
    // Check if this position should be a gap
    let isGap = false;
    for (const gapX of gapPositions) {
      if (Math.abs(x - gapX) < BRICK_WIDTH * 2) {
        isGap = true;
        break;
      }
    }
    
    if (!isGap) {
      const snakeLength = gameState.player ? gameState.player.getLength() : 5;
      const value = randomInt(
        Math.max(MIN_BRICK_VALUE, Math.floor(snakeLength * 0.4)),
        Math.min(maxValue, Math.floor(snakeLength * 1.3))
      );
      new Brick(x, y, value);
    }
  }
  
  // Add collectibles in gaps
  gapPositions.forEach(x => {
    new Collectible(x, y, randomInt(1, 3));
  });
}

// Zigzag pattern
function spawnZigzagPattern(y, maxValue) {
  const count = 4;
  const amplitude = CANVAS_WIDTH / 3;
  const center = CANVAS_WIDTH / 2;
  
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const x = center + Math.sin(t * Math.PI * 2) * amplitude;
    
    if (Math.random() < 0.7) {
      const snakeLength = gameState.player ? gameState.player.getLength() : 5;
      const value = randomInt(
        Math.max(MIN_BRICK_VALUE, Math.floor(snakeLength * 0.3)),
        Math.min(maxValue, Math.floor(snakeLength * 1.2))
      );
      new Brick(x, y - i * 15, value);
    } else {
      new Collectible(x, y - i * 15, randomInt(1, 2));
    }
  }
}

// Funnel pattern
function spawnFunnelPattern(y, maxValue) {
  const sides = Math.random() < 0.5 ? 'left' : 'right';
  const count = 5;
  
  for (let i = 0; i < count; i++) {
    const offsetX = sides === 'left' 
      ? BRICK_WIDTH * i 
      : CANVAS_WIDTH - BRICK_WIDTH * (i + 1);
    
    const snakeLength = gameState.player ? gameState.player.getLength() : 5;
    const value = randomInt(
      Math.max(MIN_BRICK_VALUE, Math.floor(snakeLength * 0.4)),
      Math.min(maxValue, Math.floor(snakeLength * 1.4))
    );
    new Brick(offsetX, y, value);
  }
  
  // Add collectible on the open side
  const collectibleX = sides === 'left' 
    ? CANVAS_WIDTH - 50 
    : 50;
  new Collectible(collectibleX, y, randomInt(2, 4));
}

// Cluster pattern
function spawnClusterPattern(y, maxValue) {
  const clusterCount = randomInt(2, 3);
  
  for (let i = 0; i < clusterCount; i++) {
    const centerX = randomRange(100, CANVAS_WIDTH - 100);
    const itemCount = randomInt(3, 5);
    
    for (let j = 0; j < itemCount; j++) {
      const angle = (Math.PI * 2 * j) / itemCount;
      const radius = 40;
      const x = centerX + Math.cos(angle) * radius;
      const itemY = y + Math.sin(angle) * radius;
      
      if (Math.random() < 0.6) {
        const snakeLength = gameState.player ? gameState.player.getLength() : 5;
        const value = randomInt(
          Math.max(MIN_BRICK_VALUE, Math.floor(snakeLength * 0.3)),
          Math.min(maxValue, Math.floor(snakeLength * 1.1))
        );
        new Brick(x, itemY, value);
      } else {
        new Collectible(x, itemY, 1);
      }
    }
  }
}

// Update spawning system
export function updateSpawning(p) {
  gameState.spawnCounter++;
  
  // Spawn new row when needed
  if (gameState.nextSpawnY > -gameState.cameraY - BRICK_HEIGHT * 3) {
    spawnRow(p);
    
    // Gradually increase difficulty
    gameState.difficulty += 0.001;
    gameState.maxBrickValue += 0.02;
    
    // Increase spawn rate
    if (gameState.spawnRate > 30) {
      gameState.spawnRate -= 0.1;
    }
  }
}