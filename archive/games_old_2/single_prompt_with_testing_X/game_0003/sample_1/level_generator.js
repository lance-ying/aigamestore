// level_generator.js - Level generation and management
import { CANVAS_HEIGHT, CANVAS_WIDTH, gameState } from './globals.js';
import { Obstacle, MovingObstacle, Diamond } from './obstacle.js';

export class LevelGenerator {
  constructor(p) {
    this.p = p;
    this.obstacleSpacing = 250;
    this.minGapSize = 80;
    this.maxGapSize = 150;
    this.obstacleWidth = 20;
    this.levelLength = 3000; // Distance to finish line
  }
  
  generateLevel(level) {
    gameState.obstacles = [];
    gameState.diamonds = [];
    gameState.lastObstacleX = CANVAS_WIDTH;
    gameState.finishLineX = this.levelLength;
    
    // Calculate difficulty parameters
    const difficulty = Math.min(level / 10, 1);
    const gapSize = this.maxGapSize - (this.maxGapSize - this.minGapSize) * difficulty;
    const movingChance = 0.2 + difficulty * 0.3;
    
    // Generate obstacles along the course
    let x = CANVAS_WIDTH + 200;
    while (x < this.levelLength) {
      const gapY = this.p.random(40, CANVAS_HEIGHT - gapSize - 40);
      
      // Decide if this should be a moving obstacle
      if (this.p.random() < movingChance) {
        const speed = 0.02 + this.p.random(0.02);
        const amplitude = 20 + this.p.random(30);
        gameState.obstacles.push(
          new MovingObstacle(this.p, x, gapY, gapSize, this.obstacleWidth, speed, amplitude)
        );
      } else {
        gameState.obstacles.push(
          new Obstacle(this.p, x, gapY, gapSize, this.obstacleWidth)
        );
      }
      
      // Place diamonds near some obstacles
      if (this.p.random() < 0.4) {
        const diamondY = gapY + gapSize / 2;
        gameState.diamonds.push(new Diamond(this.p, x, diamondY));
      }
      
      x += this.obstacleSpacing + this.p.random(-50, 50);
      gameState.lastObstacleX = x;
    }
  }
  
  drawFinishLine(cameraOffsetX) {
    const p = this.p;
    const screenX = gameState.finishLineX - cameraOffsetX;
    
    // Only draw if on screen
    if (screenX < -50 || screenX > CANVAS_WIDTH + 50) {
      return;
    }
    
    p.push();
    
    // Checkered flag pattern
    const stripeHeight = 20;
    for (let y = 0; y < CANVAS_HEIGHT; y += stripeHeight) {
      const offset = Math.floor(y / stripeHeight) % 2 === 0 ? 0 : stripeHeight;
      for (let dy = 0; dy < stripeHeight; dy += stripeHeight) {
        if ((y + dy) % (stripeHeight * 2) < stripeHeight) {
          p.fill(255);
        } else {
          p.fill(0);
        }
        p.rect(screenX + offset, y + dy, stripeHeight, stripeHeight);
      }
    }
    
    // Border
    p.stroke(255, 215, 0);
    p.strokeWeight(3);
    p.noFill();
    p.rect(screenX, 0, stripeHeight * 2, CANVAS_HEIGHT);
    
    // "FINISH" text
    p.fill(255, 215, 0);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(20);
    p.push();
    p.translate(screenX + stripeHeight, CANVAS_HEIGHT / 2);
    p.rotate(-p.HALF_PI);
    p.text("FINISH", 0, 0);
    p.pop();
    
    p.pop();
  }
}