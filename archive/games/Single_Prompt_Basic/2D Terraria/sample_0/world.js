import { TILE_SIZE, WORLD_WIDTH, WORLD_HEIGHT, TILE_TYPES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

// Generate terrain using perlin noise
export function generateWorld(p) {
  const world = Array(WORLD_WIDTH).fill().map(() => Array(WORLD_HEIGHT).fill(TILE_TYPES.AIR));
  
  // Generate terrain height using perlin noise
  const groundHeights = [];
  for (let x = 0; x < WORLD_WIDTH; x++) {
    const height = Math.floor(p.noise(x * 0.05) * 10) + 30;
    groundHeights.push(height);
  }
  
  // Fill terrain
  for (let x = 0; x < WORLD_WIDTH; x++) {
    const groundHeight = groundHeights[x];
    
    // Add grass at the top
    world[x][groundHeight] = TILE_TYPES.GRASS;
    
    // Add dirt below grass
    for (let y = groundHeight + 1; y < groundHeight + 5; y++) {
      if (y < WORLD_HEIGHT) {
        world[x][y] = TILE_TYPES.DIRT;
      }
    }
    
    // Add stone below dirt
    for (let y = groundHeight + 5; y < WORLD_HEIGHT; y++) {
      world[x][y] = TILE_TYPES.STONE;
    }
  }
  
  // Add ores
  addOres(world, p, TILE_TYPES.IRON_ORE, 150, 40);
  addOres(world, p, TILE_TYPES.GOLD_ORE, 80, 50);
  
  // Add trees
  addTrees(world, p, groundHeights);
  
  return world;
}

// Add ore veins to the world
function addOres(world, p, oreType, count, minDepth) {
  for (let i = 0; i < count; i++) {
    const x = Math.floor(p.random(WORLD_WIDTH));
    const y = Math.floor(p.random(minDepth, WORLD_HEIGHT));
    
    if (world[x][y] === TILE_TYPES.STONE) {
      const veinSize = Math.floor(p.random(3, 6));
      
      for (let vx = -veinSize; vx <= veinSize; vx++) {
        for (let vy = -veinSize; vy <= veinSize; vy++) {
          const nx = x + vx;
          const ny = y + vy;
          
          if (nx >= 0 && nx < WORLD_WIDTH && ny >= 0 && ny < WORLD_HEIGHT) {
            const dist = Math.sqrt(vx * vx + vy * vy);
            
            if (dist <= veinSize * 0.7 && world[nx][ny] === TILE_TYPES.STONE && p.random() > 0.5) {
              world[nx][ny] = oreType;
            }
          }
        }
      }
    }
  }
}

// Add trees to the world
function addTrees(world, p, groundHeights) {
  for (let x = 5; x < WORLD_WIDTH - 5; x += Math.floor(p.random(5, 15))) {
    const groundY = groundHeights[x];
    
    if (groundY < WORLD_HEIGHT - 10 && world[x][groundY] === TILE_TYPES.GRASS) {
      const treeHeight = Math.floor(p.random(4, 8));
      
      // Tree trunk
      for (let y = groundY - 1; y > groundY - treeHeight; y--) {
        if (y >= 0) {
          world[x][y] = TILE_TYPES.WOOD;
        }
      }
    }
  }
}

// Draw the visible portion of the world
export function drawWorld(p, world, cameraX, cameraY) {
  const startX = Math.floor(cameraX / TILE_SIZE);
  const startY = Math.floor(cameraY / TILE_SIZE);
  const endX = startX + Math.ceil(CANVAS_WIDTH / TILE_SIZE) + 1;
  const endY = startY + Math.ceil(CANVAS_HEIGHT / TILE_SIZE) + 1;
  
  for (let x = startX; x < endX; x++) {
    for (let y = startY; y < endY; y++) {
      if (x >= 0 && x < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT) {
        const tileType = world[x][y];
        const screenX = x * TILE_SIZE - cameraX;
        const screenY = y * TILE_SIZE - cameraY;
        
        if (tileType !== TILE_TYPES.AIR) {
          drawTile(p, tileType, screenX, screenY);
        }
      }
    }
  }
}

// Draw a single tile
function drawTile(p, tileType, x, y) {
  // Ensure tiles always have consistent stroke settings
  p.stroke(0); // Black outline for all tiles
  p.strokeWeight(1);
  
  switch(tileType) {
    case TILE_TYPES.GRASS:
      p.fill(34, 139, 34);
      p.rect(x, y, TILE_SIZE, TILE_SIZE);
      p.fill(82, 46, 23);
      p.rect(x, y + TILE_SIZE/2, TILE_SIZE, TILE_SIZE/2);
      break;
    case TILE_TYPES.DIRT:
      p.fill(82, 46, 23);
      p.rect(x, y, TILE_SIZE, TILE_SIZE);
      break;
    case TILE_TYPES.STONE:
      p.fill(128, 128, 128);
      p.rect(x, y, TILE_SIZE, TILE_SIZE);
      break;
    case TILE_TYPES.WOOD:
      p.fill(139, 69, 19);
      p.rect(x, y, TILE_SIZE, TILE_SIZE);
      p.fill(101, 67, 33);
      p.noStroke(); // No stroke for wood grain details
      p.rect(x + 5, y, 2, TILE_SIZE);
      p.rect(x + 13, y, 2, TILE_SIZE);
      break;
    case TILE_TYPES.IRON_ORE:
      p.fill(128, 128, 128);
      p.rect(x, y, TILE_SIZE, TILE_SIZE);
      p.fill(170, 169, 173);
      p.noStroke(); // No stroke for ore details
      p.ellipse(x + 5, y + 7, 6, 6);
      p.ellipse(x + 12, y + 13, 8, 8);
      p.ellipse(x + 15, y + 5, 5, 5);
      break;
    case TILE_TYPES.GOLD_ORE:
      p.fill(128, 128, 128);
      p.rect(x, y, TILE_SIZE, TILE_SIZE);
      p.fill(255, 215, 0);
      p.noStroke(); // No stroke for ore details
      p.ellipse(x + 7, y + 5, 6, 6);
      p.ellipse(x + 14, y + 11, 8, 8);
      p.ellipse(x + 5, y + 15, 5, 5);
      break;
    case TILE_TYPES.WOODEN_PLATFORM:
      p.fill(139, 69, 19);
      p.rect(x, y + TILE_SIZE/2 - 2, TILE_SIZE, 4);
      break;
    case TILE_TYPES.WOODEN_WALL:
      p.fill(139, 69, 19);
      p.rect(x, y, TILE_SIZE, TILE_SIZE);
      p.fill(101, 67, 33);
      p.noStroke(); // No stroke for wall details
      p.rect(x, y, TILE_SIZE, 2);
      p.rect(x, y + TILE_SIZE/2, TILE_SIZE, 2);
      p.rect(x, y + TILE_SIZE - 2, TILE_SIZE, 2);
      break;
    case TILE_TYPES.STONE_WALL:
      p.fill(128, 128, 128);
      p.rect(x, y, TILE_SIZE, TILE_SIZE);
      p.fill(100, 100, 100);
      p.noStroke(); // No stroke for wall details
      p.rect(x, y, TILE_SIZE, 2);
      p.rect(x, y + TILE_SIZE/2, TILE_SIZE, 2);
      p.rect(x, y + TILE_SIZE - 2, TILE_SIZE, 2);
      p.rect(x, y, 2, TILE_SIZE);
      p.rect(x + TILE_SIZE/2, y, 2, TILE_SIZE);
      p.rect(x + TILE_SIZE - 2, y, 2, TILE_SIZE);
      break;
  }
}

// Check if a tile is solid (can't pass through)
export function isSolidTile(tileType) {
  return tileType !== TILE_TYPES.AIR && tileType !== TILE_TYPES.WOODEN_PLATFORM;
}

// Check if a tile is a platform (can stand on but can drop through)
export function isPlatform(tileType) {
  return tileType === TILE_TYPES.WOODEN_PLATFORM;
}

// Get tile at world coordinates
export function getTileAt(world, x, y) {
  const tileX = Math.floor(x / TILE_SIZE);
  const tileY = Math.floor(y / TILE_SIZE);
  
  if (tileX >= 0 && tileX < WORLD_WIDTH && tileY >= 0 && tileY < WORLD_HEIGHT) {
    return world[tileX][tileY];
  }
  
  return TILE_TYPES.AIR;
}

// Set tile at world coordinates
export function setTileAt(world, x, y, tileType) {
  const tileX = Math.floor(x / TILE_SIZE);
  const tileY = Math.floor(y / TILE_SIZE);
  
  if (tileX >= 0 && tileX < WORLD_WIDTH && tileY >= 0 && tileY < WORLD_HEIGHT) {
    world[tileX][tileY] = tileType;
    return true;
  }
  
  return false;
}

// Update the tileToItem function to return block types directly
export function tileToItem(tileType) {
  switch(tileType) {
    case TILE_TYPES.WOOD:
      return 'wooden_platform'; // Wood becomes wooden platforms directly
    case TILE_TYPES.STONE:
      return 'stone_wall'; // Stone becomes stone walls directly
    case TILE_TYPES.DIRT:
    case TILE_TYPES.GRASS:
      return 'dirt_block'; // NEW: Dirt blocks
    case TILE_TYPES.IRON_ORE:
      return 'iron_block'; // NEW: Iron blocks
    case TILE_TYPES.GOLD_ORE:
      return 'gold_block'; // NEW: Gold blocks
    case TILE_TYPES.WOODEN_PLATFORM:
      return 'wooden_platform';
    case TILE_TYPES.WOODEN_WALL:
      return 'wooden_wall';
    case TILE_TYPES.STONE_WALL:
      return 'stone_wall';
    default:
      return null;
  }
}

// Update itemToTile to handle new block types
export function itemToTile(itemType) {
  switch(itemType) {
    case 'wooden_platform':
      return TILE_TYPES.WOODEN_PLATFORM;
    case 'wooden_wall':
      return TILE_TYPES.WOODEN_WALL;
    case 'stone_wall':
      return TILE_TYPES.STONE_WALL;
    case 'dirt_block':
      return TILE_TYPES.DIRT;
    case 'iron_block':
      return TILE_TYPES.IRON_ORE; // Place as iron ore blocks
    case 'gold_block':
      return TILE_TYPES.GOLD_ORE; // Place as gold ore blocks
    default:
      return null;
  }
}