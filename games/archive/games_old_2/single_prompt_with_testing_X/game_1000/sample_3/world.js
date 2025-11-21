import { gameState, BLOCK_TYPES, WORLD_WIDTH, WORLD_HEIGHT, BLOCK_SIZE } from './globals.js';

export function generateWorld(p) {
  const blocks = [];
  
  // Initialize 2D array
  for (let x = 0; x < WORLD_WIDTH; x++) {
    blocks[x] = [];
    for (let y = 0; y < WORLD_HEIGHT; y++) {
      blocks[x][y] = { type: BLOCK_TYPES.AIR, health: 100 };
    }
  }
  
  // Generate terrain using noise
  const surfaceHeight = WORLD_HEIGHT * 0.4;
  const noiseScale = 0.02;
  
  for (let x = 0; x < WORLD_WIDTH; x++) {
    const noiseVal = p.noise(x * noiseScale);
    const h = Math.floor(surfaceHeight + noiseVal * 15);
    
    // Grass layer
    if (h > 0 && h < WORLD_HEIGHT) {
      blocks[x][h] = { type: BLOCK_TYPES.GRASS, health: 100 };
    }
    
    // Dirt layers
    for (let y = h + 1; y < h + 5 && y < WORLD_HEIGHT; y++) {
      blocks[x][y] = { type: BLOCK_TYPES.DIRT, health: 100 };
    }
    
    // Stone layers
    for (let y = h + 5; y < WORLD_HEIGHT; y++) {
      blocks[x][y] = { type: BLOCK_TYPES.STONE, health: 100 };
    }
    
    // Add ores
    for (let y = h + 5; y < WORLD_HEIGHT; y++) {
      const oreChance = p.noise(x * 0.1, y * 0.1);
      if (oreChance > 0.75 && y > h + 10) {
        blocks[x][y] = { type: BLOCK_TYPES.IRON_ORE, health: 100 };
      } else if (oreChance > 0.88 && y > h + 20) {
        blocks[x][y] = { type: BLOCK_TYPES.GOLD_ORE, health: 100 };
      }
    }
    
    // Add trees
    if (p.random() < 0.05 && h > 5) {
      const treeHeight = Math.floor(p.random(4, 7));
      for (let ty = 0; ty < treeHeight; ty++) {
        if (h - ty >= 0) {
          blocks[x][h - ty] = { type: BLOCK_TYPES.WOOD, health: 100 };
        }
      }
      // Leaves
      for (let lx = -2; lx <= 2; lx++) {
        for (let ly = -2; ly <= 0; ly++) {
          const leafX = x + lx;
          const leafY = h - treeHeight + ly;
          if (leafX >= 0 && leafX < WORLD_WIDTH && leafY >= 0 && leafY < WORLD_HEIGHT) {
            if (blocks[leafX][leafY].type === BLOCK_TYPES.AIR) {
              blocks[leafX][leafY] = { type: BLOCK_TYPES.LEAF, health: 100 };
            }
          }
        }
      }
    }
  }
  
  // Find spawn point
  for (let x = WORLD_WIDTH / 2; x < WORLD_WIDTH; x++) {
    for (let y = 0; y < WORLD_HEIGHT - 1; y++) {
      if (blocks[x][y].type === BLOCK_TYPES.AIR && blocks[x][y + 1].type !== BLOCK_TYPES.AIR) {
        gameState.spawnX = x * BLOCK_SIZE;
        gameState.spawnY = y * BLOCK_SIZE;
        return blocks;
      }
    }
  }
  
  gameState.spawnX = WORLD_WIDTH * BLOCK_SIZE / 2;
  gameState.spawnY = 10 * BLOCK_SIZE;
  return blocks;
}

export function getBlockAt(x, y) {
  const bx = Math.floor(x / BLOCK_SIZE);
  const by = Math.floor(y / BLOCK_SIZE);
  
  if (bx < 0 || bx >= WORLD_WIDTH || by < 0 || by >= WORLD_HEIGHT) {
    return null;
  }
  
  return gameState.blocks[bx][by];
}

export function setBlockAt(x, y, type) {
  const bx = Math.floor(x / BLOCK_SIZE);
  const by = Math.floor(y / BLOCK_SIZE);
  
  if (bx < 0 || bx >= WORLD_WIDTH || by < 0 || by >= WORLD_HEIGHT) {
    return false;
  }
  
  gameState.blocks[bx][by] = { type: type, health: 100 };
  return true;
}

export function isBlockSolid(blockType) {
  return blockType !== BLOCK_TYPES.AIR && blockType !== BLOCK_TYPES.LEAF;
}