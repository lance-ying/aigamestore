// ai.js - AI snake behaviors

import { SEGMENT_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class AIController {
  constructor(p, snake, config) {
    this.p = p;
    this.snake = snake;
    this.config = config;
    this.updateTimer = 0;
    this.updateInterval = 10;
    this.targetPellet = null;
  }

  update(pellets, massDrops, allSnakes, obstacles) {
    if (!this.snake.isAlive) return;

    this.updateTimer++;
    if (this.updateTimer < this.updateInterval) return;
    this.updateTimer = 0;

    const head = this.snake.getHead();
    
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

    // Check for danger
    const dangerDirection = this.checkDanger(allSnakes, obstacles);
    
    // Decide action
    if (dangerDirection) {
      // Avoid danger
      this.avoidDanger(dangerDirection);
    } else if (this.p.random() < this.config.aiAggression && allSnakes.length > 0) {
      // Try to cut off another snake
      const target = this.findCutoffTarget(allSnakes);
      if (target) {
        this.moveTowards(target);
      } else if (nearestFood) {
        this.moveTowards(nearestFood.pos);
      }
    } else if (nearestFood) {
      // Move towards food
      this.moveTowards(nearestFood.pos);
    }
  }

  checkDanger(allSnakes, obstacles) {
    const head = this.snake.getHead();
    const lookAhead = 40;
    const futurePos = this.p.createVector(
      head.x + this.snake.direction.x * lookAhead,
      head.y + this.snake.direction.y * lookAhead
    );

    // Check boundaries
    if (futurePos.x < 30 || futurePos.x > CANVAS_WIDTH - 30 ||
        futurePos.y < 30 || futurePos.y > CANVAS_HEIGHT - 30) {
      return this.snake.direction.copy();
    }

    // Check obstacles
    for (let obstacle of obstacles) {
      const bounds = obstacle.getBounds();
      if (futurePos.x > bounds.x && futurePos.x < bounds.x + bounds.width &&
          futurePos.y > bounds.y && futurePos.y < bounds.y + bounds.height) {
        return this.snake.direction.copy();
      }
    }

    // Check other snakes
    for (let otherSnake of allSnakes) {
      if (otherSnake === this.snake || !otherSnake.isAlive) continue;
      
      for (let i = 5; i < otherSnake.segments.length; i++) {
        const segment = otherSnake.segments[i];
        const dist = this.p.dist(futurePos.x, futurePos.y, segment.x, segment.y);
        if (dist < SEGMENT_SIZE * 2) {
          return this.snake.direction.copy();
        }
      }
    }

    return null;
  }

  avoidDanger(dangerDir) {
    const head = this.snake.getHead();
    const perpendicular = this.p.createVector(-dangerDir.y, dangerDir.x);
    
    // Try both perpendicular directions
    const option1 = perpendicular.copy();
    const option2 = this.p.createVector(-perpendicular.x, -perpendicular.y);
    
    // Pick the one that's safer
    const testDist = 30;
    const pos1 = this.p.createVector(head.x + option1.x * testDist, head.y + option1.y * testDist);
    const pos2 = this.p.createVector(head.x + option2.x * testDist, head.y + option2.y * testDist);
    
    const score1 = this.scorePosition(pos1);
    const score2 = this.scorePosition(pos2);
    
    const chosenDir = score1 > score2 ? option1 : option2;
    
    // Turn towards chosen direction
    const angleDiff = this.snake.direction.angleBetween(chosenDir);
    if (angleDiff < -0.1) {
      this.snake.turnLeft();
    } else if (angleDiff > 0.1) {
      this.snake.turnRight();
    }
  }

  scorePosition(pos) {
    let score = 100;
    
    // Penalize near boundaries
    const distToBoundary = Math.min(
      pos.x - 20,
      CANVAS_WIDTH - 20 - pos.x,
      pos.y - 20,
      CANVAS_HEIGHT - 20 - pos.y
    );
    score -= Math.max(0, 50 - distToBoundary);
    
    return score;
  }

  findCutoffTarget(allSnakes) {
    const head = this.snake.getHead();
    
    for (let otherSnake of allSnakes) {
      if (otherSnake === this.snake || !otherSnake.isAlive) continue;
      
      const otherHead = otherSnake.getHead();
      const dist = this.p.dist(head.x, head.y, otherHead.x, otherHead.y);
      
      if (dist < 150 && dist > 30) {
        // Try to predict where they'll be and cut them off
        const predictedPos = this.p.createVector(
          otherHead.x + otherSnake.direction.x * 50,
          otherHead.y + otherSnake.direction.y * 50
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
    
    const angleDiff = this.snake.direction.angleBetween(desired);
    
    if (Math.abs(angleDiff) > 0.1) {
      if (angleDiff < 0) {
        this.snake.turnLeft();
      } else {
        this.snake.turnRight();
      }
    }
  }
}