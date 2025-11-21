import { BLOCK_TYPES, WORLD_WIDTH, WORLD_HEIGHT, TILE_SIZE, gameState } from './globals.js';

// Generate a procedural world
export function generateWorld(p) {
  const world = new Array(WORLD_WIDTH);
  
  for (let x = 0; x < WORLD_WIDTH; x++) {
    world[x] = new Array(WORLD_HEIGHT).fill(BLOCK_TYPES.AIR);
    
    // Generate terrain height using perlin noise
    const surfaceHeight = Math.floor(
      p.map(p.noise(x * 0.05), 0, 1, WORLD_HEIGHT * 0.3, WORLD_HEIGHT * 0.5)
    );
    
    // Generate terrain layers
    for (let y = 0; y < WORLD_HEIGHT; y++) {
      if (y > surfaceHeight) {
        // Underground layers
        const depth = y - surfaceHeight;
        
        if (depth <= 3) {
          world[x][y] = BLOCK_TYPES.DIRT;
        } else if (depth <= 10) {
          world[x][y] = p.random() < 0.9 ? BLOCK_TYPES.STONE : BLOCK_TYPES.DIRT;
        } else if (depth <= 15) {
          world[x][y] = p.random() < 0.8 ? BLOCK_TYPES.STONE : 
                        (p.random() < 0.5 ? BLOCK_TYPES.IRON : BLOCK_TYPES.DIRT);
        } else {
          world[x][y] = p.random() < 0.7 ? BLOCK_TYPES.STONE : 
                        (p.random() < 0.6 ? BLOCK_TYPES.IRON : 
                         (p.random() < 0.3 ? BLOCK_TYPES.GOLD : BLOCK_TYPES.DIRT));
        }
      }
    }
  }
  
  // Generate trees
  for (let x = 5; x < WORLD_WIDTH - 5; x += 10) {
    // Find surface at this x
    let surfaceY = 0;
    while (surfaceY < WORLD_HEIGHT && world[x][surfaceY] === BLOCK_TYPES.AIR) {
      surfaceY++;
    }
    
    if (surfaceY > 0 && surfaceY < WORLD_HEIGHT && p.random() < 0.6) {
      // Tree trunk
      const treeHeight = Math.floor(p.random(4, 7));
      for (let y = 1; y <= treeHeight; y++) {
        if (surfaceY - y >= 0) {
          world[x][surfaceY - y] = BLOCK_TYPES.WOOD;
        }
      }
      
      // Tree leaves
      const leafRadius = Math.floor(p.random(2, 4));
      for (let lx = -leafRadius; lx <= leafRadius; lx++) {
        for (let ly = -leafRadius; ly <= 1; ly++) {
          const worldX = x + lx;
          const worldY = surfaceY - treeHeight - ly;
          
          if (worldX >= 0 && worldX < WORLD_WIDTH && 
              worldY >= 0 && worldY < WORLD_HEIGHT && 
              world[worldX][worldY] === BLOCK_TYPES.AIR) {
            
            // More leaves near the center
            if (Math.abs(lx) + Math.abs(ly) <= leafRadius || p.random() < 0.6) {
              world[worldX][worldY] = BLOCK_TYPES.LEAVES;
            }
          }
        }
      }
    }
  }
  
  return world;
}

// Draw the visible portion of the world
export function renderWorld(p) {
  const startX = Math.floor(gameState.camera.x / TILE_SIZE);
  const endX = Math.ceil((gameState.camera.x + p.width) / TILE_SIZE);
  const startY = Math.floor(gameState.camera.y / TILE_SIZE);
  const endY = Math.ceil((gameState.camera.y + p.height) / TILE_SIZE);
  
  for (let x = startX; x <= endX; x++) {
    for (let y = startY; y <= endY; y++) {
      if (x >= 0 && x < gameState.world.length && y >= 0 && y < gameState.world[0].length) {
        const block = gameState.world[x][y];
        
        if (block !== BLOCK_TYPES.AIR) {
          const screenX = x * TILE_SIZE - gameState.camera.x;
          const screenY = y * TILE_SIZE - gameState.camera.y;
          
          // Draw different blocks with different colors
          switch (block) {
            case BLOCK_TYPES.DIRT:
              p.fill(139, 69, 19);
              break;
            case BLOCK_TYPES.STONE:
              p.fill(128, 128, 128);
              break;
            case BLOCK_TYPES.IRON:
              p.fill(200, 200, 200);
              break;
            case BLOCK_TYPES.GOLD:
              p.fill(255, 215, 0);
              break;
            case BLOCK_TYPES.WOOD:
              p.fill(101, 67, 33);
              break;
            case BLOCK_TYPES.LEAVES:
              p.fill(0, 128, 0);
              break;
            case BLOCK_TYPES.CRAFTING_TABLE:
              p.fill(160, 82, 45);
              // Draw crafting table details
              p.rect(screenX, screenY, TILE_SIZE, TILE_SIZE);
              p.stroke(101, 67, 33);
              p.strokeWeight(2);
              p.line(screenX, screenY, screenX + TILE_SIZE, screenY + TILE_SIZE);
              p.line(screenX + TILE_SIZE, screenY, screenX, screenY + TILE_SIZE);
              p.noStroke();
              continue;
            case BLOCK_TYPES.PORTAL:
              // Animate portal
              const portalColor = p.map(Math.sin(p.frameCount * 0.1), -1, 1, 100, 255);
              p.fill(portalColor, 0, portalColor);
              break;
            default:
              p.fill(200);
          }
          
          p.noStroke();
          p.rect(screenX, screenY, TILE_SIZE, TILE_SIZE);
        }
      }
    }
  }
  
  // Draw background for sky
  p.push();
  const skyGradient = p.map(
    gameState.time, 
    0, 
    gameState.DAY_LENGTH, 
    1, 
    0
  );
  
  // Day-night cycle colors
  const skyColor = [
    p.map(skyGradient, 0, 1, 20, 135),  // R
    p.map(skyGradient, 0, 1, 20, 206),  // G
    p.map(skyGradient, 0, 1, 50, 235)   // B
  ];
  
  p.fill(skyColor[0], skyColor[1], skyColor[2], 50);
  p.rect(0, 0, p.width, p.height);
  
  // Draw sun or moon
  const celestialX = p.map(gameState.time % gameState.DAY_LENGTH, 0, gameState.DAY_LENGTH, 0, p.width * 2) - p.width / 2;
  const celestialY = p.map(
    Math.sin(p.map(gameState.time % gameState.DAY_LENGTH, 0, gameState.DAY_LENGTH, 0, Math.PI)), 
    0, 
    1, 
    p.height, 
    0
  );
  
  if (gameState.time % gameState.DAY_LENGTH < gameState.DAY_LENGTH / 2) {
    // Sun
    p.fill(255, 255, 200);
  } else {
    // Moon
    p.fill(220, 220, 255);
  }
  
  p.ellipse(celestialX, celestialY, 40, 40);
  p.pop();
}

// Spawn enemies based on time of day
export function spawnEnemies(p) {
  // Only spawn at night
  if (gameState.time % gameState.DAY_LENGTH < gameState.DAY_LENGTH / 2) {
    return;
  }
  
  // Limit number of enemies
  const maxEnemies = 5 + Math.floor(gameState.dayCount / 2);
  let enemyCount = 0;
  
  for (const entity of gameState.entities) {
    if (entity.constructor.name === 'Enemy') {
      enemyCount++;
    }
  }
  
  if (enemyCount >= maxEnemies) {
    return;
  }
  
  // Random chance to spawn
  if (p.random() < 0.02) {
    // Spawn position - near player but off-screen
    const player = gameState.player;
    const spawnSide = p.random() < 0.5 ? -1 : 1;
    const spawnX = player.x + spawnSide * (p.width / 2 + p.random(100, 300));
    
    // Find surface at this x
    const worldX = Math.floor(spawnX / TILE_SIZE);
    if (worldX < 0 || worldX >= gameState.world.length) {
      return;
    }
    
    let surfaceY = 0;
    while (surfaceY < gameState.world[0].length && gameState.world[worldX][surfaceY] === BLOCK_TYPES.AIR) {
      surfaceY++;
    }
    
    if (surfaceY > 0 && surfaceY < gameState.world[0].length) {
      // Create enemy at surface
      const { Enemy } = require('./entities.js');
      const enemy = new Enemy(worldX * TILE_SIZE, (surfaceY - 2) * TILE_SIZE);
      gameState.entities.push(enemy);
    }
  }
}

// Update day/night cycle
export function updateDayNightCycle() {
  gameState.time++;
  
  // New day
  if (gameState.time % gameState.DAY_LENGTH === 0) {
    gameState.dayCount++;
  }
}