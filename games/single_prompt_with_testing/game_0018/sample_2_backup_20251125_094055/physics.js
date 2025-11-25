import { gameState } from './globals.js';

export function checkCollision(bounds1, bounds2) {
  return (
    Math.abs(bounds1.x - bounds2.x) < (bounds1.width + bounds2.width) / 2 &&
    Math.abs(bounds1.y - bounds2.y) < (bounds1.height + bounds2.height) / 2 &&
    Math.abs(bounds1.z - bounds2.z) < (bounds1.depth + bounds2.depth) / 2
  );
}

export function handleCollisions() {
  if (!gameState.player) return;
  
  const playerBounds = gameState.player.getBounds();
  
  // Check obstacle collisions
  for (const obstacle of gameState.obstacles) {
    const obstacleBounds = obstacle.getBounds();
    
    // Only check obstacles near player's Z position
    if (Math.abs(obstacleBounds.z - playerBounds.z) > 5) continue;
    
    if (checkCollision(playerBounds, obstacleBounds)) {
      // Check if player can avoid collision
      if (obstacle.type === "train") {
        // Train collision - always fatal
        handleGameOver();
        return;
      } else if (obstacle.type === "barrier") {
        // Low barrier - must jump
        if (gameState.player.state !== "jumping" || gameState.player.jumpHeight < 0.5) {
          handleGameOver();
          return;
        }
      } else if (obstacle.type === "overhead") {
        // Overhead barrier - must slide
        if (gameState.player.state !== "sliding") {
          handleGameOver();
          return;
        }
      }
    }
  }
}

function handleGameOver() {
  gameState.gamePhase = "GAME_OVER_LOSE";
  
  if (window.logs && window.logs.game_info) {
    window.logs.game_info.push({
      game_status: "GAME_OVER_LOSE",
      data: { 
        score: gameState.score,
        distance: Math.floor(gameState.distance)
      },
      framecount: gameState.frameCount,
      timestamp: Date.now()
    });
  }
}

export function updateWorldScroll(deltaTime) {
  const scrollSpeed = gameState.currentSpeed;
  
  // Update all obstacles
  for (let i = gameState.obstacles.length - 1; i >= 0; i--) {
    const obstacle = gameState.obstacles[i];
    obstacle.mesh.position.z += scrollSpeed;
    
    // Remove obstacles that passed the player
    if (obstacle.mesh.position.z > 10) {
      obstacle.destroy();
      gameState.obstacles.splice(i, 1);
    }
  }
  
  // Update all coins
  for (let i = gameState.coins.length - 1; i >= 0; i--) {
    const coin = gameState.coins[i];
    coin.mesh.position.z += scrollSpeed;
    
    // Remove coins that passed the player
    if (coin.mesh.position.z > 10) {
      coin.destroy();
      gameState.coins.splice(i, 1);
    }
  }
  
  // Update track segments
  for (let i = gameState.trackSegments.length - 1; i >= 0; i--) {
    const segment = gameState.trackSegments[i];
    segment.mesh.position.z += scrollSpeed;
    
    if (segment.mesh.position.z > 15) {
      segment.destroy();
      gameState.trackSegments.splice(i, 1);
    }
  }
  
  // Update tunnel segments
  for (let i = gameState.tunnelSegments.length - 1; i >= 0; i--) {
    const segment = gameState.tunnelSegments[i];
    segment.mesh.position.z += scrollSpeed;
    
    if (segment.mesh.position.z > 15) {
      segment.destroy();
      gameState.tunnelSegments.splice(i, 1);
    }
  }
  
  // Update distance
  gameState.distance += scrollSpeed;
}