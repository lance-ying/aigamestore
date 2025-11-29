import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState, LEVEL_CONFIG } from './globals.js';
import { Obstacle } from './obstacle.js';

export class ObstacleManager {
  constructor(p) {
    this.p = p;
  }

  spawnObstacle(level) {
    const config = LEVEL_CONFIG[level];
    if (!config) return;
    
    const types = ['block', 'beam', 'triangle'];
    let type = types[Math.floor(this.p.random() * types.length)];
    
    // Adjust type distribution by level
    if (level === 1) {
      type = this.p.random() < 0.7 ? 'block' : type;
    }
    
    const x = this.p.random(50, CANVAS_WIDTH - 50);
    const y = -50;
    
    const obstacleConfig = {};
    
    if (level >= 2) {
      if (this.p.random() < 0.3) {
        obstacleConfig.vx = this.p.random(-1, 1);
      }
      if (type === 'triangle' && this.p.random() < 0.4) {
        obstacleConfig.rotationSpeed = this.p.random(-0.05, 0.05);
      }
    }
    
    if (level >= 3) {
      obstacleConfig.vy = this.p.random(1, 2);
      if (type === 'beam') {
        obstacleConfig.width = this.p.random(100, 200);
      }
    }
    
    if (level >= 4) {
      obstacleConfig.vy = this.p.random(2, 3);
      if (this.p.random() < 0.2) {
        obstacleConfig.vx = this.p.random(-2, 2);
      }
    }
    
    const obstacle = new Obstacle(this.p, type, x, y, obstacleConfig);
    return obstacle;
  }

  update(obstacles, balloon, shield, scrollSpeed) {
    const config = LEVEL_CONFIG[gameState.currentLevel];
    
    // Spawn new obstacles
    if (gameState.gamePhase === "PLAYING") {
      if (this.p.frameCount - gameState.lastObstacleSpawn > config.spawnRate) {
        if (obstacles.length < config.maxObstacles) {
          const newObstacle = this.spawnObstacle(gameState.currentLevel);
          if (newObstacle) {
            obstacles.push(newObstacle);
            gameState.lastObstacleSpawn = this.p.frameCount;
          }
        }
      }
    }
    
    // Update all obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obstacle = obstacles[i];
      obstacle.update(scrollSpeed);
      
      // Check collision with balloon
      if (obstacle.checkCollisionWithBalloon(balloon)) {
        return 'COLLISION';
      }
      
      // Check collision with shield and push
      if (obstacle.checkCollisionWithShield(shield)) {
        obstacle.pushAway(shield);
      }
      
      // Remove if off screen and award points
      if (obstacle.removed) {
        const now = Date.now();
        if (now - gameState.lastClearedTime < 2000) {
          gameState.comboCount++;
          if (gameState.comboCount >= 3) {
            gameState.score += 20;
          }
        } else {
          gameState.comboCount = 1;
        }
        gameState.lastClearedTime = now;
        gameState.score += 10;
        obstacles.splice(i, 1);
      }
    }
    
    return 'OK';
  }
}