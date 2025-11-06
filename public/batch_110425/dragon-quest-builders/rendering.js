// rendering.js - World and entity rendering

import { TILE_SIZE, BLOCK_GRASS, BLOCK_DIRT, BLOCK_STONE, BLOCK_WOOD, BLOCK_EMPTY } from './globals.js';

export function renderWorld(p, world, cameraX, cameraY) {
  // Calculate visible tiles
  const startX = Math.floor(cameraX / TILE_SIZE);
  const endX = Math.ceil((cameraX + p.width) / TILE_SIZE);
  const startY = Math.floor(cameraY / TILE_SIZE);
  const endY = Math.ceil((cameraY + p.height) / TILE_SIZE);
  
  for (let y = Math.max(0, startY); y < Math.min(world.blocks.length, endY); y++) {
    for (let x = Math.max(0, startX); x < Math.min(world.blocks[0].length, endX); x++) {
      const block = world.blocks[y][x];
      if (block.type === BLOCK_EMPTY) continue;
      
      const screenX = x * TILE_SIZE - cameraX;
      const screenY = y * TILE_SIZE - cameraY;
      
      renderBlock(p, block.type, screenX, screenY);
    }
  }
}

function renderBlock(p, blockType, x, y) {
  p.push();
  
  switch (blockType) {
    case BLOCK_GRASS:
      // Grass block with green top
      p.fill(101, 67, 33);
      p.rect(x, y, TILE_SIZE, TILE_SIZE);
      p.fill(34, 139, 34);
      p.rect(x, y, TILE_SIZE, TILE_SIZE * 0.3);
      // Add texture
      p.stroke(80, 120, 80);
      for (let i = 0; i < 3; i++) {
        p.line(x + i * 12, y, x + i * 12, y + TILE_SIZE * 0.3);
      }
      p.noStroke();
      break;
      
    case BLOCK_DIRT:
      p.fill(101, 67, 33);
      p.rect(x, y, TILE_SIZE, TILE_SIZE);
      // Add dirt texture
      p.fill(85, 55, 25);
      for (let i = 0; i < 4; i++) {
        p.rect(x + (i % 2) * 20 + 5, y + Math.floor(i / 2) * 20 + 5, 8, 8);
      }
      break;
      
    case BLOCK_STONE:
      p.fill(128, 128, 128);
      p.rect(x, y, TILE_SIZE, TILE_SIZE);
      // Add stone texture
      p.fill(100, 100, 100);
      p.rect(x + 5, y + 5, 12, 12);
      p.rect(x + 25, y + 15, 10, 10);
      p.rect(x + 15, y + 25, 8, 8);
      break;
      
    case BLOCK_WOOD:
      p.fill(139, 90, 43);
      p.rect(x, y, TILE_SIZE, TILE_SIZE);
      // Add wood grain
      p.stroke(110, 70, 30);
      for (let i = 0; i < 5; i++) {
        p.line(x, y + i * 8, x + TILE_SIZE, y + i * 8);
      }
      p.noStroke();
      // Center darker spot
      p.fill(110, 70, 30);
      p.ellipse(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 8, 8);
      break;
  }
  
  // Block outline
  p.noFill();
  p.stroke(0, 0, 0, 100);
  p.rect(x, y, TILE_SIZE, TILE_SIZE);
  p.noStroke();
  
  p.pop();
}

export function renderEntities(p, entities, cameraX, cameraY) {
  // Sort entities by y position for proper layering
  const sorted = [...entities].sort((a, b) => a.y - b.y);
  
  for (const entity of sorted) {
    entity.render(p, cameraX, cameraY);
  }
}

export function renderBlockBreakingEffect(p, breakingBlock, breakProgress, cameraX, cameraY) {
  if (!breakingBlock || breakProgress <= 0) return;
  
  const x = breakingBlock.x * TILE_SIZE - cameraX;
  const y = breakingBlock.y * TILE_SIZE - cameraY;
  
  p.push();
  p.noFill();
  p.stroke(255, 255, 255, 200);
  p.strokeWeight(3);
  p.rect(x, y, TILE_SIZE, TILE_SIZE);
  
  // Crack effect
  p.stroke(0, 0, 0, 150);
  p.strokeWeight(2);
  const cracks = Math.floor(breakProgress * 5);
  for (let i = 0; i < cracks; i++) {
    p.line(x + 5 + i * 8, y, x + 5 + i * 8, y + TILE_SIZE);
  }
  
  p.pop();
}