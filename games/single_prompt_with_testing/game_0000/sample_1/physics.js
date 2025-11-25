// physics.js - Physics and collision detection

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function applyGravity(entity) {
  if (!entity.ignoreGravity) {
    entity.vy += gameState.gravity;
  }
}

export function applyFriction(entity) {
  if (entity.onGround) {
    entity.vx *= gameState.friction;
  } else {
    entity.vx *= gameState.airResistance;
  }
}

export function checkAABBCollision(box1, box2) {
  return (
    box1.x < box2.x + box2.width &&
    box1.x + box1.width > box2.x &&
    box1.y < box2.y + box2.height &&
    box1.y + box1.height > box2.y
  );
}

export function checkCircleCollision(c1, c2) {
  const dx = c2.x - c1.x;
  const dy = c2.y - c1.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < (c1.radius + c2.radius);
}

export function checkPlatformCollision(entity, platform) {
  // Check if entity is falling onto platform from above
  if (entity.vy >= 0) {
    const entityBottom = entity.y + entity.height / 2;
    const platformTop = platform.y;
    
    if (entityBottom >= platformTop && 
        entityBottom <= platformTop + Math.abs(entity.vy) + 5 &&
        entity.x + entity.width / 2 > platform.x &&
        entity.x - entity.width / 2 < platform.x + platform.width) {
      return true;
    }
  }
  return false;
}

export function resolveCollision(entity1, entity2) {
  const dx = entity2.x - entity1.x;
  const dy = entity2.y - entity1.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  if (distance === 0) return;
  
  const normalX = dx / distance;
  const normalY = dy / distance;
  
  const overlap = (entity1.radius + entity2.radius) - distance;
  const separationX = normalX * overlap * 0.5;
  const separationY = normalY * overlap * 0.5;
  
  entity1.x -= separationX;
  entity1.y -= separationY;
  entity2.x += separationX;
  entity2.y += separationY;
}

export class SpatialGrid {
  constructor(cellSize) {
    this.cellSize = cellSize;
    this.grid = new Map();
  }
  
  getCellKey(x, y) {
    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);
    return `${cellX},${cellY}`;
  }
  
  insert(entity) {
    const key = this.getCellKey(entity.x, entity.y);
    if (!this.grid.has(key)) {
      this.grid.set(key, []);
    }
    this.grid.get(key).push(entity);
  }
  
  getNearbyEntities(entity) {
    const nearby = [];
    const radius = 2;
    
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        const key = this.getCellKey(
          entity.x + dx * this.cellSize,
          entity.y + dy * this.cellSize
        );
        
        if (this.grid.has(key)) {
          nearby.push(...this.grid.get(key));
        }
      }
    }
    
    return nearby;
  }
  
  clear() {
    this.grid.clear();
  }
}