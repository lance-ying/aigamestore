import { gameState, SPAWN_INTERVAL, COIN_SPAWN_CHANCE, LANES } from './globals.js';
import { Train, Barrier, Coin } from './entities.js';

export function spawnObstacles() {
  gameState.spawnCounter++;
  
  // Adjust spawn interval based on speed
  const adjustedInterval = Math.max(30, SPAWN_INTERVAL - Math.floor(gameState.distance / 100));
  
  if (gameState.spawnCounter >= adjustedInterval) {
    gameState.spawnCounter = 0;
    
    // Randomly choose obstacle type and lane
    const obstacleType = Math.random();
    const numLanes = Math.floor(Math.random() * 2) + 1; // 1 or 2 lanes
    const lanes = [];
    
    // Select random lanes
    const availableLanes = [0, 1, 2];
    for (let i = 0; i < numLanes; i++) {
      const idx = Math.floor(Math.random() * availableLanes.length);
      lanes.push(availableLanes[idx]);
      availableLanes.splice(idx, 1);
    }
    
    // Spawn obstacles
    lanes.forEach(lane => {
      const spawnZ = -50;
      
      if (obstacleType < 0.4) {
        // Spawn train
        const train = new Train(lane, spawnZ);
        gameState.obstacles.push(train);
      } else if (obstacleType < 0.7) {
        // Spawn low barrier (jump over)
        const barrier = new Barrier(lane, spawnZ, true);
        gameState.obstacles.push(barrier);
      } else {
        // Spawn high barrier (slide under)
        const barrier = new Barrier(lane, spawnZ, false);
        gameState.obstacles.push(barrier);
      }
    });
    
    // Spawn coins in empty lanes
    availableLanes.forEach(lane => {
      if (Math.random() < COIN_SPAWN_CHANCE) {
        const coin = new Coin(lane, -50);
        gameState.coins.push(coin);
      }
    });
  }
}

export function updateEntities() {
  // Update obstacles
  for (let i = gameState.obstacles.length - 1; i >= 0; i--) {
    const obstacle = gameState.obstacles[i];
    obstacle.update(gameState.gameSpeed);
    
    // Remove if past player
    if (obstacle.mesh.position.z > 15) {
      obstacle.destroy();
      gameState.obstacles.splice(i, 1);
    }
  }
  
  // Update coins
  for (let i = gameState.coins.length - 1; i >= 0; i--) {
    const coin = gameState.coins[i];
    coin.update(gameState.gameSpeed);
    
    // Remove if past player
    if (coin.mesh.position.z > 15) {
      coin.destroy();
      gameState.coins.splice(i, 1);
    }
  }
  
  // Update tracks
  gameState.tracks.forEach(track => {
    track.update(gameState.gameSpeed);
  });
}