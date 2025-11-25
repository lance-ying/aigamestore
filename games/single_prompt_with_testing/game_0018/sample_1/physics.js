import { gameState } from './globals.js';

export function checkAABBCollision(box1, box2) {
  return (
    box1.min.x <= box2.max.x && box1.max.x >= box2.min.x &&
    box1.min.y <= box2.max.y && box1.max.y >= box2.min.y &&
    box1.min.z <= box2.max.z && box1.max.z >= box2.min.z
  );
}

export function handleCollisions() {
  if (!gameState.player || !gameState.player.isAlive) return;
  
  const playerBox = gameState.player.getBoundingBox();
  
  // Check obstacles
  for (const obstacle of gameState.obstacles) {
    if (!obstacle.active) continue;
    
    const obstacleBox = obstacle.getBoundingBox();
    
    if (checkAABBCollision(playerBox, obstacleBox)) {
      // Check if player can avoid
      if (obstacle.type === 'low' && gameState.player.isJumping) {
        // Successfully jumped over
        continue;
      }
      if (obstacle.type === 'high' && gameState.player.isSliding) {
        // Successfully slid under
        continue;
      }
      
      // Collision! Game over
      gameState.player.die();
      
      window.logs.game_info.push({
        game_status: "GAME_OVER_LOSE",
        data: { 
          score: gameState.score,
          distance: gameState.distance,
          coins: gameState.coins_collected
        },
        framecount: gameState.frameCount,
        timestamp: Date.now()
      });
      
      return;
    }
  }
}

export function updatePhysics(deltaTime) {
  // Update all entities with physics
  if (gameState.player) {
    gameState.player.update(deltaTime);
  }
  
  for (const obstacle of gameState.obstacles) {
    obstacle.update(deltaTime);
  }
  
  for (const coin of gameState.coins) {
    coin.update(deltaTime);
  }
  
  // Update track animation
  if (gameState.track) {
    gameState.track.update(deltaTime);
  }
  
  // Update distance
  gameState.distance += gameState.speed * deltaTime * 10;
  gameState.score = Math.floor(gameState.distance);
}