// automated_testing_controller.js - Automated testing strategies

import { 
  CANVAS_WIDTH,
  PHASE_PLAYING,
  PLAYER_COLORS
} from './globals.js';

function getTestWinAction(gameState) {
  if (!gameState.player || gameState.gamePhase !== PHASE_PLAYING) {
    return null;
  }

  const player = gameState.player;
  const playerColor = gameState.playerColor;
  
  // Find nearest ring in our lane or adjacent lanes
  let targetRing = null;
  let minDist = Infinity;
  
  gameState.rings.forEach(ring => {
    if (!ring.collected && ring.x > player.x) {
      const dist = ring.x - player.x;
      if (dist < minDist) {
        minDist = dist;
        targetRing = ring;
      }
    }
  });

  // Find nearest obstacle
  let nearestObstacle = null;
  let obstacleMinDist = Infinity;
  
  gameState.obstacles.forEach(obstacle => {
    if (!obstacle.passed && obstacle.x > player.x) {
      const dist = obstacle.x - player.x;
      if (dist < obstacleMinDist) {
        obstacleMinDist = dist;
        nearestObstacle = obstacle;
      }
    }
  });

  // Priority: Avoid obstacles first, then collect matching rings
  if (nearestObstacle && obstacleMinDist < 150) {
    const obstacle = nearestObstacle;
    
    // Handle zipline
    if (obstacle.type === "zipline") {
      if (gameState.neckLength < obstacle.minNeckHeight) {
        // Try to avoid by changing lanes
        if (obstacle.lane === player.lane) {
          if (player.lane > 0) {
            return { keyCode: 37 }; // LEFT
          } else if (player.lane < 2) {
            return { keyCode: 39 }; // RIGHT
          }
        }
      }
      // If neck is tall enough, stay in lane
      return null;
    }
    
    // Handle low barrier - duck if in same lane
    if (obstacle.type === "low_barrier") {
      if (obstacle.lane === player.lane && obstacleMinDist < 100) {
        return { keyCode: 40 }; // DOWN
      } else if (obstacle.lane === player.lane) {
        // Move away if we have time
        if (player.lane > 0) {
          return { keyCode: 37 }; // LEFT
        } else {
          return { keyCode: 39 }; // RIGHT
        }
      }
    }
    
    // Handle barrier - jump or avoid
    if (obstacle.type === "barrier") {
      if (obstacle.lane === player.lane) {
        if (obstacleMinDist < 80 && !player.isJumping) {
          return { keyCode: 38 }; // UP (jump)
        } else if (obstacleMinDist > 80) {
          // Try to change lanes
          if (player.lane > 0) {
            return { keyCode: 37 }; // LEFT
          } else if (player.lane < 2) {
            return { keyCode: 39 }; // RIGHT
          }
        }
      }
    }
  }

  // Collect matching rings
  if (targetRing && minDist < 200) {
    const ring = targetRing;
    
    if (ring.colorIndex === playerColor) {
      // Move toward matching ring
      if (ring.lane < player.lane) {
        return { keyCode: 37 }; // LEFT
      } else if (ring.lane > player.lane) {
        return { keyCode: 39 }; // RIGHT
      }
    } else {
      // Avoid wrong-colored ring
      if (ring.lane === player.lane && minDist < 100) {
        if (player.lane > 0) {
          return { keyCode: 37 }; // LEFT
        } else if (player.lane < 2) {
          return { keyCode: 39 }; // RIGHT
        }
      }
    }
  }

  return null;
}

function getTestMovementAction(gameState) {
  if (!gameState.player || gameState.gamePhase !== PHASE_PLAYING) {
    return null;
  }

  const player = gameState.player;
  const frameCount = gameState.framesSinceStart;
  
  // Test lane switching
  if (frameCount % 120 === 0) {
    if (player.lane === 0) {
      return { keyCode: 39 }; // RIGHT
    } else if (player.lane === 2) {
      return { keyCode: 37 }; // LEFT
    }
  }
  
  // Test jumping
  if (frameCount % 180 === 60) {
    return { keyCode: 38 }; // UP
  }
  
  // Test ducking
  if (frameCount % 180 === 120) {
    return { keyCode: 40 }; // DOWN
  }

  return null;
}

function getTestCollisionAction(gameState) {
  if (!gameState.player || gameState.gamePhase !== PHASE_PLAYING) {
    return null;
  }

  const player = gameState.player;
  
  // Find nearest entity
  let nearestRing = null;
  let minRingDist = Infinity;
  
  gameState.rings.forEach(ring => {
    if (!ring.collected && ring.x > player.x) {
      const dist = ring.x - player.x;
      if (dist < minRingDist) {
        minRingDist = dist;
        nearestRing = ring;
      }
    }
  });

  // Move toward any ring to test collision
  if (nearestRing && minRingDist < 200) {
    if (nearestRing.lane < player.lane) {
      return { keyCode: 37 }; // LEFT
    } else if (nearestRing.lane > player.lane) {
      return { keyCode: 39 }; // RIGHT
    }
  }

  return null;
}

function getRandomAction(gameState) {
  if (!gameState.player || gameState.gamePhase !== PHASE_PLAYING) {
    return null;
  }

  const actions = [
    null,
    { keyCode: 37 }, // LEFT
    { keyCode: 39 }, // RIGHT
    { keyCode: 38 }, // UP
    { keyCode: 40 }  // DOWN
  ];

  const rand = Math.random();
  if (rand < 0.7) return null; // 70% no action
  
  const index = Math.floor(Math.random() * actions.length);
  return actions[index];
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getTestMovementAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getTestCollisionAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;