// collision.js - Collision detection
import { gameState, COIN_VALUE, logs } from './globals.js';

export function checkCollisions() {
  if (!gameState.player || gameState.gamePhase !== 'PLAYING') return;

  const playerBox = gameState.player.getBoundingBox();
  
  // Check obstacle collisions
  for (let i = gameState.obstacles.length - 1; i >= 0; i--) {
    const obstacle = gameState.obstacles[i];
    
    // Only check obstacles near the player
    if (Math.abs(obstacle.mesh.position.z - gameState.player.mesh.position.z) > 3) continue;
    
    const obstacleBox = obstacle.getBoundingBox();
    
    if (playerBox.intersectsBox(obstacleBox)) {
      // Collision detected - game over
      gameState.gamePhase = 'GAME_OVER_LOSE';
      logs.game_info.push({
        game_status: 'GAME_OVER_LOSE',
        data: { score: gameState.score, distance: Math.floor(gameState.distance) },
        framecount: gameState.frameCount,
        timestamp: Date.now()
      });
      return;
    }
  }
  
  // Check coin collisions
  for (let i = gameState.coins.length - 1; i >= 0; i--) {
    const coin = gameState.coins[i];
    
    if (coin.collected) continue;
    
    // Only check coins near the player
    if (Math.abs(coin.mesh.position.z - gameState.player.mesh.position.z) > 2) continue;
    
    const coinBox = coin.getBoundingBox();
    
    if (playerBox.intersectsBox(coinBox)) {
      // Coin collected
      coin.collected = true;
      coin.mesh.visible = false;
      gameState.score += COIN_VALUE;
    }
  }
}