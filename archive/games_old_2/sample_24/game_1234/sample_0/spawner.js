// spawner.js - Handles spawning of obstacles and coins

import { Obstacle, Coin } from './obstacles.js';
import { OBSTACLE_TYPES, LEVELS, gameState } from './globals.js';

export class Spawner {
  constructor() {
    this.lastObstacleZ = 0;
    this.lastCoinZ = 0;
    this.minObstacleDistance = 150;
    this.minCoinDistance = 100;
  }

  spawnObstacles(p) {
    const level = LEVELS[gameState.currentLevel - 1];
    const cameraZ = gameState.cameraZ;
    
    if (cameraZ - this.lastObstacleZ > this.minObstacleDistance) {
      if (p.random() < level.obstacleSpawnRate) {
        const types = [
          OBSTACLE_TYPES.LOW_BARRIER,
          OBSTACLE_TYPES.HIGH_BARRIER,
          OBSTACLE_TYPES.GAP
        ];
        const type = p.random(types);
        const lane = p.floor(p.random(-1, 2));
        const z = cameraZ + 600;
        
        const obstacle = new Obstacle(type, z, lane);
        gameState.obstacles.push(obstacle);
        this.lastObstacleZ = cameraZ;
      }
    }
  }

  spawnCoins(p) {
    const level = LEVELS[gameState.currentLevel - 1];
    const cameraZ = gameState.cameraZ;
    
    if (cameraZ - this.lastCoinZ > this.minCoinDistance) {
      if (p.random() < level.coinSpawnRate) {
        const lane = p.floor(p.random(-1, 2));
        const z = cameraZ + 600;
        const yOffset = p.random(-30, 30);
        
        const coin = new Coin(z, lane, yOffset);
        gameState.coins.push(coin);
        this.lastCoinZ = cameraZ;
        
        // Sometimes spawn a trail of coins
        if (p.random() < 0.3) {
          for (let i = 1; i <= 3; i++) {
            const trailCoin = new Coin(z + i * 80, lane, yOffset);
            gameState.coins.push(trailCoin);
          }
        }
      }
    }
  }

  update(p) {
    this.spawnObstacles(p);
    this.spawnCoins(p);
  }
}