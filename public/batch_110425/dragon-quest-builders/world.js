// world.js - World generation and block management

import { WORLD_WIDTH, WORLD_HEIGHT, BLOCK_GRASS, BLOCK_DIRT, BLOCK_STONE, BLOCK_WOOD, BLOCK_EMPTY } from './globals.js';

export class World {
  constructor(p) {
    this.p = p;
    this.blocks = [];
    this.generateWorld();
  }

  generateWorld() {
    // Create a 2D grid of blocks
    for (let y = 0; y < WORLD_HEIGHT; y++) {
      this.blocks[y] = [];
      for (let x = 0; x < WORLD_WIDTH; x++) {
        // Generate terrain with layers
        let blockType = BLOCK_EMPTY;
        
        if (y > 10) {
          blockType = BLOCK_DIRT;
        } else if (y === 10) {
          blockType = BLOCK_GRASS;
        } else if (y > 7 && y < 10) {
          // Some floating blocks
          if (this.p.random() > 0.7) {
            if (this.p.random() > 0.5) {
              blockType = BLOCK_STONE;
            } else {
              blockType = BLOCK_WOOD;
            }
          }
        }
        
        this.blocks[y][x] = {
          type: blockType,
          x: x,
          y: y
        };
      }
    }
    
    // Add some resource clusters
    this.addResourceClusters(BLOCK_STONE, 5, 3);
    this.addResourceClusters(BLOCK_WOOD, 4, 2);
  }

  addResourceClusters(blockType, count, size) {
    for (let i = 0; i < count; i++) {
      const cx = Math.floor(this.p.random(2, WORLD_WIDTH - 2));
      const cy = Math.floor(this.p.random(8, 11));
      
      for (let dy = -size; dy <= size; dy++) {
        for (let dx = -size; dx <= size; dx++) {
          if (this.p.random() > 0.5 && this.isValidPosition(cx + dx, cy + dy)) {
            this.blocks[cy + dy][cx + dx].type = blockType;
          }
        }
      }
    }
  }

  isValidPosition(x, y) {
    return x >= 0 && x < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT;
  }

  getBlock(x, y) {
    if (!this.isValidPosition(x, y)) return null;
    return this.blocks[y][x];
  }

  setBlock(x, y, type) {
    if (!this.isValidPosition(x, y)) return false;
    this.blocks[y][x].type = type;
    return true;
  }

  isSolid(x, y) {
    const block = this.getBlock(x, y);
    return block && block.type !== BLOCK_EMPTY;
  }

  breakBlock(x, y) {
    const block = this.getBlock(x, y);
    if (!block || block.type === BLOCK_EMPTY) return null;
    
    const material = this.blockToMaterial(block.type);
    this.setBlock(x, y, BLOCK_EMPTY);
    return material;
  }

  blockToMaterial(blockType) {
    switch (blockType) {
      case BLOCK_GRASS:
      case BLOCK_DIRT:
        return "dirt";
      case BLOCK_STONE:
        return "stone";
      case BLOCK_WOOD:
        return "wood";
      default:
        return null;
    }
  }
}