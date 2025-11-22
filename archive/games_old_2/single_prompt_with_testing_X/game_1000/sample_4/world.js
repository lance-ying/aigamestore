// world.js - World generation and management
import { WORLD_WIDTH, WORLD_HEIGHT, BLOCK_TYPES, TILE_SIZE } from './globals.js';

export class World {
  constructor(p) {
    this.p = p;
    this.tiles = [];
    this.generate();
  }

  generate() {
    // Initialize 2D array
    for (let x = 0; x < WORLD_WIDTH; x++) {
      this.tiles[x] = [];
      for (let y = 0; y < WORLD_HEIGHT; y++) {
        this.tiles[x][y] = BLOCK_TYPES.AIR;
      }
    }

    // Generate terrain using noise
    const surfaceHeight = WORLD_HEIGHT * 0.3;
    const p = this.p;
    
    for (let x = 0; x < WORLD_WIDTH; x++) {
      const noiseVal = p.noise(x * 0.05);
      const height = p.floor(surfaceHeight + noiseVal * 15);
      
      // Grass layer
      this.tiles[x][height] = BLOCK_TYPES.GRASS;
      
      // Dirt and stone layers
      for (let y = height + 1; y < WORLD_HEIGHT; y++) {
        if (y < height + 5) {
          this.tiles[x][y] = BLOCK_TYPES.DIRT;
        } else if (y < WORLD_HEIGHT - 5) {
          this.tiles[x][y] = BLOCK_TYPES.STONE;
          
          // Ore generation
          const oreChance = p.noise(x * 0.1, y * 0.1);
          const depth = y - height;
          
          if (depth > 10 && oreChance > 0.85) {
            this.tiles[x][y] = BLOCK_TYPES.IRON_ORE;
          } else if (depth > 20 && oreChance > 0.9) {
            this.tiles[x][y] = BLOCK_TYPES.GOLD_ORE;
          } else if (depth > 35 && oreChance > 0.93) {
            this.tiles[x][y] = BLOCK_TYPES.DIAMOND_ORE;
          } else if (depth > 50 && oreChance > 0.96) {
            this.tiles[x][y] = BLOCK_TYPES.MYTHRIL_ORE;
          }
        } else {
          // Bedrock at bottom
          this.tiles[x][y] = BLOCK_TYPES.BEDROCK;
        }
      }
    }
  }

  getBlock(x, y) {
    if (x < 0 || x >= WORLD_WIDTH || y < 0 || y >= WORLD_HEIGHT) {
      return BLOCK_TYPES.BEDROCK;
    }
    return this.tiles[x][y];
  }

  setBlock(x, y, type) {
    if (x >= 0 && x < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT) {
      this.tiles[x][y] = type;
    }
  }

  isBlockSolid(x, y) {
    const block = this.getBlock(x, y);
    return block !== BLOCK_TYPES.AIR;
  }

  render(p, camera) {
    const startX = Math.max(0, Math.floor(camera.x / TILE_SIZE));
    const endX = Math.min(WORLD_WIDTH, Math.ceil((camera.x + 600) / TILE_SIZE));
    const startY = Math.max(0, Math.floor(camera.y / TILE_SIZE));
    const endY = Math.min(WORLD_HEIGHT, Math.ceil((camera.y + 400) / TILE_SIZE));

    for (let x = startX; x < endX; x++) {
      for (let y = startY; y < endY; y++) {
        const block = this.tiles[x][y];
        if (block === BLOCK_TYPES.AIR) continue;

        const screenX = x * TILE_SIZE - camera.x;
        const screenY = y * TILE_SIZE - camera.y;

        // Set color based on block type
        switch (block) {
          case BLOCK_TYPES.GRASS:
            p.fill(34, 139, 34);
            break;
          case BLOCK_TYPES.DIRT:
            p.fill(139, 90, 43);
            break;
          case BLOCK_TYPES.STONE:
            p.fill(128, 128, 128);
            break;
          case BLOCK_TYPES.IRON_ORE:
            p.fill(192, 192, 192);
            break;
          case BLOCK_TYPES.GOLD_ORE:
            p.fill(255, 215, 0);
            break;
          case BLOCK_TYPES.DIAMOND_ORE:
            p.fill(0, 191, 255);
            break;
          case BLOCK_TYPES.MYTHRIL_ORE:
            p.fill(138, 43, 226);
            break;
          case BLOCK_TYPES.BEDROCK:
            p.fill(50, 50, 50);
            break;
        }

        p.rect(screenX, screenY, TILE_SIZE, TILE_SIZE);

        // Add some texture
        if (block !== BLOCK_TYPES.AIR) {
          p.stroke(0, 30);
          p.line(screenX, screenY, screenX + TILE_SIZE, screenY);
          p.line(screenX, screenY, screenX, screenY + TILE_SIZE);
          p.noStroke();
        }
      }
    }
  }
}