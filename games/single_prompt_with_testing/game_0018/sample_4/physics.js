import { gameState } from './globals.js';

export function checkAABBCollision(bounds1, bounds2) {
  return (
    bounds1.min.x <= bounds2.max.x && bounds1.max.x >= bounds2.min.x &&
    bounds1.min.y <= bounds2.max.y && bounds1.max.y >= bounds2.min.y &&
    bounds1.min.z <= bounds2.max.z && bounds1.max.z >= bounds2.min.z
  );
}

export function handleCollisions() {
  if (!gameState.player) return;
  
  const playerBounds = gameState.player.getBounds();
  
  // Check obstacle collisions
  for (const obstacle of gameState.obstacles) {
    const obstacleBounds = obstacle.getBounds();
    
    if (checkAABBCollision(playerBounds, obstacleBounds)) {
      // Check if it's a barrier and player is jumping/sliding appropriately
      if (obstacle.type === 'barrier_low' && gameState.player.isJumping) {
        continue; // Player jumped over low barrier
      }
      if (obstacle.type === 'barrier_high' && gameState.player.isSliding) {
        continue; // Player slid under high barrier
      }
      
      // Collision with train or improper barrier handling
      gameState.player.takeDamage();
      return;
    }
  }
  
  // Check coin collisions
  for (let i = gameState.coins.length - 1; i >= 0; i--) {
    const coin = gameState.coins[i];
    if (coin.collected) continue;
    
    const coinBounds = {
      min: new THREE.Vector3(
        coin.mesh.position.x - 0.4,
        coin.mesh.position.y - 0.4,
        coin.mesh.position.z - 0.4
      ),
      max: new THREE.Vector3(
        coin.mesh.position.x + 0.4,
        coin.mesh.position.y + 0.4,
        coin.mesh.position.z + 0.4
      )
    };
    
    if (checkAABBCollision(playerBounds, coinBounds)) {
      coin.collect();
      coin.destroy();
      gameState.coins.splice(i, 1);
    }
  }
}