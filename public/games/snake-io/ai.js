// ai.js - AI snake behaviors

import { SEGMENT_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class AIController {
  constructor(p, snake, config) {
    this.p = p;
    this.snake = snake;
    this.config = config;
    this.updateTimer = 0;
    this.updateInterval = 3; // More frequent updates for better responsiveness
    this.targetPellet = null;
    this.panicMode = false;
    this.aggressionTimer = 0;
  }

  update(pellets, massDrops, allSnakes, obstacles) {
    if (!this.snake.isAlive) return;

    this.updateTimer++;
    if (this.updateTimer < this.updateInterval) return;
    this.updateTimer = 0;
    this.aggressionTimer++;

    const head = this.snake.getHead();
    
    // Dynamic lookahead based on speed and length - more sophisticated
    const speedMultiplier = this.snake.speed / 2;
    const lengthFactor = Math.min(this.snake.segments.length / 30, 2.5);
    const baseLookAhead = 80;
    const lookAhead = baseLookAhead * lengthFactor * speedMultiplier;
    
    // Check for immediate danger with extended lookahead
    const dangerInfo = this.checkDanger(allSnakes, obstacles, lookAhead);
    
    // Find nearest food with priority for mass drops
    const allFood = [...pellets, ...massDrops];
    let nearestFood = null;
    let nearestDist = Infinity;
    
    for (let food of allFood) {
      const dist = this.p.dist(head.x, head.y, food.pos.x, food.pos.y);
      // Mass drops are worth more, so prioritize them
      const effectiveDist = food.value > 1 ? dist * 0.7 : dist;
      if (effectiveDist < nearestDist) {
        nearestDist = effectiveDist;
        nearestFood = food;
      }
    }

    // Enhanced decision making with better priorities
    if (dangerInfo.inDanger) {
      // Critical: Avoid danger immediately with smart avoidance
      this.panicMode = true;
      this.avoidDanger(dangerInfo, allSnakes, obstacles, lookAhead);
    } else {
      this.panicMode = false;
      
      // Periodic aggression checks - more frequent at higher levels
      const aggressionChance = this.config.aiAggression * (1 + this.aggressionTimer / 300);
      
      if (this.p.random() < aggressionChance && this.snake.segments.length > 15) {
        // Try to find a target to cut off
        const target = this.findCutoffTarget(allSnakes);
        if (target) {
          const targetSafe = this.isSafeDirection(target, allSnakes, obstacles, lookAhead * 0.6);
          if (targetSafe) {
            this.moveTowards(target);
            this.aggressionTimer = 0; // Reset timer after aggressive action
            return;
          }
        }
      }
      
      // Smart food seeking with path validation
      if (nearestFood) {
        if (this.isSafeDirection(nearestFood.pos, allSnakes, obstacles, lookAhead * 0.7)) {
          this.moveTowards(nearestFood.pos);
        } else {
          // Food path is dangerous, find alternate safe direction
          this.findSafeDirection(allSnakes, obstacles, lookAhead);
        }
      } else {
        // No food visible, maintain safe movement
        this.findSafeDirection(allSnakes, obstacles, lookAhead);
      }
    }
  }

  checkDanger(allSnakes, obstacles, lookAhead) {
    const head = this.snake.getHead();
    const dangerPoints = [];
    
    // Check multiple points along projected path with higher resolution
    const checkPoints = 8;
    for (let i = 1; i <= checkPoints; i++) {
      const distance = (lookAhead / checkPoints) * i;
      const futurePos = this.p.createVector(
        head.x + this.snake.direction.x * distance,
        head.y + this.snake.direction.y * distance
      );

      // Wrap coordinates for boundary checking
      this.wrapPosition(futurePos);

      // Check obstacles with safety margin
      for (let obstacle of obstacles) {
        const bounds = obstacle.getBounds();
        const obstacleMargin = 20; // Increased safety margin
        if (futurePos.x > bounds.x - obstacleMargin && futurePos.x < bounds.x + bounds.width + obstacleMargin &&
            futurePos.y > bounds.y - obstacleMargin && futurePos.y < bounds.y + bounds.height + obstacleMargin) {
          dangerPoints.push({ pos: futurePos, type: 'obstacle', distance: distance, severity: 3 });
        }
      }

      // Check all snakes including self
      for (let otherSnake of allSnakes) {
        if (!otherSnake.isAlive) continue;
        
        // For self, skip head segments to allow tight turns
        const startIdx = otherSnake === this.snake ? 20 : 3;
        const checkLength = otherSnake.segments.length;
        
        for (let j = startIdx; j < checkLength; j++) {
          const segment = otherSnake.segments[j];
          const dist = this.p.dist(futurePos.x, futurePos.y, segment.x, segment.y);
          const safeDistance = SEGMENT_SIZE * 3; // Increased safety distance
          
          if (dist < safeDistance) {
            const severity = otherSnake === this.snake ? 2 : 3;
            dangerPoints.push({ 
              pos: futurePos, 
              type: otherSnake === this.snake ? 'self' : 'snake', 
              distance: distance,
              severity: severity
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

  wrapPosition(pos) {
    if (pos.x < 0) pos.x = CANVAS_WIDTH;
    if (pos.x > CANVAS_WIDTH) pos.x = 0;
    if (pos.y < 0) pos.y = CANVAS_HEIGHT;
    if (pos.y > CANVAS_HEIGHT) pos.y = 0;
  }

  isSafeDirection(targetPos, allSnakes, obstacles, lookAhead) {
    const head = this.snake.getHead();
    const desiredDir = this.p.createVector(targetPos.x - head.x, targetPos.y - head.y);
    desiredDir.normalize();
    
    // Check multiple points along path with higher resolution
    const checkSteps = 5;
    for (let i = 1; i <= checkSteps; i++) {
      const checkDist = (lookAhead / checkSteps) * i;
      const checkPos = this.p.createVector(
        head.x + desiredDir.x * checkDist,
        head.y + desiredDir.y * checkDist
      );
      
      this.wrapPosition(checkPos);
      
      // Obstacle check with margin
      for (let obstacle of obstacles) {
        const bounds = obstacle.getBounds();
        const margin = 15;
        if (checkPos.x > bounds.x - margin && checkPos.x < bounds.x + bounds.width + margin &&
            checkPos.y > bounds.y - margin && checkPos.y < bounds.y + bounds.height + margin) {
          return false;
        }
      }
      
      // Snake check with appropriate starting index
      for (let snake of allSnakes) {
        if (!snake.isAlive) continue;
        const startIdx = snake === this.snake ? 20 : 3;
        
        for (let j = startIdx; j < snake.segments.length; j++) {
          const segment = snake.segments[j];
          if (this.p.dist(checkPos.x, checkPos.y, segment.x, segment.y) < SEGMENT_SIZE * 2.5) {
            return false;
          }
        }
      }
    }
    
    return true;
  }

  avoidDanger(dangerInfo, allSnakes, obstacles, lookAhead) {
    const head = this.snake.getHead();
    
    // Try multiple escape angles with wider range
    const testAngles = [-0.1, 0.1, -0.2, 0.2, -0.35, 0.35, -0.5, 0.5, -0.7, 0.7, -0.9, 0.9];
    let bestAngle = null;
    let bestScore = -Infinity;
    
    for (let angle of testAngles) {
      const testDir = this.snake.direction.copy();
      testDir.rotate(angle);
      testDir.normalize();
      
      const score = this.scoreDirection(testDir, allSnakes, obstacles, head, lookAhead);
      
      if (score > bestScore) {
        bestScore = score;
        bestAngle = angle;
      }
    }
    
    // Turn in the best direction with urgency
    if (bestAngle !== null) {
      if (bestAngle < 0) {
        this.snake.turnLeft();
      } else {
        this.snake.turnRight();
      }
      
      // Extra turn if danger is very close
      if (dangerInfo.closestDanger && dangerInfo.closestDanger.distance < 30) {
        if (bestAngle < 0) {
          this.snake.turnLeft();
        } else {
          this.snake.turnRight();
        }
      }
    }
  }

  scoreDirection(direction, allSnakes, obstacles, startPos, lookAhead) {
    let score = 150; // Higher base score
    const testDistance = lookAhead * 1.2; // Look further ahead
    
    // Check multiple points along this direction
    const steps = 6;
    for (let i = 1; i <= steps; i++) {
      const dist = (testDistance / steps) * i;
      const pos = this.p.createVector(
        startPos.x + direction.x * dist,
        startPos.y + direction.y * dist
      );
      
      this.wrapPosition(pos);
      
      // Penalty for obstacles - higher penalty for closer ones
      for (let obstacle of obstacles) {
        const bounds = obstacle.getBounds();
        const centerX = bounds.x + bounds.width / 2;
        const centerY = bounds.y + bounds.height / 2;
        const obstacleDist = this.p.dist(pos.x, pos.y, centerX, centerY);
        
        if (obstacleDist < 60) {
          const penalty = (60 - obstacleDist) * 3;
          score -= penalty;
        }
      }
      
      // Penalty for snake bodies - weighted by distance
      for (let snake of allSnakes) {
        if (!snake.isAlive) continue;
        const startIdx = snake === this.snake ? 20 : 0;
        
        for (let j = startIdx; j < snake.segments.length; j++) {
          const segment = snake.segments[j];
          const segmentDist = this.p.dist(pos.x, pos.y, segment.x, segment.y);
          
          if (segmentDist < SEGMENT_SIZE * 4) {
            const penalty = (SEGMENT_SIZE * 4 - segmentDist) * 6;
            score -= penalty;
          }
        }
      }
      
      // Bonus for open space further ahead
      if (i > steps / 2) {
        score += 5;
      }
    }
    
    return score;
  }

  findSafeDirection(allSnakes, obstacles, lookAhead) {
    const head = this.snake.getHead();
    const testAngles = [-0.08, 0.08, -0.15, 0.15, -0.25, 0.25];
    let bestAngle = 0;
    let bestScore = -Infinity;
    
    for (let angle of testAngles) {
      const testDir = this.snake.direction.copy();
      testDir.rotate(angle);
      testDir.normalize();
      
      const score = this.scoreDirection(testDir, allSnakes, obstacles, head, lookAhead);
      
      if (score > bestScore) {
        bestScore = score;
        bestAngle = angle;
      }
    }
    
    if (Math.abs(bestAngle) > 0.05) {
      if (bestAngle < 0) {
        this.snake.turnLeft();
      } else {
        this.snake.turnRight();
      }
    }
  }

  findCutoffTarget(allSnakes) {
    const head = this.snake.getHead();
    let bestTarget = null;
    let bestScore = -Infinity;
    
    for (let otherSnake of allSnakes) {
      if (otherSnake === this.snake || !otherSnake.isAlive) continue;
      
      const otherHead = otherSnake.getHead();
      const dist = this.p.dist(head.x, head.y, otherHead.x, otherHead.y);
      
      // Look for snakes at optimal cutoff distance
      if (dist > 50 && dist < 150) {
        // Predict their future position more accurately
        const predictionDistance = 50 + (dist * 0.3);
        const predictedPos = this.p.createVector(
          otherHead.x + otherSnake.direction.x * predictionDistance,
          otherHead.y + otherSnake.direction.y * predictionDistance
        );
        
        this.wrapPosition(predictedPos);
        
        // Score based on: closer is better, bigger snakes are better targets if we're bigger
        const sizeAdvantage = this.snake.segments.length - otherSnake.segments.length;
        const score = (150 - dist) + (sizeAdvantage > 0 ? sizeAdvantage * 2 : sizeAdvantage * 0.5);
        
        if (score > bestScore) {
          bestScore = score;
          bestTarget = predictedPos;
        }
      }
    }
    
    return bestTarget;
  }

  moveTowards(target) {
    const head = this.snake.getHead();
    const desired = this.p.createVector(target.x - head.x, target.y - head.y);
    
    // Handle wrapping for shortest path
    if (Math.abs(desired.x) > CANVAS_WIDTH / 2) {
      desired.x = desired.x > 0 ? desired.x - CANVAS_WIDTH : desired.x + CANVAS_WIDTH;
    }
    if (Math.abs(desired.y) > CANVAS_HEIGHT / 2) {
      desired.y = desired.y > 0 ? desired.y - CANVAS_HEIGHT : desired.y + CANVAS_HEIGHT;
    }
    
    desired.normalize();
    
    const currentAngle = Math.atan2(this.snake.direction.y, this.snake.direction.x);
    const desiredAngle = Math.atan2(desired.y, desired.x);
    let angleDiff = desiredAngle - currentAngle;
    
    // Normalize angle difference to [-PI, PI]
    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
    
    // Turn more smoothly
    const turnThreshold = 0.05;
    if (Math.abs(angleDiff) > turnThreshold) {
      if (angleDiff < 0) {
        this.snake.turnLeft();
      } else {
        this.snake.turnRight();
      }
    }
  }
}