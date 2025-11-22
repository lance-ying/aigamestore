// automated_testing_controller.js - Automated testing functions

import { gameState } from './globals.js';
import { CANVAS_HEIGHT, GROUND_HEIGHT, EGG_SIZE } from './globals.js';

let lastActionFrame = 0;
let consecutiveNoActions = 0;

function getTestWinAction(gameState) {
  const p = window.gameInstance;
  if (!p || !gameState.player) return null;

  const player = gameState.player;
  const currentFrame = p.frameCount;
  
  // Prevent too frequent actions
  if (currentFrame - lastActionFrame < 5) {
    return null;
  }

  // Find nearest obstacle
  let nearestObstacle = null;
  let minDistance = Infinity;
  
  for (let obstacle of gameState.obstacles) {
    const distance = obstacle.x - player.x;
    if (distance > 0 && distance < minDistance) {
      minDistance = distance;
      nearestObstacle = obstacle;
    }
  }

  // Decision making
  const groundY = CANVAS_HEIGHT - GROUND_HEIGHT;
  const playerBottom = player.y + player.size/2 + player.getStackHeight();
  const distanceToGround = groundY - playerBottom;
  
  // Emergency: too high, falling
  if (player.y < 50) {
    consecutiveNoActions++;
    return null;
  }
  
  // Emergency: too low and no obstacle coming
  if (playerBottom > groundY - 20 && (!nearestObstacle || minDistance > 200)) {
    lastActionFrame = currentFrame;
    consecutiveNoActions = 0;
    return 32; // SPACE - jump
  }

  if (nearestObstacle) {
    const obstacleHeight = nearestObstacle.height * EGG_SIZE;
    const requiredHeight = nearestObstacle.isGap ? EGG_SIZE * 2 : obstacleHeight + EGG_SIZE;
    const currentStackHeight = player.getStackHeight();
    
    // Approaching obstacle
    if (minDistance < 150) {
      // Need more height to clear obstacle
      if (currentStackHeight < requiredHeight) {
        lastActionFrame = currentFrame;
        consecutiveNoActions = 0;
        return 32; // SPACE - build stack
      }
      
      // About to hit obstacle from below - jump
      if (minDistance < 80 && playerBottom > groundY - obstacleHeight - player.size) {
        lastActionFrame = currentFrame;
        consecutiveNoActions = 0;
        return 32; // SPACE - jump
      }
    }
  }
  
  // Try to maintain moderate altitude and land on ground periodically
  const targetY = groundY - 40;
  
  // Try for perfect landings
  if (gameState.perfectLandings < 3 && !gameState.feverMode) {
    if (distanceToGround > 5 && distanceToGround < 100) {
      if (player.vy > 0 && (!nearestObstacle || minDistance > 120)) {
        // Let it fall for perfect landing
        consecutiveNoActions++;
        return null;
      }
    }
  }
  
  // Maintain altitude
  if (playerBottom > targetY + 50) {
    lastActionFrame = currentFrame;
    consecutiveNoActions = 0;
    return 32; // SPACE - maintain height
  }

  consecutiveNoActions++;
  return null;
}

function getBasicTestAction(gameState) {
  const p = window.gameInstance;
  if (!p || !gameState.player) return null;

  const player = gameState.player;
  const groundY = CANVAS_HEIGHT - GROUND_HEIGHT;
  const playerBottom = player.y + player.size/2 + player.getStackHeight();
  
  // Simple strategy: jump periodically to maintain altitude
  if (playerBottom > groundY - 60) {
    if (p.frameCount % 30 === 0) {
      return 32; // SPACE
    }
  }
  
  return null;
}

function getRandomAction(gameState) {
  const p = window.gameInstance;
  if (!p) return null;
  
  // Random jumps
  if (p.random() < 0.05) {
    return 32; // SPACE
  }
  
  return null;
}

export function get_automated_testing_action(gameState) {
  if (!gameState || gameState.gamePhase !== "PLAYING") {
    return null;
  }

  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

// Expose globally
window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;