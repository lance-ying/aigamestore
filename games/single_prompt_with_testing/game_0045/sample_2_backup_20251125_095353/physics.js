// physics.js - Physics and collision handling
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';

// Update physics for all entities
export function updatePhysics(deltaTime) {
  // Update player physics
  if (gameState.player) {
    gameState.player.update(deltaTime);
    
    // Check if player fell off the world
    if (gameState.player.mesh.position.y < -10) {
      respawnPlayer();
    }
  }
  
  // Update enemies
  gameState.enemies.forEach(enemy => enemy.update(deltaTime));
  
  // Update collectibles
  gameState.collectibles.forEach(collectible => collectible.update(deltaTime));
  
  // Update projectiles
  gameState.projectiles.forEach(projectile => projectile.update(deltaTime));
  
  // Update goal portal
  if (gameState.goalPortal) {
    gameState.goalPortal.update(deltaTime);
  }
}

// Respawn player at spawn position
export function respawnPlayer() {
  if (gameState.player && !gameState.isRespawning) {
    gameState.isRespawning = true;
    gameState.player.mesh.position.copy(gameState.spawnPosition);
    gameState.player.velocity.set(0, 0, 0);
    gameState.player.acceleration.set(0, 0, 0);
    
    // Reset respawn flag after a short delay
    setTimeout(() => {
      gameState.isRespawning = false;
    }, 100);
  }
}

// Check AABB collision between two boxes
export function checkAABBCollision(box1Pos, box1Size, box2Pos, box2Size) {
  const box1Min = new THREE.Vector3(
    box1Pos.x - box1Size.x / 2,
    box1Pos.y - box1Size.y / 2,
    box1Pos.z - box1Size.z / 2
  );
  const box1Max = new THREE.Vector3(
    box1Pos.x + box1Size.x / 2,
    box1Pos.y + box1Size.y / 2,
    box1Pos.z + box1Size.z / 2
  );
  
  const box2Min = new THREE.Vector3(
    box2Pos.x - box2Size.x / 2,
    box2Pos.y - box2Size.y / 2,
    box2Pos.z - box2Size.z / 2
  );
  const box2Max = new THREE.Vector3(
    box2Pos.x + box2Size.x / 2,
    box2Pos.y + box2Size.y / 2,
    box2Pos.z + box2Size.z / 2
  );
  
  return (
    box1Min.x <= box2Max.x && box1Max.x >= box2Min.x &&
    box1Min.y <= box2Max.y && box1Max.y >= box2Min.y &&
    box1Min.z <= box2Max.z && box1Max.z >= box2Min.z
  );
}

// Check sphere collision
export function checkSphereCollision(pos1, radius1, pos2, radius2) {
  const distance = pos1.distanceTo(pos2);
  return distance < (radius1 + radius2);
}

// Handle all collision detection and response
export function handleCollisions() {
  // Platform collisions are handled in entity updates
  // This function can be extended for more complex collision handling
}