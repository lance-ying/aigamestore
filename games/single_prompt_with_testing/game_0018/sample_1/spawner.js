import { gameState, LANES, OBSTACLE_SPAWN_Z, GROUND_Y, LEVEL_CONFIG } from './globals.js';
import { Obstacle, Coin } from './entities.js';

export function updateSpawner(deltaTime) {
  gameState.spawnTimer += deltaTime;
  
  // Update level based on coins collected
  updateLevel();
  
  // Add random variance to spawn interval (±15% for more consistency)
  const variance = (Math.random() - 0.5) * 0.3;
  const effectiveInterval = gameState.spawnInterval * (1 + variance);
  
  if (gameState.spawnTimer >= effectiveInterval) {
    gameState.spawnTimer = 0;
    spawnObstacle();
  }
}

function updateLevel() {
  const previousLevel = gameState.currentLevel;
  
  // Check if player has reached the NEXT level's requirement
  if (gameState.currentLevel < 9) {
    const nextLevelConfig = LEVEL_CONFIG[gameState.currentLevel]; // Next level (current index)
    
    if (gameState.coins_collected >= nextLevelConfig.coinsRequired) {
      // Trigger level complete screen
      gameState.gamePhase = "LEVEL_COMPLETE";
      gameState.levelCompleteTimer = 0;
      
      window.logs.game_info.push({
        game_status: `level_complete_${previousLevel}`,
        data: { 
          level: previousLevel, 
          coins_collected: gameState.coins_collected 
        },
        framecount: gameState.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  // Update speed based on current level config
  const baseSpeed = 0.2;
  gameState.speed = Math.min(1.0, baseSpeed * gameState.currentLevelConfig.speedMultiplier);
}

function spawnCoinTrail(lane, startZ, count = 5, spacing = 3) {
  // Spawn a trail of coins along the Z axis
  for (let i = 0; i < count; i++) {
    const coin = new Coin(lane, startZ + (i * spacing));
    gameState.coins.push(coin);
  }
}

function spawnObstacle() {
  const random = Math.random();
  const difficulty = gameState.currentLevelConfig.difficulty;
  
  // Add extra randomization for spawn patterns
  const patternRoll = Math.random();
  
  // Adjust spawn patterns based on difficulty - more coin trails throughout
  if (difficulty === 'EASY') {
    // Easy: More coin trails, simpler patterns
    if (patternRoll < 0.2) {
      spawnSingleObstacle('low');
    } else if (patternRoll < 0.35) {
      spawnSingleObstacle('high');
    } else if (patternRoll < 0.5) {
      spawnTrain();
    } else if (patternRoll < 0.7) {
      spawnCoinTrailPattern();
    } else if (patternRoll < 0.85) {
      spawnCoinsOnly();
    } else {
      spawnMixedPattern();
    }
  } else if (difficulty === 'MEDIUM') {
    // Medium: Balanced mix with coin trails
    if (patternRoll < 0.2) {
      spawnSingleObstacle('low');
    } else if (patternRoll < 0.38) {
      spawnSingleObstacle('high');
    } else if (patternRoll < 0.56) {
      spawnMultipleObstacles();
    } else if (patternRoll < 0.7) {
      spawnTrain();
    } else if (patternRoll < 0.85) {
      spawnCoinTrailPattern();
    } else {
      spawnMixedPattern();
    }
  } else {
    // Hard: More obstacles, but still coin trails
    if (patternRoll < 0.2) {
      spawnSingleObstacle('low');
    } else if (patternRoll < 0.38) {
      spawnSingleObstacle('high');
    } else if (patternRoll < 0.6) {
      spawnMultipleObstacles();
    } else if (patternRoll < 0.75) {
      spawnTrain();
    } else if (patternRoll < 0.88) {
      spawnCoinTrailPattern();
    } else {
      spawnComplexPattern();
    }
  }
}

function spawnSingleObstacle(type) {
  const lane = Math.floor(Math.random() * 3);
  
  const obstacle = new Obstacle(lane, OBSTACLE_SPAWN_Z, type);
  gameState.obstacles.push(obstacle);
  
  // Add coin trails in other lanes
  for (let i = 0; i < 3; i++) {
    if (i !== lane && Math.random() < 0.6) {
      spawnCoinTrail(i, OBSTACLE_SPAWN_Z, 5, 3);
    }
  }
}

function spawnMultipleObstacles() {
  // Create obstacles in 2 lanes, leave 1 safe with coin trail
  const safeLane = Math.floor(Math.random() * 3);
  
  for (let i = 0; i < 3; i++) {
    if (i !== safeLane) {
      const type = Math.random() < 0.5 ? 'low' : 'high';
      const obstacle = new Obstacle(i, OBSTACLE_SPAWN_Z, type);
      gameState.obstacles.push(obstacle);
    }
  }
  
  // Add coin trail in safe lane
  spawnCoinTrail(safeLane, OBSTACLE_SPAWN_Z, 5, 3);
}

function spawnTrain() {
  const lane = Math.floor(Math.random() * 3);
  const train = new Obstacle(lane, OBSTACLE_SPAWN_Z - 2, 'train');
  gameState.obstacles.push(train);
  
  // Add coin trails in other lanes
  for (let i = 0; i < 3; i++) {
    if (i !== lane && Math.random() < 0.7) {
      spawnCoinTrail(i, OBSTACLE_SPAWN_Z, 5, 3);
    }
  }
}

function spawnCoinTrailPattern() {
  // Spawn coin trails in 1-3 lanes
  const numTrails = 1 + Math.floor(Math.random() * 3); // 1-3 trails
  const lanes = [0, 1, 2];
  
  // Shuffle lanes
  for (let i = lanes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [lanes[i], lanes[j]] = [lanes[j], lanes[i]];
  }
  
  for (let i = 0; i < numTrails; i++) {
    spawnCoinTrail(lanes[i], OBSTACLE_SPAWN_Z, 5, 3);
  }
  
  // Sometimes add a high coin trail
  if (Math.random() < 0.3) {
    const lane = Math.floor(Math.random() * 3);
    for (let i = 0; i < 3; i++) {
      const coin = new Coin(lane, OBSTACLE_SPAWN_Z + (i * 4), GROUND_Y + 3.5);
      gameState.coins.push(coin);
    }
  }
}

function spawnCoinsOnly() {
  // Spawn coin trails in all lanes - reward moment
  for (let i = 0; i < 3; i++) {
    spawnCoinTrail(i, OBSTACLE_SPAWN_Z, 5, 3);
  }
}

function spawnMixedPattern() {
  // Mix of obstacle and coin trails
  const patternType = Math.floor(Math.random() * 3);
  
  if (patternType === 0) {
    // One obstacle with coin trails in other lanes
    const obstacleLane = Math.floor(Math.random() * 3);
    const obstacleType = Math.random() < 0.5 ? 'low' : 'high';
    const obstacle = new Obstacle(obstacleLane, OBSTACLE_SPAWN_Z, obstacleType);
    gameState.obstacles.push(obstacle);
    
    // Coin trails in other lanes, offset in z
    for (let i = 0; i < 3; i++) {
      if (i !== obstacleLane) {
        spawnCoinTrail(i, OBSTACLE_SPAWN_Z - 5, 5, 3);
      }
    }
  } else if (patternType === 1) {
    // Staggered coin trails with one low obstacle
    for (let i = 0; i < 3; i++) {
      spawnCoinTrail(i, OBSTACLE_SPAWN_Z - (i * 5), 4, 3);
    }
    const lane = Math.floor(Math.random() * 3);
    const obstacle = new Obstacle(lane, OBSTACLE_SPAWN_Z, 'low');
    gameState.obstacles.push(obstacle);
  } else {
    // Multiple short coin trails
    for (let i = 0; i < 3; i++) {
      if (Math.random() < 0.7) {
        spawnCoinTrail(i, OBSTACLE_SPAWN_Z, 5, 3);
      }
    }
  }
}

function spawnComplexPattern() {
  // Advanced patterns for hard difficulty with coin trails
  const patternType = Math.floor(Math.random() * 2);
  
  if (patternType === 0) {
    // Two trains in different lanes with coin trail in safe lane
    const lane1 = Math.floor(Math.random() * 2); // 0 or 1
    const lane2 = lane1 + 1 + Math.floor(Math.random() * (2 - lane1)); // Different lane
    
    const train1 = new Obstacle(lane1, OBSTACLE_SPAWN_Z, 'train');
    const train2 = new Obstacle(lane2, OBSTACLE_SPAWN_Z - 8, 'train');
    gameState.obstacles.push(train1);
    gameState.obstacles.push(train2);
    
    // Coin trails in safe lane
    for (let i = 0; i < 3; i++) {
      if (i !== lane1 && i !== lane2) {
        spawnCoinTrail(i, OBSTACLE_SPAWN_Z, 5, 3);
      }
    }
  } else {
    // Mixed high and low obstacles with strategic coin trails
    const safeLane = Math.floor(Math.random() * 3);
    const types = ['low', 'high'];
    
    for (let i = 0; i < 3; i++) {
      if (i !== safeLane) {
        const type = types[Math.floor(Math.random() * types.length)];
        const zOffset = Math.random() * 5;
        const obstacle = new Obstacle(i, OBSTACLE_SPAWN_Z - zOffset, type);
        gameState.obstacles.push(obstacle);
      }
    }
    
    // Coin trail in safe lane requiring lane navigation
    spawnCoinTrail(safeLane, OBSTACLE_SPAWN_Z, 5, 3);
    spawnCoinTrail((safeLane + 1) % 3, OBSTACLE_SPAWN_Z - 10, 3, 3);
  }
}