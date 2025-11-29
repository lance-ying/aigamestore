import { gameState, LANES, OBSTACLE_SPAWN_Z, GROUND_Y, LEVEL_CONFIG } from './globals.js';
import { Obstacle, Coin } from './entities.js';

export function updateSpawner(deltaTime) {
  gameState.spawnTimer += deltaTime;
  
  // Update level based on coins collected
  updateLevel();
  
  // Add random variance to spawn interval (±20%)
  const variance = (Math.random() - 0.5) * 0.4;
  const effectiveInterval = gameState.spawnInterval * (1 + variance);
  
  if (gameState.spawnTimer >= effectiveInterval) {
    gameState.spawnTimer = 0;
    spawnObstacle();
  }
}

function updateLevel() {
  // Check if player has collected enough coins for next level
  for (let i = 0; i < LEVEL_CONFIG.length; i++) {
    const config = LEVEL_CONFIG[i];
    if (gameState.coins_collected < config.coinsRequired) {
      if (gameState.currentLevel !== config.level) {
        gameState.currentLevel = config.level;
        gameState.currentLevelConfig = config;
        gameState.spawnInterval = config.spawnInterval;
        
        // Log level change
        window.logs.game_info.push({
          game_status: `level_${config.level}_${config.difficulty}`,
          data: { 
            level: config.level, 
            difficulty: config.difficulty,
            coins_collected: gameState.coins_collected 
          },
          framecount: gameState.frameCount,
          timestamp: Date.now()
        });
      }
      break;
    }
  }
  
  // Update speed based on level
  const baseSpeed = 0.3;
  gameState.speed = Math.min(1.8, baseSpeed * gameState.currentLevelConfig.speedMultiplier);
}

function spawnObstacle() {
  const random = Math.random();
  const difficulty = gameState.currentLevelConfig.difficulty;
  
  // Add extra randomization for spawn patterns
  const patternRoll = Math.random();
  
  // Adjust spawn patterns based on difficulty
  if (difficulty === 'EASY') {
    // Easy: More coins, simpler patterns, more variety
    if (patternRoll < 0.25) {
      spawnSingleObstacle('low');
    } else if (patternRoll < 0.45) {
      spawnSingleObstacle('high');
    } else if (patternRoll < 0.6) {
      spawnTrain();
    } else if (patternRoll < 0.75) {
      spawnCoins();
    } else if (patternRoll < 0.87) {
      spawnCoinsOnly();
    } else {
      spawnMixedPattern();
    }
  } else if (difficulty === 'MEDIUM') {
    // Medium: Balanced mix with more variation
    if (patternRoll < 0.2) {
      spawnSingleObstacle('low');
    } else if (patternRoll < 0.38) {
      spawnSingleObstacle('high');
    } else if (patternRoll < 0.56) {
      spawnMultipleObstacles();
    } else if (patternRoll < 0.72) {
      spawnTrain();
    } else if (patternRoll < 0.85) {
      spawnCoins();
    } else {
      spawnMixedPattern();
    }
  } else {
    // Hard: More obstacles, complex patterns, less predictable
    if (patternRoll < 0.18) {
      spawnSingleObstacle('low');
    } else if (patternRoll < 0.35) {
      spawnSingleObstacle('high');
    } else if (patternRoll < 0.6) {
      spawnMultipleObstacles();
    } else if (patternRoll < 0.8) {
      spawnTrain();
    } else if (patternRoll < 0.9) {
      spawnCoins();
    } else {
      spawnComplexPattern();
    }
  }
}

function spawnSingleObstacle(type) {
  const lane = Math.floor(Math.random() * 3);
  
  const obstacle = new Obstacle(lane, OBSTACLE_SPAWN_Z, type);
  gameState.obstacles.push(obstacle);
  
  // Add coins in other lanes
  for (let i = 0; i < 3; i++) {
    if (i !== lane && Math.random() < 0.7) { // 70% chance for each coin
      const coin = new Coin(i, OBSTACLE_SPAWN_Z);
      gameState.coins.push(coin);
    }
  }
}

function spawnMultipleObstacles() {
  // Create obstacles in 2 lanes, leave 1 safe
  const safeLane = Math.floor(Math.random() * 3);
  
  for (let i = 0; i < 3; i++) {
    if (i !== safeLane) {
      // Mix of low and high obstacles with random variation
      const type = Math.random() < 0.5 ? 'low' : 'high';
      const obstacle = new Obstacle(i, OBSTACLE_SPAWN_Z, type);
      gameState.obstacles.push(obstacle);
    }
  }
  
  // Add coin in safe lane
  const coin = new Coin(safeLane, OBSTACLE_SPAWN_Z);
  gameState.coins.push(coin);
}

function spawnTrain() {
  const lane = Math.floor(Math.random() * 3);
  const train = new Obstacle(lane, OBSTACLE_SPAWN_Z - 2, 'train');
  gameState.obstacles.push(train);
  
  // Add coins in other lanes
  for (let i = 0; i < 3; i++) {
    if (i !== lane && Math.random() < 0.8) { // 80% chance for each coin
      const coin = new Coin(i, OBSTACLE_SPAWN_Z);
      gameState.coins.push(coin);
    }
  }
}

function spawnCoins() {
  // Spawn coins in random lanes (not all lanes)
  const numCoins = 1 + Math.floor(Math.random() * 3); // 1-3 coins
  const lanes = [0, 1, 2];
  
  // Shuffle lanes
  for (let i = lanes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [lanes[i], lanes[j]] = [lanes[j], lanes[i]];
  }
  
  for (let i = 0; i < numCoins; i++) {
    const coin = new Coin(lanes[i], OBSTACLE_SPAWN_Z);
    gameState.coins.push(coin);
  }
  
  // Sometimes add a high coin
  if (Math.random() < 0.4) {
    const lane = Math.floor(Math.random() * 3);
    const coin = new Coin(lane, OBSTACLE_SPAWN_Z, GROUND_Y + 3.5);
    gameState.coins.push(coin);
  }
}

function spawnCoinsOnly() {
  // Spawn coins in all lanes - reward moment
  for (let i = 0; i < 3; i++) {
    const coin = new Coin(i, OBSTACLE_SPAWN_Z);
    gameState.coins.push(coin);
  }
}

function spawnMixedPattern() {
  // Random mix of obstacle and coins
  const patternType = Math.floor(Math.random() * 3);
  
  if (patternType === 0) {
    // One obstacle with coins in specific pattern
    const obstacleLane = Math.floor(Math.random() * 3);
    const obstacleType = Math.random() < 0.5 ? 'low' : 'high';
    const obstacle = new Obstacle(obstacleLane, OBSTACLE_SPAWN_Z, obstacleType);
    gameState.obstacles.push(obstacle);
    
    // Coins offset in z position
    for (let i = 0; i < 3; i++) {
      if (i !== obstacleLane) {
        const coin = new Coin(i, OBSTACLE_SPAWN_Z - 5);
        gameState.coins.push(coin);
      }
    }
  } else if (patternType === 1) {
    // Staggered coins with one low obstacle
    for (let i = 0; i < 3; i++) {
      const coin = new Coin(i, OBSTACLE_SPAWN_Z - (i * 3));
      gameState.coins.push(coin);
    }
    const lane = Math.floor(Math.random() * 3);
    const obstacle = new Obstacle(lane, OBSTACLE_SPAWN_Z, 'low');
    gameState.obstacles.push(obstacle);
  } else {
    // Random sparse pattern
    for (let i = 0; i < 3; i++) {
      if (Math.random() < 0.5) {
        const coin = new Coin(i, OBSTACLE_SPAWN_Z);
        gameState.coins.push(coin);
      }
    }
  }
}

function spawnComplexPattern() {
  // Advanced patterns for hard difficulty
  const patternType = Math.floor(Math.random() * 2);
  
  if (patternType === 0) {
    // Two trains in different lanes
    const lane1 = Math.floor(Math.random() * 2); // 0 or 1
    const lane2 = lane1 + 1 + Math.floor(Math.random() * (2 - lane1)); // Different lane
    
    const train1 = new Obstacle(lane1, OBSTACLE_SPAWN_Z, 'train');
    const train2 = new Obstacle(lane2, OBSTACLE_SPAWN_Z - 8, 'train');
    gameState.obstacles.push(train1);
    gameState.obstacles.push(train2);
    
    // Coins in safe areas
    for (let i = 0; i < 3; i++) {
      if (i !== lane1 && i !== lane2) {
        const coin = new Coin(i, OBSTACLE_SPAWN_Z);
        gameState.coins.push(coin);
      }
    }
  } else {
    // Mixed high and low obstacles with strategic coins
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
    
    // Strategic coins requiring lane changes
    const coin1 = new Coin(safeLane, OBSTACLE_SPAWN_Z);
    const coin2 = new Coin((safeLane + 1) % 3, OBSTACLE_SPAWN_Z - 10);
    gameState.coins.push(coin1);
    gameState.coins.push(coin2);
  }
}