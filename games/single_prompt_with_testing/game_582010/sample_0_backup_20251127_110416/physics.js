/**
 * Physics and collision detection systems
 */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';

/**
 * Update physics for all entities
 */
export function updatePhysics(deltaTime) {
  // Physics is handled within entity update methods
  // This function is a placeholder for future physics system expansion
}

/**
 * Handle collisions between entities
 */
export function handleCollisions() {
  // Check player-monster collision
  if (gameState.player && gameState.monster && gameState.monsterRevealed) {
    const distance = gameState.player.mesh.position.distanceTo(gameState.monster.mesh.position);
    
    // Prevent overlap
    if (distance < 2.0) {
      const direction = new THREE.Vector3()
        .subVectors(gameState.player.mesh.position, gameState.monster.mesh.position)
        .normalize();
      
      const overlap = 2.0 - distance;
      gameState.player.mesh.position.add(direction.multiplyScalar(overlap * 0.5));
      gameState.monster.mesh.position.sub(direction.multiplyScalar(overlap * 0.5));
    }
  }
  
  // Check collisions with trees and rocks
  if (gameState.player) {
    checkTerrainCollisions(gameState.player);
  }
  if (gameState.monster) {
    checkTerrainCollisions(gameState.monster);
  }
}

/**
 * Check collisions with terrain obstacles
 */
function checkTerrainCollisions(entity) {
  const checkRadius = 1.5;
  
  // Check trees
  for (const tree of gameState.trees) {
    const distance = new THREE.Vector2(
      entity.mesh.position.x - tree.position.x,
      entity.mesh.position.z - tree.position.z
    ).length();
    
    if (distance < checkRadius) {
      const direction = new THREE.Vector2(
        entity.mesh.position.x - tree.position.x,
        entity.mesh.position.z - tree.position.z
      ).normalize();
      
      const overlap = checkRadius - distance;
      entity.mesh.position.x += direction.x * overlap;
      entity.mesh.position.z += direction.y * overlap;
    }
  }
  
  // Check rocks
  for (const rock of gameState.rocks) {
    const distance = new THREE.Vector2(
      entity.mesh.position.x - rock.position.x,
      entity.mesh.position.z - rock.position.z
    ).length();
    
    if (distance < checkRadius) {
      const direction = new THREE.Vector2(
        entity.mesh.position.x - rock.position.x,
        entity.mesh.position.z - rock.position.z
      ).normalize();
      
      const overlap = checkRadius - distance;
      entity.mesh.position.x += direction.x * overlap;
      entity.mesh.position.z += direction.y * overlap;
    }
  }
}

/**
 * Check if position is valid (not inside obstacles)
 */
export function isPositionValid(x, z, checkRadius = 1.5) {
  // Check trees
  for (const tree of gameState.trees) {
    const distance = new THREE.Vector2(x - tree.position.x, z - tree.position.z).length();
    if (distance < checkRadius) {
      return false;
    }
  }
  
  // Check rocks
  for (const rock of gameState.rocks) {
    const distance = new THREE.Vector2(x - rock.position.x, z - rock.position.z).length();
    if (distance < checkRadius) {
      return false;
    }
  }
  
  return true;
}