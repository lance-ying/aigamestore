import { gameState, LANES, OBSTACLE_SPAWN_Z, GROUND_Y } from './globals.js';
import { Obstacle, Coin } from './entities.js';

export function updateSpawner(deltaTime) {
  gameState.spawnTimer += deltaTime;
  
  // Adjust difficulty over time
  if (gameState.distance > 100 * gameState.difficultyLevel) {
    gameState.difficultyLevel++;
    gameState.spawnInterval = Math.max(1.2, gameState.spawnInterval - 0.1);
  }
  
  if (gameState.spawnTimer >= gameState.spawnInterval) {
    gameState.spawnTimer = 0;
    spawnObstacle();
  }
}

function spawnObstacle() {
  const random = Math.random();
  
  // Decide what to spawn
  if (random < 0.3) {
    // Single obstacle with coins
    spawnSingleObstacle();
  } else if (random < 0.6) {
    // Multiple obstacles
    spawnMultipleObstacles();
  } else if (random < 0.8) {
    // Train
    spawnTrain();
  } else {
    // Just coins
    spawnCoins();
  }
}

function spawnSingleObstacle() {
  const lane = Math.floor(Math.random() * 3);
  const type = Math.random() < 0.5 ? 'low' : 'high';
  
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