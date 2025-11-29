/**
 * Physics and collision detection systems
 */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';

/**
 * Update all physics entities
 */
export function updatePhysics(deltaTime) {
  // Update all entities with physics
  if (gameState.player) {
    gameState.player.update(deltaTime);
  }
  
  gameState.enemies.forEach(enemy => enemy.update(deltaTime));
  gameState.projectiles.forEach(projectile => projectile.update(deltaTime));
  gameState.items.forEach(item => item.update(deltaTime));
  gameState.particles.forEach(particle => particle.update(deltaTime));
  
  if (gameState.teleporter) {
    gameState.teleporter.update(deltaTime);
  }
}

/**
 * Handle all collisions
 */
export function handleCollisions() {
  // Player-Enemy collisions
  if (gameState.player) {
    for (const enemy of gameState.enemies) {
      if (checkSphereCollision(gameState.player.mesh.position, 0.8, enemy.mesh.position, 0.8)) {
        // Damage player
        if (gameState.player.invulnerableTime <= 0) {
          gameState.player.takeDamage(enemy.damage * 0.1); // Continuous damage
        }
        
        // Push enemy away (player is immovable)
        const pushDirection = new THREE.Vector3()
          .subVectors(enemy.mesh.position, gameState.player.mesh.position)
          .normalize()
          .multiplyScalar(0.15);
        enemy.mesh.position.add(pushDirection);
      }
    }
  }
}

/**
 * Check sphere-sphere collision
 */
export function checkSphereCollision(pos1, radius1, pos2, radius2) {
  const distance = pos1.distanceTo(pos2);
  return distance < (radius1 + radius2);
}

/**
 * Check AABB collision
 */
export function checkAABBCollision(box1Min, box1Max, box2Min, box2Max) {
  return (
    box1Min.x <= box2Max.x && box1Max.x >= box2Min.x &&
    box1Min.y <= box2Max.y && box1Max.y >= box2Min.y &&
    box1Min.z <= box2Max.z && box1Max.z >= box2Min.z
  );
}

/**
 * Spatial grid for optimization
 */
export class SpatialGrid {
  constructor(cellSize) {
    this.cellSize = cellSize;
    this.grid = new Map();
  }
  
  getCellKey(x, z) {
    const cellX = Math.floor(x / this.cellSize);
    const cellZ = Math.floor(z / this.cellSize);
    return `${cellX},${cellZ}`;
  }
  
  insert(entity) {
    const key = this.getCellKey(entity.mesh.position.x, entity.mesh.position.z);
    if (!this.grid.has(key)) {
      this.grid.set(key, []);
    }
    this.grid.get(key).push(entity);
  }
  
  getNearby(position, radius) {
    const nearby = [];
    const cellRadius = Math.ceil(radius / this.cellSize);
    const centerKey = this.getCellKey(position.x, position.z);
    const [cx, cz] = centerKey.split(',').map(Number);
    
    for (let dx = -cellRadius; dx <= cellRadius; dx++) {
      for (let dz = -cellRadius; dz <= cellRadius; dz++) {
        const key = `${cx + dx},${cz + dz}`;
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