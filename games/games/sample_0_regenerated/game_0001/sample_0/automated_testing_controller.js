// Automated testing controller
import { gameState, OBSTACLE_TYPES } from './globals.js';

// Helper function to find nearest obstacle
function getNearestObstacle() {
  if (!gameState.player || gameState.obstacles.length === 0) return null;
  
  const upcomingObstacles = gameState.obstacles.filter(
    obs => obs.z > gameState.player.z && obs.z < gameState.player.z + 200
  );
  
  if (upcomingObstacles.length === 0) return null;
  
  return upcomingObstacles.reduce((nearest, obs) => {
    return (obs.z < nearest.z) ? obs : nearest;
  });
}

// Helper function to find nearest coin
function getNearestCoin() {
  if (!gameState.player || gameState.collectibles.length === 0) return null;
  
  const upcomingCoins = gameState.collectibles.filter(
    coin => !coin.collected && 
            coin.z > gameState.player.z && 
            coin.z < gameState.player.z + 150
  );
  
  if (upcomingCoins.length === 0) return null;
  
  return upcomingCoins.reduce((nearest, coin) => {
    const dist1 = Math.abs(coin.z - gameState.player.z) + 
                  Math.abs(coin.lane * 40 - gameState.player.x);
    const dist2 = Math.abs(nearest.z - gameState.player.z) + 
                  Math.abs(nearest.lane * 40 - gameState.player.x);
    return dist1 < dist2 ? coin : nearest;
  });
}

// TEST_1: Random actions with basic obstacle avoidance
function getTest1Action() {
  if (!gameState.player) return null;
  
  const player = gameState.player;
  const nearestObstacle = getNearestObstacle();
  
  // Check if obstacle is very close
  if (nearestObstacle && nearestObstacle.z - player.z < 50) {
    // React to obstacle type
    if (nearestObstacle.type === OBSTACLE_TYPES.GAP) {
      return { keyCode: 38 }; // Jump
    } else if (nearestObstacle.type === OBSTACLE_TYPES.LOW_BARRIER) {
      return { keyCode: 40 }; // Slide
    } else if (nearestObstacle.type === OBSTACLE_TYPES.BARRIER) {
      // Try to change lane
      if (nearestObstacle.lane !== player.targetLane) {
        return null; // Already in different lane
      }
      // Move to adjacent lane
      if (player.targetLane === 0) {
        return { keyCode: Math.random() < 0.5 ? 37 : 39 }; // Random left/right
      } else if (player.targetLane === -1) {
        return { keyCode: 39 }; // Move right
      } else {
        return { keyCode: 37 }; // Move left
      }
    } else if (nearestObstacle.type === OBSTACLE_TYPES.PILLAR) {
      return { keyCode: 38 }; // Jump or change lane
    }
  }
  
  // Random actions when no immediate danger
  if (Math.random() < 0.05) {
    const actions = [37, 39, 38, 40];
    return { keyCode: actions[Math.floor(Math.random() * actions.length)] };
  }
  
  return null;
}

// TEST_2: Optimal strategy to survive and collect coins
function getTest2Action() {
  if (!gameState.player) return null;
  
  const player = gameState.player;
  const nearestObstacle = getNearestObstacle();
  const nearestCoin = getNearestCoin();
  
  // Priority 1: Avoid imminent obstacles
  if (nearestObstacle && nearestObstacle.z - player.z < 60) {
    const distanceToObstacle = nearestObstacle.z - player.z;
    
    if (nearestObstacle.type === OBSTACLE_TYPES.GAP) {
      // Jump over gap
      if (distanceToObstacle < 30 && player.onGround) {
        return { keyCode: 38 };
      }
    } else if (nearestObstacle.type === OBSTACLE_TYPES.LOW_BARRIER) {
      // Slide under barrier
      if (distanceToObstacle < 35 && !player.isSliding) {
        return { keyCode: 40 };
      }
    } else if (nearestObstacle.type === OBSTACLE_TYPES.BARRIER || 
               nearestObstacle.type === OBSTACLE_TYPES.PILLAR) {
      // Check if we need to change lane
      const obstacleLaneX = nearestObstacle.lane * 40;
      const playerLaneX = player.targetLane * 40;
      
      if (Math.abs(obstacleLaneX - player.x) < 35) {
        // We're on collision course, change lane
        if (distanceToObstacle < 80) {
          // Find safe lane
          const safeLanes = [-1, 0, 1].filter(lane => {
            const hasObstacle = gameState.obstacles.some(
              obs => obs.lane === lane && 
                     obs.z > player.z && 
                     obs.z < player.z + 100
            );
            return !hasObstacle;
          });
          
          if (safeLanes.length > 0) {
            // Move to nearest safe lane
            const targetLane = safeLanes.reduce((nearest, lane) => {
              const dist1 = Math.abs(lane - player.targetLane);
              const dist2 = Math.abs(nearest - player.targetLane);
              return dist1 < dist2 ? lane : nearest;
            });
            
            if (targetLane < player.targetLane) {
              return { keyCode: 37 }; // Left
            } else if (targetLane > player.targetLane) {
              return { keyCode: 39 }; // Right
            }
          }
        }
      }
    }
  }
  
  // Priority 2: Collect nearby coins
  if (nearestCoin && nearestCoin.z - player.z < 100) {
    const coinLaneX = nearestCoin.lane * 40;
    const playerX = player.x;
    const distanceX = Math.abs(coinLaneX - playerX);
    
    // Move towards coin lane
    if (distanceX > 10) {
      if (coinLaneX < playerX) {
        if (player.targetLane > -1) {
          return { keyCode: 37 }; // Left
        }
      } else {
        if (player.targetLane < 1) {
          return { keyCode: 39 }; // Right
        }
      }
    }
    
    // Jump for high coins
    if (nearestCoin.y > 20 && nearestCoin.z - player.z < 40 && player.onGround) {
      return { keyCode: 38 }; // Jump
    }
  }
  
  // Priority 3: Stay in center lane when possible
  if (Math.random() < 0.02 && player.targetLane !== 0) {
    // Check if center lane is safe
    const centerHasObstacle = gameState.obstacles.some(
      obs => obs.lane === 0 && 
             obs.z > player.z && 
             obs.z < player.z + 150
    );
    
    if (!centerHasObstacle) {
      if (player.targetLane < 0) {
        return { keyCode: 39 }; // Right to center
      } else {
        return { keyCode: 37 }; // Left to center
      }
    }
  }
  
  return null;
}

export function get_automated_testing_action(state) {
  switch (state.controlMode) {
    case "TEST_1":
      return getTest1Action();
    case "TEST_2":
      return getTest2Action();
    default:
      return null;
  }
}

window.get_automated_testing_action = get_automated_testing_action;