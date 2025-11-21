// spawner.js - Entity spawning logic
import { Obstacle, Coin, Powerup } from './entities.js';
import { gameState, LEVELS } from './globals.js';

export function spawnEntities(p) {
  const level = LEVELS[gameState.currentLevel];
  const spawnZ = 1000; // Reduced from 1200 since obstacles now move 2.5x faster
  
  // Spawn obstacles
  if (p.random() < level.obstacleChance * 0.1) {
    spawnObstacle(p, spawnZ);
  }
  
  // Spawn coins - reduced from 0.3 to 0.1 to prevent excessive coins
  if (p.random() < 0.1) {
    spawnCoins(p, spawnZ);
  }
  
  // Spawn powerups based on distance
  if (gameState.distanceRun - gameState.lastPowerupDistance >= level.powerupInterval) {
    spawnPowerup(p, spawnZ);
    gameState.lastPowerupDistance = gameState.distanceRun;
  }
}

function spawnObstacle(p, z) {
  const obstacleTypes = ['train', 'jump', 'slide'];
  const type = p.random(obstacleTypes);
  
  let lanes = [];
  
  if (type === 'train') {
    // Trains can span 1-2 lanes (reduced from 1-3 for easier gameplay)
    const numLanes = p.random() < 0.6 ? 1 : 2;
    const startLane = p.floor(p.random(0, 4 - numLanes));
    for (let i = 0; i < numLanes; i++) {
      lanes.push(startLane + i);
    }
  } else {
    // Jump and slide barriers typically span 1 lane (reduced from 1-2)
    const numLanes = 1;
    const startLane = p.floor(p.random(0, 3));
    lanes.push(startLane);
  }
  
  const obstacle = new Obstacle(p, type, lanes, z);
  gameState.obstacles.push(obstacle);
  gameState.entities.push(obstacle);
}

function spawnCoins(p, z) {
  const pattern = p.floor(p.random(0, 3));
  
  if (pattern === 0) {
    // Single lane of coins
    const lane = p.floor(p.random(0, 3));
    for (let i = 0; i < 5; i++) {
      const coin = new Coin(p, lane, z + i * 50, 0);
      gameState.coins.push(coin);
      gameState.entities.push(coin);
    }
  } else if (pattern === 1) {
    // Zigzag pattern
    for (let i = 0; i < 5; i++) {
      const lane = (i % 3);
      const coin = new Coin(p, lane, z + i * 50, 0);
      gameState.coins.push(coin);
      gameState.entities.push(coin);
    }
  } else {
    // All lanes
    for (let lane = 0; lane < 3; lane++) {
      const coin = new Coin(p, lane, z, 0);
      gameState.coins.push(coin);
      gameState.entities.push(coin);
    }
  }
}

function spawnPowerup(p, z) {
  const types = ['jetpack', 'hoverboard', 'magnet'];
  const type = p.random(types);
  const lane = p.floor(p.random(0, 3));
  
  const powerup = new Powerup(p, type, lane, z);
  gameState.powerups.push(powerup);
  gameState.entities.push(powerup);
}