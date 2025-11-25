import { gameState, LANE_POSITIONS } from './globals.js';
import { Train, Barrier, OverheadBarrier, Coin } from './entities.js';

export function updateSpawning(deltaTime) {
  // Spawn obstacles
  gameState.spawnTimer += deltaTime;
  
  if (gameState.spawnTimer >= gameState.spawnInterval) {
    spawnObstacle();
    gameState.spawnTimer = 0;
    
    // Decrease spawn interval as game progresses (increase difficulty)
    gameState.spawnInterval = Math.max(1.0, gameState.spawnInterval - 0.05);
  }
  
  // Spawn coins
  gameState.coinSpawnTimer += deltaTime;
  
  if (gameState.coinSpawnTimer >= gameState.coinSpawnInterval) {
    spawnCoin();
    gameState.coinSpawnTimer = 0;
  }
}

function spawnObstacle() {
  const lane = Math.floor(Math.random() * 3);
  const spawnZ = -50;
  
  const obstacleType = Math.random();
  
  if (obstacleType < 0.5) {
    // Spawn train
    const train = new Train(lane, spawnZ);
    gameState.obstacles.push(train);
    gameState.entities.push(train);
  } else if (obstacleType < 0.75) {
    // Spawn low barrier
    const barrier = new Barrier(lane, spawnZ);
    gameState.obstacles.push(barrier);
    gameState.entities.push(barrier);
  } else {
    // Spawn overhead barrier
    const overhead = new OverheadBarrier(lane, spawnZ);
    gameState.obstacles.push(overhead);
    gameState.entities.push(overhead);
  }
  
  // Sometimes spawn on multiple lanes
  if (Math.random() < 0.3 && gameState.currentSpeed > 0.5) {
    const lane2 = (lane + 1 + Math.floor(Math.random() * 2)) % 3;
    
    if (obstacleType < 0.5) {
      const train = new Train(lane2, spawnZ - 5);
      gameState.obstacles.push(train);
      gameState.entities.push(train);
    } else {
      const barrier = new Barrier(lane2, spawnZ - 5);
      gameState.obstacles.push(barrier);
      gameState.entities.push(barrier);
    }
  }
}

function spawnCoin() {
  const lane = Math.floor(Math.random() * 3);
  const spawnZ = -50 - Math.random() * 10;
  
  const coin = new Coin(lane, spawnZ);
  gameState.coins.push(coin);
  gameState.entities.push(coin);
  
  // Sometimes spawn coin trails
  if (Math.random() < 0.3) {
    for (let i = 1; i <= 3; i++) {
      const trailCoin = new Coin(lane, spawnZ - i * 2);
      gameState.coins.push(trailCoin);
      gameState.entities.push(trailCoin);
    }
  }
}