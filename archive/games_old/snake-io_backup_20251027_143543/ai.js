// ai.js - AI snake behaviors

import { SEGMENT_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class AIController {
  constructor(p, snake, config) {
    this.p = p;
    this.snake = snake;
    this.config = config;
    this.updateTimer = 0;
    this.updateInterval = 5; // Update more frequently for better responsiveness
    this.targetPellet = null;
    this.panicMode = false;
  }

  update(pellets, massDrops, allSnakes, obstacles) {
    if (!this.snake.isAlive) return;

    this.updateTimer++;
    if (this.updateTimer < this.updateInterval) return;
    this.updateTimer = 0;

    const head = this.snake.getHead();
    
    // Calculate dynamic lookahead based on snake length and speed
    const baseLookAhead = 60;
    const lengthFactor = Math.min(this.snake.segments.length / 50, 2);
    const speedFactor = this.snake.speed / 2;
    const lookAhead = baseLookAhead * lengthFactor * speedFactor;
    
    // Check for immediate danger with extended lookahead
    const dangerInfo = this.checkDanger(allSnakes, obstacles, lookAhead);
    
    // Find nearest food
    const allFood = [...pellets, ...massDrops];
    let nearestFood = null;
    let nearestDist = Infinity;
    
    for (let food of allFood) {
      const dist = this.p.dist(head.x, head.y, food.pos.x, food.pos.y);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestFood = food;
      }
    }

    // Decision making with better priorities
    if (dangerInfo.inDanger) {
      // Critical: Avoid danger immediately
      this.panicMode = true;
      this.avoidDanger(dangerInfo, allSnakes, obstacles);
    } else {
      this.panicMode = false;
      
      // Check if we should be aggressive
      if (this.p.random() < this.config.aiAggression && allSnakes.length > 0) {
        const target = this.findCutoffTarget(allSnakes);
        if (target && this.isSafeDirection(target, allSnakes, obstacles, lookAhead * 0.5)) {
          this.moveTowards(target);
        } else if (nearestFood && this.isSafeDirection(nearestFood.pos, allSnakes, obstacles, lookAhead * 0.5)) {
          this.moveTowards(nearestFood.pos);
        }
      } else if (nearestFood) {
        // Safe path to food
        if (this.isSafeDirection(nearestFood.pos, allSnakes, obstacles, lookAhead * 0.5)) {
          this.moveTowards(nearestFood.pos);
        } else {
          // Find alternate safe direction
          this.findSafeDirection(allSnakes, obstacles, lookAhead);
        }
      }
    }
  }

  checkDanger(allSnakes, obstacles, lookAhead) {
    const head = this.snake.getHead();
    const dangerPoints = [];
    
    // Check multiple points along projected path
    const checkPoints = 5;
    for (let i = 1; i <= checkPoints; i++) {
      const distance = (lookAhead / checkPoints) * i;
      const futurePos = this.p.createVector(
        head.x + this.snake.direction.x * distance,
        head.y + this.snake.direction.y * distance
      );

      // No boundary checks - wrapping enabled (Pac-Man style)

      // Check obstacles with better collision detection
      for (let obstacle of obstacles) {
        const bounds = obstacle.getBounds();
        const obstacleMargin = 15;
        if (futurePos.x > bounds.x - obstacleMargin && futurePos.x < bounds.x + bounds.width + obstacleMargin &&
            futurePos.y > bounds.y - obstacleMargin && futurePos.y < bounds.y + bounds.height + obstacleMargin) {
          dangerPoints.push({ pos: futurePos, type: 'obstacle', distance: distance });
        }
      }

      // Check all snakes including self
      for (let otherSnake of allSnakes) {
        if (!otherSnake.isAlive) continue;
        
        // For self, skip checking very close segments
        const startIdx = otherSnake === this.snake ? 15 : 5;
        const checkLength = otherSnake.segments.length;
        
        for (let j = startIdx; j < checkLength; j++) {
          const segment = otherSnake.segments[j];
          const dist = this.p.dist(futurePos.x, futurePos.y, segment.x, segment.y);
          const safeDistance = SEGMENT_SIZE * 2.5; // Larger safety margin
          
          if (dist < safeDistance) {
            dangerPoints.push({ 
              pos: futurePos, 
              type: otherSnake === this.snake ? 'self' : 'snake', 
              distance: distance 
            });
            break;
          }
        }
      }
    }

    return {
      inDanger: dangerPoints.length > 0,
      points: dangerPoints,
      closestDanger: dangerPoints.length > 0 ? 
        dangerPoints.reduce((min, p) => p.distance < min.distance ? p : min, dangerPoints[0]) : null
    };
  }

  isSafeDirection(targetPos, allSnakes, obstacles, lookAhead) {
    const head = this.snake.getHead();
    const desiredDir = this.p.createVector(targetPos.x - head.x, targetPos.y - head.y);
    desiredDir.normalize();
    
    // Check path to target
    for (let i = 1; i <= 3; i++) {
      const checkDist = (lookAhead / 3) * i;
      const checkPos = this.p.createVector(
        head.x + desiredDir.x * checkDist,
        head.y + desiredDir.y * checkDist
      );
      
      // No boundary checks - wrapping enabled
      
      // Obstacle check
      for (let obstacle of obstacles) {
        const bounds = obstacle.getBounds();
        if (checkPos.x > bounds.x - 10 && checkPos.x < bounds.x + bounds.width + 10 &&
            checkPos.y > bounds.y - 10 && checkPos.y < bounds.y + bounds.height + 10) {
          return false;
        }
      }
      
      // Snake check
      for (let snake of allSnakes) {
        if (!snake.isAlive) continue;
        const startIdx = snake === this.snake ? 15 : 5;
        
        for (let j = startIdx; j < snake.segments.length; j++) {
          const segment = snake.segments[j];
          if (this.p.dist(checkPos.x, checkPos.y, segment.x, segment.y) < SEGMENT_SIZE * 2) {
            return false;
          }
        }
      }
    }
    
    return true;
  }

  avoidDanger(dangerInfo, allSnakes, obstacles) {
    const head = this.snake.getHead();
    
    // Try multiple escape angles
    const testAngles = [-0.15, 0.15, -0.3, 0.3, -0.5, 0.5, -0.8, 0.8];
    let bestAngle = null;
    let bestScore = -Infinity;
    
    for (let angle of testAngles) {
      const testDir = this.snake.direction.copy();
      testDir.rotate(angle);
      testDir.normalize();
      
      const score = this.scoreDirection(testDir, allSnakes, obstacles, head);
      
      if (score > bestScore) {
        bestScore = score;
        bestAngle = angle;
      }
    }
    
    // Turn in the best direction
    if (bestAngle !== null) {
      if (bestAngle < 0) {
        this.snake.turnLeft();
      } else {
        this.snake.turnRight();
      }
    }
  }

  scoreDirection(direction, allSnakes, obstacles, startPos) {
    let score = 100;
    const testDistance = 80;
    
    // Check multiple points along this direction
    for (let i = 1; i <= 4; i++) {
      const dist = (testDistance / 4) * i;
      const pos = this.p.createVector(
        startPos.x + direction.x * dist,
        startPos.y + direction.y * dist
      );
      
      // No boundary penalties - wrapping enabled (Pac-Man style)
      
      // Penalty for obstacles
      for (let obstacle of obstacles) {
        const bounds = obstacle.getBounds();
        const centerX = bounds.x + bounds.width / 2;
        const centerY = bounds.y + bounds.height / 2;
        const obstacleDist = this.p.dist(pos.x, pos.y, centerX, centerY);
        
        if (obstacleDist < 50) {
          score -= (50 - obstacleDist) * 2;
        }
      }
      
      // Penalty for snake bodies
      for (let snake of allSnakes) {
        if (!snake.isAlive) continue;
        const startIdx = snake === this.snake ? 15 : 0;
        
        for (let j = startIdx; j < snake.segments.length; j++) {
          const segment = snake.segments[j];
          const segmentDist = this.p.dist(pos.x, pos.y, segment.x, segment.y);
          
          if (segmentDist < SEGMENT_SIZE * 3) {
            score -= (SEGMENT_SIZE * 3 - segmentDist) * 5;
          }
        }
      }
    }
    
    return score;
  }

  findSafeDirection(allSnakes, obstacles, lookAhead) {
    const head = this.snake.getHead();
    const testAngles = [-0.1, 0.1, -0.2, 0.2];
    let bestAngle = 0;
    let bestScore = -Infinity;
    
    for (let angle of testAngles) {
      const testDir = this.snake.direction.copy();
      testDir.rotate(angle);
      testDir.normalize();
      
      const score = this.scoreDirection(testDir, allSnakes, obstacles, head);
      
      if (score > bestScore) {
        bestScore = score;
        bestAngle = angle;
      }
    }
    
    if (bestAngle < -0.05) {
      this.snake.turnLeft();
    } else if (bestAngle > 0.05) {
      this.snake.turnRight();
    }
  }

  findCutoffTarget(allSnakes) {
    const head = this.snake.getHead();
    
    for (let otherSnake of allSnakes) {
      if (otherSnake === this.snake || !otherSnake.isAlive) continue;
      
      const otherHead = otherSnake.getHead();
      const dist = this.p.dist(head.x, head.y, otherHead.x, otherHead.y);
      
      if (dist < 120 && dist > 40) {
        // Predict where they'll be
        const predictedPos = this.p.createVector(
          otherHead.x + otherSnake.direction.x * 40,
          otherHead.y + otherSnake.direction.y * 40
        );
        return predictedPos;
      }
    }
    
    return null;
  }

  moveTowards(target) {
    const head = this.snake.getHead();
    const desired = this.p.createVector(target.x - head.x, target.y - head.y);
    desired.normalize();
    
    const currentAngle = Math.atan2(this.snake.direction.y, this.snake.direction.x);
    const desiredAngle = Math.atan2(desired.y, desired.x);
    let angleDiff = desiredAngle - currentAngle;
    
    // Normalize angle difference to [-PI, PI]
    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
    
    if (Math.abs(angleDiff) > 0.05) {
      if (angleDiff < 0) {
        this.snake.turnLeft();
      } else {
        this.snake.turnRight();
      }
    }
  }
}