import { gameState } from './globals.js';

export function updateAI() {
  if (!gameState.player) return;
  if (gameState.controlMode === "HUMAN") return;
  
  if (gameState.controlMode === "TEST_1") {
    // Basic testing: switch lanes and occasionally jump
    if (gameState.frameCount % 60 === 0) {
      const action = Math.floor(Math.random() * 4);
      if (action === 0) {
        gameState.player.switchLane(-1);
      } else if (action === 1) {
        gameState.player.switchLane(1);
      } else if (action === 2) {
        gameState.player.jump();
      }
    }
  } else if (gameState.controlMode === "TEST_2") {
    // Advanced AI: avoid obstacles and collect coins
    const lookAhead = 15;
    const playerLane = gameState.player.currentLane;
    
    // Check for obstacles ahead
    let obstaclesAhead = {0: [], 1: [], 2: []};
    
    for (const obstacle of gameState.obstacles) {
      const distance = gameState.player.mesh.position.z - obstacle.mesh.position.z;
      if (distance > 0 && distance < lookAhead) {
        obstaclesAhead[obstacle.lane].push({
          type: obstacle.type,
          distance: distance,
          z: obstacle.mesh.position.z
        });
      }
    }
    
    // Sort by distance
    for (let lane = 0; lane < 3; lane++) {
      obstaclesAhead[lane].sort((a, b) => a.distance - b.distance);
    }
    
    // Check current lane for obstacles
    if (obstaclesAhead[playerLane].length > 0) {
      const nearest = obstaclesAhead[playerLane][0];
      
      if (nearest.distance < 8) {
        // React to obstacle type
        if (nearest.type === 'barrier_low' && !gameState.player.isJumping) {
          gameState.player.jump();
        } else if (nearest.type === 'barrier_high' && !gameState.player.isSliding) {
          gameState.player.slide();
        } else if (nearest.type === 'train') {
          // Switch to safest lane
          let safestLane = playerLane;
          let minObstacles = obstaclesAhead[playerLane].length;
          
          for (let lane = 0; lane < 3; lane++) {
            if (obstaclesAhead[lane].length < minObstacles) {
              minObstacles = obstaclesAhead[lane].length;
              safestLane = lane;
            }
          }
          
          if (safestLane < playerLane) {
            gameState.player.switchLane(-1);
          } else if (safestLane > playerLane) {
            gameState.player.switchLane(1);
          }
        }
      }
    }
    
    // Collect coins if safe
    for (const coin of gameState.coins) {
      if (coin.collected) continue;
      const distance = gameState.player.mesh.position.z - coin.mesh.position.z;
      if (distance > 0 && distance < 10) {
        // Check if coin's lane is safe
        if (obstaclesAhead[coin.lane].length === 0 || obstaclesAhead[coin.lane][0].distance > 5) {
          if (coin.lane < playerLane) {
            gameState.player.switchLane(-1);
          } else if (coin.lane > playerLane) {
            gameState.player.switchLane(1);
          }
        }
      }
    }
  }
}