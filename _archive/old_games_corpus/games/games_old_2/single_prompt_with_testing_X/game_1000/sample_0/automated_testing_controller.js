import { gameState, OBSTACLE_TYPES, PLAYER_STATES, LANES, LANE_X_POSITIONS } from './globals.js';

function getTestWinAction(gameState) {
  if (!gameState.player) {
    return { left: false, right: false, jump: false, slide: false };
  }

  const player = gameState.player;
  const currentLane = player.lane;
  const playerY = player.y;
  
  // Look ahead for upcoming obstacles
  const lookAheadDistance = 200;
  const dangerousObstacles = gameState.obstacles.filter(obs => 
    obs.y > playerY - lookAheadDistance && obs.y < playerY + 50
  );

  // Find obstacles in current lane
  const obstaclesInLane = dangerousObstacles.filter(obs => obs.lane === currentLane);
  
  // Strategy: Avoid obstacles by changing lanes or jumping/sliding
  if (obstaclesInLane.length > 0) {
    const nearestObstacle = obstaclesInLane.reduce((nearest, obs) => 
      obs.y < nearest.y ? obs : nearest
    );

    // Calculate distance to obstacle
    const distanceToObstacle = Math.abs(nearestObstacle.y - playerY);

    // If close to obstacle, react
    if (distanceToObstacle < 100) {
      // Try to change lane first if safe
      const leftLaneSafe = currentLane > LANES.LEFT && 
        !dangerousObstacles.some(obs => obs.lane === currentLane - 1 && Math.abs(obs.y - playerY) < 80);
      const rightLaneSafe = currentLane < LANES.RIGHT && 
        !dangerousObstacles.some(obs => obs.lane === currentLane + 1 && Math.abs(obs.y - playerY) < 80);

      // Choose safest lane
      if (leftLaneSafe && Math.abs(player.x - player.targetX) < 5) {
        return { left: true, right: false, jump: false, slide: false };
      }
      if (rightLaneSafe && Math.abs(player.x - player.targetX) < 5) {
        return { left: false, right: true, jump: false, slide: false };
      }

      // If can't change lane safely, jump or slide
      if (nearestObstacle.type === OBSTACLE_TYPES.LOW_BARRIER && 
          player.state === PLAYER_STATES.RUNNING && distanceToObstacle < 60) {
        return { left: false, right: false, jump: true, slide: false };
      }
      if (nearestObstacle.type === OBSTACLE_TYPES.HIGH_BARRIER && 
          player.state === PLAYER_STATES.RUNNING && distanceToObstacle < 60) {
        return { left: false, right: false, jump: false, slide: true };
      }
      if (nearestObstacle.type === OBSTACLE_TYPES.TRAIN && distanceToObstacle < 80) {
        // Emergency lane change
        if (leftLaneSafe) {
          return { left: true, right: false, jump: false, slide: false };
        }
        if (rightLaneSafe) {
          return { left: false, right: true, jump: false, slide: false };
        }
      }
    }
  }

  // Collect coins when safe
  const nearbyCoins = gameState.coins.filter(coin => 
    !coin.collected && coin.y > playerY - 150 && coin.y < playerY + 50
  );

  if (nearbyCoins.length > 0 && obstaclesInLane.length === 0) {
    const nearestCoin = nearbyCoins.reduce((nearest, coin) => 
      Math.abs(coin.y - playerY) < Math.abs(nearest.y - playerY) ? coin : nearest
    );

    if (nearestCoin.lane < currentLane && Math.abs(player.x - player.targetX) < 5) {
      return { left: true, right: false, jump: false, slide: false };
    }
    if (nearestCoin.lane > currentLane && Math.abs(player.x - player.targetX) < 5) {
      return { left: false, right: true, jump: false, slide: false };
    }
  }

  // Stay in center lane by default when safe
  if (currentLane !== LANES.CENTER && Math.abs(player.x - player.targetX) < 5) {
    const centerSafe = !dangerousObstacles.some(obs => 
      obs.lane === LANES.CENTER && Math.abs(obs.y - playerY) < 100
    );
    
    if (centerSafe) {
      if (currentLane < LANES.CENTER) {
        return { left: false, right: true, jump: false, slide: false };
      } else {
        return { left: true, right: false, jump: false, slide: false };
      }
    }
  }

  return { left: false, right: false, jump: false, slide: false };
}

function getTestMovementAction(gameState) {
  if (!gameState.player) {
    return { left: false, right: false, jump: false, slide: false };
  }

  const player = gameState.player;
  const frame = gameState.framesSinceStart;
  
  // Cycle through lanes
  const cycleTime = 120;
  const cyclePhase = Math.floor(frame / cycleTime) % 3;
  
  if (frame % cycleTime === 0) {
    if (cyclePhase === 0 && player.lane !== LANES.LEFT) {
      return { left: true, right: false, jump: false, slide: false };
    }
    if (cyclePhase === 1 && player.lane !== LANES.CENTER) {
      if (player.lane === LANES.LEFT) {
        return { left: false, right: true, jump: false, slide: false };
      } else {
        return { left: true, right: false, jump: false, slide: false };
      }
    }
    if (cyclePhase === 2 && player.lane !== LANES.RIGHT) {
      return { left: false, right: true, jump: false, slide: false };
    }
  }

  return { left: false, right: false, jump: false, slide: false };
}

function getTestJumpSlideAction(gameState) {
  if (!gameState.player) {
    return { left: false, right: false, jump: false, slide: false };
  }

  const player = gameState.player;
  const nearbyObstacles = gameState.obstacles.filter(obs => 
    obs.lane === player.lane && 
    obs.y > player.y - 100 && 
    obs.y < player.y + 50
  );

  if (nearbyObstacles.length > 0) {
    const obstacle = nearbyObstacles[0];
    const distance = Math.abs(obstacle.y - player.y);

    if (obstacle.type === OBSTACLE_TYPES.LOW_BARRIER && 
        player.state === PLAYER_STATES.RUNNING && distance < 50) {
      return { left: false, right: false, jump: true, slide: false };
    }
    if (obstacle.type === OBSTACLE_TYPES.HIGH_BARRIER && 
        player.state === PLAYER_STATES.RUNNING && distance < 50) {
      return { left: false, right: false, jump: false, slide: true };
    }
  }

  return { left: false, right: false, jump: false, slide: false };
}

function getTestCoinCollectionAction(gameState) {
  if (!gameState.player) {
    return { left: false, right: false, jump: false, slide: false };
  }

  const player = gameState.player;
  
  // Prioritize coin collection
  const nearbyCoins = gameState.coins.filter(coin => 
    !coin.collected && coin.y > player.y - 150 && coin.y < player.y + 50
  );

  if (nearbyCoins.length > 0) {
    const nearestCoin = nearbyCoins.reduce((nearest, coin) => 
      Math.abs(coin.y - player.y) < Math.abs(nearest.y - player.y) ? coin : nearest
    );

    // Move towards coin lane
    if (nearestCoin.lane < player.lane && Math.abs(player.x - player.targetX) < 5) {
      return { left: true, right: false, jump: false, slide: false };
    }
    if (nearestCoin.lane > player.lane && Math.abs(player.x - player.targetX) < 5) {
      return { left: false, right: true, jump: false, slide: false };
    }
  }

  // Avoid obstacles
  const nearbyObstacles = gameState.obstacles.filter(obs => 
    obs.lane === player.lane && 
    obs.y > player.y - 80 && 
    obs.y < player.y + 50
  );

  if (nearbyObstacles.length > 0) {
    const obstacle = nearbyObstacles[0];
    if (player.lane > LANES.LEFT && Math.abs(player.x - player.targetX) < 5) {
      return { left: true, right: false, jump: false, slide: false };
    }
  }

  return { left: false, right: false, jump: false, slide: false };
}

function getTestProgressionAction(gameState) {
  // Similar to TEST_1 but focuses on surviving long enough to test difficulty scaling
  return getTestWinAction(gameState);
}

function getRandomAction(gameState) {
  const rand = Math.random();
  if (rand < 0.1) {
    return { left: true, right: false, jump: false, slide: false };
  } else if (rand < 0.2) {
    return { left: false, right: true, jump: false, slide: false };
  } else if (rand < 0.25) {
    return { left: false, right: false, jump: true, slide: false };
  } else if (rand < 0.3) {
    return { left: false, right: false, jump: false, slide: true };
  }
  return { left: false, right: false, jump: false, slide: false };
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getTestWinAction(gameState);
    case "TEST_2":
      return getTestMovementAction(gameState);
    case "TEST_3":
      return getTestJumpSlideAction(gameState);
    case "TEST_4":
      return getTestCoinCollectionAction(gameState);
    case "TEST_5":
      return getTestProgressionAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;