// spawner.js - Obstacle spawning logic
import { gameState, OBSTACLE_TYPES, SPAWN_DISTANCE } from './globals.js';
import { Obstacle } from './entities.js';

export class ObstacleSpawner {
  constructor(scene) {
    this.scene = scene;
    this.patterns = this.createPatterns();
    this.patternIndex = 0;
    this.spawnCounter = 0;
  }

  createPatterns() {
    // Predefined obstacle patterns for variety
    return [
      // Pattern 1: Single obstacle in random lane
      { obstacles: [{ type: 'TRAIN', lane: 1 }], coins: [{ lane: 0 }, { lane: 2 }] },
      
      // Pattern 2: Two obstacles, one lane free
      { obstacles: [{ type: 'TRAIN', lane: 0 }, { type: 'TRAIN', lane: 2 }], coins: [{ lane: 1 }] },
      
      // Pattern 3: Low barrier to jump
      { obstacles: [{ type: 'LOW_BARRIER', lane: 1 }], coins: [{ lane: 0 }, { lane: 2 }] },
      
      // Pattern 4: High barrier to slide
      { obstacles: [{ type: 'BARRIER', lane: 1 }], coins: [{ lane: 0 }, { lane: 2 }] },
      
      // Pattern 5: Mixed obstacles
      { obstacles: [{ type: 'LOW_BARRIER', lane: 0 }, { type: 'BARRIER', lane: 2 }], coins: [{ lane: 1 }] },
      
      // Pattern 6: Three coins
      { obstacles: [], coins: [{ lane: 0 }, { lane: 1 }, { lane: 2 }] },
      
      // Pattern 7: Train with jump challenge
      { obstacles: [{ type: 'TRAIN', lane: 0 }, { type: 'LOW_BARRIER', lane: 1 }], coins: [{ lane: 2 }] },
      
      // Pattern 8: Double barrier
      { obstacles: [{ type: 'BARRIER', lane: 0 }, { type: 'BARRIER', lane: 1 }], coins: [{ lane: 2 }] },
    ];
  }

  update() {
    this.spawnCounter++;
    
    // Calculate spawn frequency based on difficulty
    const spawnInterval = Math.max(60, 120 - gameState.difficulty * 5);
    
    if (this.spawnCounter >= spawnInterval) {
      this.spawnPattern();
      this.spawnCounter = 0;
    }
  }

  spawnPattern() {
    // Select pattern
    const pattern = this.patterns[this.patternIndex % this.patterns.length];
    this.patternIndex++;
    
    const spawnZ = SPAWN_DISTANCE; // Now negative (on horizon)
    
    // Spawn obstacles
    pattern.obstacles.forEach(obstacleData => {
      const obstacle = new Obstacle(obstacleData.type, obstacleData.lane, spawnZ);
      this.scene.add(obstacle.mesh);
      gameState.obstacles.push(obstacle);
      gameState.entities.push(obstacle);
    });
    
    // Spawn coins slightly behind obstacles (closer to player on spawn)
    pattern.coins.forEach(coinData => {
      const coin = new Obstacle(OBSTACLE_TYPES.COIN, coinData.lane, spawnZ + 2);
      this.scene.add(coin.mesh);
      gameState.coins.push(coin);
      gameState.entities.push(coin);
    });
  }
}