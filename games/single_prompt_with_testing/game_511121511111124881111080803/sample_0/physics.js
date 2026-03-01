// physics.js - Physics and collision detection systems

import { gameState, distanceBetween, GAME_CONSTANTS } from './globals.js';

// ============================================================================
// COLLISION DETECTION
// ============================================================================

export function checkCircleCollision(entity1, entity2) {
  const distance = distanceBetween(entity1.x, entity1.y, entity2.x, entity2.y);
  return distance < (entity1.size + entity2.size);
}

export function checkPointInCircle(px, py, circle) {
  const distance = distanceBetween(px, py, circle.x, circle.y);
  return distance < circle.size;
}

export function checkAABBCollision(box1, box2) {
  return (
    box1.x < box2.x + box2.width &&
    box1.x + box1.width > box2.x &&
    box1.y < box2.y + box2.height &&
    box1.y + box1.height > box2.y
  );
}

// ============================================================================
// SPATIAL PARTITIONING (for optimization)
// ============================================================================

export class SpatialGrid {
  constructor(cellSize = 50) {
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
  
  getNearbyEntities(entity, radius = 1) {
    const nearby = [];
    const centerX = Math.floor(entity.x / this.cellSize);
    const centerY = Math.floor(entity.y / this.cellSize);
    
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        const key = `${centerX + dx},${centerY + dy}`;
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

// ============================================================================
// UTILITY PHYSICS FUNCTIONS
// ============================================================================

export function applyFriction(velocity, friction) {
  return velocity * friction;
}

export function limitSpeed(velocity, maxSpeed) {
  return Math.max(-maxSpeed, Math.min(maxSpeed, velocity));
}

export function normalizeVector(x, y) {
  const length = Math.sqrt(x * x + y * y);
  if (length === 0) return { x: 0, y: 0 };
  return { x: x / length, y: y / length };
}

export function dotProduct(x1, y1, x2, y2) {
  return x1 * x2 + y1 * y2;
}

export function reflectVector(vx, vy, nx, ny) {
  const dot = dotProduct(vx, vy, nx, ny);
  return {
    x: vx - 2 * dot * nx,
    y: vy - 2 * dot * ny
  };
}

export function rotateVector(x, y, angle) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: x * cos - y * sin,
    y: x * sin + y * cos
  };
}