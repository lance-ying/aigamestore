// obstacle.js
import { 
  OBSTACLE_HEIGHT, ZIPLINE_MIN_NECK, POOL_MIN_NECK, HURDLE_MIN_NECK,
  COURSE_X_OFFSET, COURSE_WIDTH, gameState 
} from './globals.js';

export class Obstacle {
  constructor(type, y) {
    this.type = type; // 'ZIPLINE', 'POOL', 'HURDLE'
    this.y = y;
    this.height = OBSTACLE_HEIGHT;
    this.passed = false;
    this.failed = false;
    
    switch (type) {
      case 'ZIPLINE':
        this.minNeck = ZIPLINE_MIN_NECK;
        this.color = [150, 100, 50];
        this.name = 'Zipline';
        break;
      case 'POOL':
        this.minNeck = POOL_MIN_NECK;
        this.color = [50, 150, 255];
        this.name = 'Pool';
        break;
      case 'HURDLE':
        this.minNeck = HURDLE_MIN_NECK;
        this.color = [100, 100, 100];
        this.name = 'Hurdle';
        break;
    }
  }

  update(p, scrollSpeed) {
    this.y += scrollSpeed;
  }

  checkCollision(p, player) {
    if (this.passed || this.failed) return;
    
    // Check if player is at the obstacle
    const playerBottom = player.y + player.size / 2;
    const obstacleTop = this.y;
    const obstacleBottom = this.y + this.height;
    
    if (playerBottom >= obstacleTop && playerBottom <= obstacleBottom + 20) {
      if (gameState.neckLength >= this.minNeck) {
        // Successfully passed
        if (!this.passed) {
          this.passed = true;
          gameState.score += 50;
          this.createSuccessParticles(p, player);
        }
      } else {
        // Failed to pass
        this.failed = true;
        return true; // Game over
      }
    }
    
    return false;
  }

  createSuccessParticles(p, player) {
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const speed = 3 + Math.random() * 2;
      gameState.particles.push({
        x: player.x,
        y: this.y + this.height / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 40,
        maxLife: 40,
        color: [255, 220, 100],
        isCorrect: true
      });
    }
  }

  render(p) {
    const x = COURSE_X_OFFSET;
    const width = COURSE_WIDTH;
    
    p.push();
    
    if (this.type === 'ZIPLINE') {
      // Draw zipline
      p.fill(...this.color);
      p.rect(x, this.y, width, 10);
      
      // Draw rope lines
      p.stroke(...this.color);
      p.strokeWeight(2);
      for (let i = 0; i < 5; i++) {
        const xPos = x + (i / 4) * width;
        p.line(xPos, this.y, xPos, this.y + this.height);
      }
      
    } else if (this.type === 'POOL') {
      // Draw water
      p.fill(...this.color, 150);
      p.rect(x, this.y, width, this.height);
      
      // Draw waves
      p.noFill();
      p.stroke(200, 230, 255);
      p.strokeWeight(2);
      for (let i = 0; i < 3; i++) {
        p.beginShape();
        for (let xx = 0; xx < width; xx += 10) {
          const wave = Math.sin((xx + gameState.frameCounter * 2) * 0.1 + i) * 3;
          p.vertex(x + xx, this.y + 10 + i * 15 + wave);
        }
        p.endShape();
      }
      
    } else if (this.type === 'HURDLE') {
      // Draw hurdle bars
      p.fill(...this.color);
      for (let i = 0; i < 3; i++) {
        const barX = x + (i / 2) * width;
        p.rect(barX - 5, this.y, 10, this.height);
      }
    }
    
    // Draw requirement text
    if (!this.passed) {
      p.fill(255);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(12);
      p.text(`Neck: ${this.minNeck}+`, x + width / 2, this.y - 15);
    }
    
    p.pop();
  }

  isOffScreen() {
    return this.y > 450;
  }
}