// physics.js - Physics and collision detection
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';

export function updatePhysics(deltaTime) {
  // Physics is handled within entity update methods
  // This function handles global physics interactions
}

export function handleCollisions() {
  if (!gameState.player) return;
  
  const player = gameState.player;
  
  // Check collisions with obstacles
  for (const obstacle of gameState.obstacles) {
    const distance = player.mesh.position.distanceTo(obstacle.position || obstacle.mesh.position);
    const collisionDistance = player.radius + obstacle.radius;
    
    if (distance < collisionDistance) {
      player.handleCollision(obstacle);
      break; // Handle one collision per frame
    }
  }
  
  // Check boundary collisions
  const boundary = 95;
  if (Math.abs(player.mesh.position.x) > boundary) {
    player.mesh.position.x = Math.sign(player.mesh.position.x) * boundary;
    player.velocity.x = -player.velocity.x * 0.5;
  }
  if (Math.abs(player.mesh.position.z) > boundary) {
    player.mesh.position.z = Math.sign(player.mesh.position.z) * boundary;
    player.velocity.z = -player.velocity.z * 0.5;
  }
}

export class SpatialGrid {
  constructor(cellSize = 20) {
    this.cellSize = cellSize;
    this.grid = new Map();
  }
  
  getCellKey(x, z) {
    const cellX = Math.floor(x / this.cellSize);
    const cellZ = Math.floor(z / this.cellSize);
    return `${cellX},${cellZ}`;
  }
  
  insert(entity) {
    const key = this.getCellKey(
      entity.mesh.position.x,
      entity.mesh.position.z
    );
    
    if (!this.grid.has(key)) {
      this.grid.set(key, []);
    }
    this.grid.get(key).push(entity);
  }
  
  getNearbyEntities(entity, radius = 1) {
    const nearby = [];
    const cellRadius = Math.ceil(radius);
    
    for (let dx = -cellRadius; dx <= cellRadius; dx++) {
      for (let dz = -cellRadius; dz <= cellRadius; dz++) {
        const key = this.getCellKey(
          entity.mesh.position.x + dx * this.cellSize,
          entity.mesh.position.z + dz * this.cellSize
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