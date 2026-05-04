// testing.js - Automated testing support
import { gameState, GAME_PHASES } from './globals.js';

export function getTestAction(p) {
  if (gameState.controlMode === "HUMAN") {
    return null;
  }
  
  const player = gameState.player;
  if (!player) return null;
  
  if (gameState.controlMode === "TEST_1") {
    return getBasicTestAction(p, player);
  } else if (gameState.controlMode === "TEST_2") {
    return getWinTestAction(p, player);
  }
  
  return null;
}

function getBasicTestAction(p, player) {
  // Basic testing: avoid obvious obstacles, collect coins
  const frameCount = p.frameCount;
  
  // Check for upcoming obstacles in current lane
  let needToMove = false;
  let moveLeft = false;
  
  for (const obstacle of gameState.obstacles) {
    if (!obstacle.active) continue;
    if (obstacle.z > 100 && obstacle.z < 800) {
      if (obstacle.lanes.includes(player.currentLaneIndex)) {
        needToMove = true;
        
        // Try to move to a safe lane
        if (player.currentLaneIndex > 0 && !obstacle.lanes.includes(player.currentLaneIndex - 1)) {
          moveLeft = true;
        } else if (player.currentLaneIndex < 2 && !obstacle.lanes.includes(player.currentLaneIndex + 1)) {
          moveLeft = false;
        }
        
        // Handle jump/slide obstacles
        if (obstacle.type === 'jump' && obstacle.z < 400) {
          return { action: 'jump' };
        } else if (obstacle.type === 'slide' && obstacle.z < 400) {
          return { action: 'slide' };
        }
        break;
      }
    }
  }
  
  if (needToMove && frameCount % 15 === 0) {
    return { action: moveLeft ? 'left' : 'right' };
  }
  
  // Occasionally move to collect coins
  if (frameCount % 90 === 0 && !needToMove) {
    const targetLane = p.floor(p.random(0, 3));
    if (targetLane < player.currentLaneIndex) {
      return { action: 'left' };
    } else if (targetLane > player.currentLaneIndex) {
      return { action: 'right' };
    }
  }
  
  return null;
}

function getWinTestAction(p, player) {
  // Advanced AI to try to win the game
  const frameCount = p.frameCount;
  
  // Find nearest obstacle in each lane
  const laneObstacles = [null, null, null];
  for (const obstacle of gameState.obstacles) {
    if (!obstacle.active || obstacle.z < 0 || obstacle.z > 1000) continue;
    
    for (const lane of obstacle.lanes) {
      if (!laneObstacles[lane] || obstacle.z < laneObstacles[lane].z) {
        laneObstacles[lane] = obstacle;
      }
    }
  }
  
  // Check current lane for obstacles
  const currentObstacle = laneObstacles[player.currentLaneIndex];
  
  if (currentObstacle && currentObstacle.z < 600) {
    // Handle obstacle based on type
    if (currentObstacle.type === 'jump' && currentObstacle.z < 300 && !player.isJumping) {
      return { action: 'jump' };
    } else if (currentObstacle.type === 'slide' && currentObstacle.z < 300 && !player.isSliding) {
      return { action: 'slide' };
    } else if (currentObstacle.type === 'train' && currentObstacle.z < 500) {
      // Try to switch lanes
      if (player.currentLaneIndex > 0 && !laneObstacles[player.currentLaneIndex - 1]) {
        return { action: 'left' };
      } else if (player.currentLaneIndex < 2 && !laneObstacles[player.currentLaneIndex + 1]) {
        return { action: 'right' };
      } else if (player.currentLaneIndex > 0) {
        return { action: 'left' };
      } else if (player.currentLaneIndex < 2) {
        return { action: 'right' };
      }
    }
  }
  
  // Try to collect coins and powerups
  let bestLane = player.currentLaneIndex;
  let bestScore = 0;
  
  for (let lane = 0; lane < 3; lane++) {
    let score = 0;
    
    // Count coins in lane
    for (const coin of gameState.coins) {
      if (coin.active && !coin.collected && coin.lane === lane && coin.z < 800 && coin.z > 0) {
        score += 1;
      }
    }
    
    // Powerups are more valuable
    for (const powerup of gameState.powerups) {
      if (powerup.active && !powerup.collected && powerup.lane === lane && powerup.z < 800 && powerup.z > 0) {
        score += 5;
      }
    }
    
    // Penalize if obstacle in lane
    if (laneObstacles[lane] && laneObstacles[lane].z < 600) {
      score -= 10;
    }
    
    if (score > bestScore) {
      bestScore = score;
      bestLane = lane;
    }
  }
  
  // Move towards best lane
  if (bestLane < player.currentLaneIndex && frameCount % 10 === 0) {
    return { action: 'left' };
  } else if (bestLane > player.currentLaneIndex && frameCount % 10 === 0) {
    return { action: 'right' };
  }
  
  return null;
}

export function executeTestAction(p, player, action) {
  if (!action) return;
  
  switch (action.action) {
    case 'left':
      player.moveLeft();
      p.logs.inputs.push({
        input_type: "test_action",
        data: { action: "left" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      break;
    case 'right':
      player.moveRight();
      p.logs.inputs.push({
        input_type: "test_action",
        data: { action: "right" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      break;
    case 'jump':
      player.jump();
      p.logs.inputs.push({
        input_type: "test_action",
        data: { action: "jump" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      break;
    case 'slide':
      player.slide();
      p.logs.inputs.push({
        input_type: "test_action",
        data: { action: "slide" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      break;
  }
}