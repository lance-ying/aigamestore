import { gameState, DESPAWN_DISTANCE } from './globals.js';

export function updatePhysics(deltaTime) {
  // Update player physics
  if (gameState.player) {
    gameState.player.update(deltaTime);
  }
  
  // Update obstacles
  for (let i = gameState.obstacles.length - 1; i >= 0; i--) {
    const obstacle = gameState.obstacles[i];
    obstacle.update(deltaTime);
    
    // Remove if past player
    if (obstacle.mesh.position.z < DESPAWN_DISTANCE) {
      obstacle.destroy();
      gameState.obstacles.splice(i, 1);
      gameState.distance += 1;
    }
  }
  
  // Update coins
  for (let i = gameState.coins.length - 1; i >= 0; i--) {
    const coin = gameState.coins[i];
    coin.update(deltaTime);
    
    // Remove if past player
    if (coin.mesh.position.z < DESPAWN_DISTANCE) {
      coin.destroy();
      gameState.coins.splice(i, 1);
    }
  }
  
  // Update track sections
  for (let i = gameState.trackSections.length - 1; i >= 0; i--) {
    const section = gameState.trackSections[i];
    section.update(deltaTime);
    
    // Remove if past player
    if (section.mesh.position.z < DESPAWN_DISTANCE - 20) {
      section.destroy();
      gameState.trackSections.splice(i, 1);
    }
  }
}

export function handleCollisions() {
  if (!gameState.player) return;
  
  const playerBox = gameState.player.boundingBox;
  
  // Check collision with obstacles
  for (const obstacle of gameState.obstacles) {
    if (playerBox.intersectsBox(obstacle.boundingBox)) {
      // Check if player can avoid
      if (obstacle.type === 'low_barrier' && gameState.player.isJumping) {
        continue; // Player jumped over
      }
      if (obstacle.type === 'high_barrier' && gameState.player.isSliding) {
        continue; // Player slid under
      }
      
      // Collision detected
      gameState.player.takeDamage();
      return;
    }
  }
  
  // Check collision with coins
  for (let i = gameState.coins.length - 1; i >= 0; i--) {
    const coin = gameState.coins[i];
    if (playerBox.intersectsBox(coin.boundingBox)) {
      coin.collect();
      gameState.coins.splice(i, 1);
    }
  }
}