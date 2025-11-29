import { gameState, LANES, OBSTACLE_SPAWN_Z, GROUND_Y, LEVEL_CONFIG } from './globals.js';
import { Obstacle, Coin } from './entities.js';

export function updateSpawner(deltaTime) {
  gameState.spawnTimer += deltaTime;
  
  // Update level based on distance (9 distinct levels)
  updateLevel();
  
  // Use current level's spawn interval
  if (gameState.spawnTimer >= gameState.spawnInterval) {
    gameState.spawnTimer = 0;
    spawnObstacle();
  }
}

function updateLevel() {
  // Check if player has reached next level
  for (let i = 0; i < LEVEL_CONFIG.length; i++) {
    const config = LEVEL_CONFIG[i];
    if (gameState.distance < config.distanceGoal) {
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
            distance: gameState.distance 
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
  
  // Adjust spawn patterns based on difficulty
  if (difficulty === 'EASY') {
    // Easy: More coins, simpler patterns
    if (random < 0.3) {
      spawnSingleObstacle('low');
    } else if (random < 0.5) {
      spawnSingleObstacle('high');
    } else if (random < 0.65) {
      spawnTrain();
    } else {
      spawnCoins();
    }
  } else if (difficulty === 'MEDIUM') {
    // Medium: Balanced mix
    if (random < 0.25) {
      spawnSingleObstacle('low');
    } else if (random < 0.45) {
      spawnSingleObstacle('high');
    } else if (random < 0.65) {
      spawnMultipleObstacles();
    } else if (random < 0.8) {
      spawnTrain();
    } else {
      spawnCoins();
    }
  } else {
    // Hard: More obstacles, complex patterns
    if (random < 0.2) {
      spawnSingleObstacle('low');
    } else if (random < 0.4) {
      spawnSingleObstacle('high');
    } else if (random < 0.7) {
      spawnMultipleObstacles();
    } else if (random < 0.9) {
      spawnTrain();
    } else {
      spawnCoins();
    }
  }
}

function spawnSingleObstacle(type) {
  const lane = Math.floor(Math.random() * 3);
  
  const obstacle = new Obstacle(lane, OBSTACLE_SPAWN_Z, type);
  gameState.obstacles.push(obstacle);
  
  // Add coins in other lanes
  for (let i = 0; i < 3; i++) {
    if (i !== lane) {
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
      // Mix of low and high obstacles
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
    if (i !== lane) {
      const coin = new Coin(i, OBSTACLE_SPAWN_Z);
      gameState.coins.push(coin);
    }
  }
}

function spawnCoins() {
  // Spawn coins in all lanes
  for (let i = 0; i < 3; i++) {
    const coin = new Coin(i, OBSTACLE_SPAWN_Z);
    gameState.coins.push(coin);
  }
  
  // Extra coins above
  const lane = Math.floor(Math.random() * 3);
  const coin = new Coin(lane, GROUND_Y + 3.5, OBSTACLE_SPAWN_Z);
  gameState.coins.push(coin);
}