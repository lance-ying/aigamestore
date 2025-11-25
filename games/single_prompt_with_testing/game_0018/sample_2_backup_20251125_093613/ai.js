import { gameState } from './globals.js';

export function updateAI() {
  if (gameState.controlMode === "HUMAN" || !gameState.player) return;
  
  if (gameState.controlMode === "TEST_1") {
    testBasicMovement();
  } else if (gameState.controlMode === "TEST_2") {
    testWinCondition();
  }
}

function testBasicMovement() {
  if (!gameState.player) return;
  
  const frameCount = gameState.frameCount;
  
  // Test lane switching
  if (frameCount % 120 === 0) {
    gameState.player.moveLeft();
  } else if (frameCount % 120 === 60) {
    gameState.player.moveRight();
  }
  
  // Look for nearby obstacles
  for (const obstacle of gameState.obstacles) {
    const zDistance = obstacle.mesh.position.z - gameState.player.mesh.position.z;
    
    if (zDistance > -5 && zDistance < 2) {
      const sameLane = Math.abs(obstacle.mesh.position.x - gameState.player.mesh.position.x) < 1;
      
      if (sameLane) {
        if (obstacle.type === "barrier") {
          gameState.player.jump();
        } else if (obstacle.type === "overhead") {
          gameState.player.slide();
        } else if (obstacle.type === "train") {
          // Try to avoid train
          if (gameState.player.targetLane === 0) {
            gameState.player.moveRight();
          } else if (gameState.player.targetLane === 2) {
            gameState.player.moveLeft();
          } else {
            if (Math.random() < 0.5) {
              gameState.player.moveLeft();
            } else {
              gameState.player.moveRight();
            }
          }
        }
      }
    }
  }
}

function testWinCondition() {
  if (!gameState.player) return;
  
  // Aggressively collect coins and avoid obstacles
  let nearestCoin = null;
  let nearestDistance = Infinity;
  
  for (const coin of gameState.coins) {
    if (coin.collected) continue;
    
    const zDistance = coin.mesh.position.z - gameState.player.mesh.position.z;
    if (zDistance < 0 && zDistance > -20) {
      if (Math.abs(zDistance) < nearestDistance) {
        nearestDistance = Math.abs(zDistance);
        nearestCoin = coin;
      }
    }
  }
  
  // Move towards nearest coin
  if (nearestCoin) {
    const coinLane = nearestCoin.lane;
    if (gameState.player.targetLane < coinLane) {
      gameState.player.moveRight();
    } else if (gameState.player.targetLane > coinLane) {
      gameState.player.moveLeft();
    }
  }
  
  // Avoid obstacles
  for (const obstacle of gameState.obstacles) {
    const zDistance = obstacle.mesh.position.z - gameState.player.mesh.position.z;
    
    if (zDistance > -5 && zDistance < 2) {
      const sameLane = Math.abs(obstacle.mesh.position.x - gameState.player.mesh.position.x) < 1;
      
      if (sameLane) {
        if (obstacle.type === "barrier") {
          gameState.player.jump();
        } else if (obstacle.type === "overhead") {
          gameState.player.slide();
        } else if (obstacle.type === "train") {
          // Emergency lane change
          if (gameState.player.targetLane === 0) {
            gameState.player.moveRight();
          } else if (gameState.player.targetLane === 2) {
            gameState.player.moveLeft();
          } else {
            gameState.player.moveLeft();
          }
        }
      }
    }
  }
}