// entities.js - Game entity classes

import { CANVAS_HEIGHT, GROUND_HEIGHT, GRAVITY, BIRD_SIZE, EGG_SIZE, gameState } from './globals.js';

export class Bird {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.vy = 0;
    this.size = BIRD_SIZE;
    this.color = [255, 200, 50];
    this.isAlive = true;
    this.eggCount = 0;
  }

  jump() {
    this.vy = -6;
    gameState.framesSinceLastJump = 0;
  }

  update() {
    // Apply gravity
    this.vy += GRAVITY;
    this.y += this.vy;

    // Ground collision
    const groundY = CANVAS_HEIGHT - GROUND_HEIGHT - this.getStackHeight();
    if (this.y >= groundY) {
      this.y = groundY;
      this.vy = 0;
      
      // Check for perfect landing
      if (gameState.wasInAir && this.p.abs(this.y - groundY) < 2) {
        if (gameState.lastGroundTouchY === groundY) {
          gameState.perfectLandings++;
          if (gameState.perfectLandings >= 3) {
            this.activateFever();
            gameState.perfectLandings = 0;
          }
        } else {
          gameState.perfectLandings = 1;
        }
        gameState.lastGroundTouchY = groundY;
      }
      gameState.wasInAir = false;
    } else {
      gameState.wasInAir = true;
    }

    // Death if falls below screen
    if (this.y > CANVAS_HEIGHT) {
      this.isAlive = false;
    }

    gameState.framesSinceLastJump++;
  }

  activateFever() {
    gameState.feverMode = true;
    gameState.feverTimer = 300; // 5 seconds
  }

  getStackHeight() {
    return this.eggCount * EGG_SIZE;
  }

  layEgg() {
    const egg = new Egg(this.p, this.x, this.y + this.size/2);
    gameState.eggs.push(egg);
    this.eggCount++;
    return egg;
  }

  draw() {
    const p = this.p;
    p.push();
    
    // Draw egg stack
    for (let i = 0; i < this.eggCount; i++) {
      const eggY = this.y + this.size/2 + (i + 0.5) * EGG_SIZE;
      p.fill(240, 230, 200);
      p.stroke(180, 170, 150);
      p.strokeWeight(2);
      p.rect(this.x - EGG_SIZE/2, eggY - EGG_SIZE/2, EGG_SIZE, EGG_SIZE);
    }

    // Draw bird with fever effect
    if (gameState.feverMode) {
      const pulse = p.sin(p.frameCount * 0.3) * 10 + 255;
      p.fill(pulse, 100, 255);
      p.stroke(200, 50, 255);
    } else {
      p.fill(...this.color);
      p.stroke(200, 150, 30);
    }
    p.strokeWeight(2);
    p.rect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);

    // Eye
    p.fill(0);
    p.noStroke();
    p.circle(this.x + 3, this.y - 3, 4);

    // Beak
    p.fill(255, 100, 0);
    p.triangle(
      this.x + this.size/2, this.y - 2,
      this.x + this.size/2, this.y + 2,
      this.x + this.size/2 + 6, this.y
    );

    p.pop();
  }

  getBounds() {
    return {
      x: this.x - this.size/2,
      y: this.y - this.size/2,
      w: this.size,
      h: this.size + this.getStackHeight()
    };
  }
}

export class Egg {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.size = EGG_SIZE;
    this.alpha = 255;
    this.fadeSpeed = 5;
  }

  update() {
    this.alpha -= this.fadeSpeed;
    return this.alpha > 0;
  }

  draw() {
    const p = this.p;
    p.push();
    p.fill(240, 230, 200, this.alpha);
    p.stroke(180, 170, 150, this.alpha);
    p.strokeWeight(2);
    p.rect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
    p.pop();
  }
}

export class Obstacle {
  constructor(p, x, height, isGap = false) {
    this.p = p;
    this.x = x;
    this.height = height;
    this.width = 40;
    this.isGap = isGap;
    this.passed = false;
  }

  update(speed) {
    this.x -= speed;
  }

  draw() {
    const p = this.p;
    const groundY = CANVAS_HEIGHT - GROUND_HEIGHT;
    
    p.push();
    if (this.isGap) {
      // Gap - no obstacle drawn, just track position
      // Draw warning indicator
      p.fill(255, 100, 100, 100);
      p.noStroke();
      p.rect(this.x, groundY - 5, this.width, 5);
    } else {
      // Barrier
      p.fill(100, 70, 50);
      p.stroke(70, 50, 30);
      p.strokeWeight(2);
      const barrierHeight = this.height * EGG_SIZE;
      p.rect(this.x, groundY - barrierHeight, this.width, barrierHeight);
      
      // Add texture
      p.stroke(120, 90, 70);
      p.strokeWeight(1);
      for (let i = 0; i < this.height; i++) {
        p.line(this.x, groundY - i * EGG_SIZE, this.x + this.width, groundY - i * EGG_SIZE);
      }
    }
    p.pop();
  }

  isOffScreen() {
    return this.x + this.width < 0;
  }

  checkCollision(bird) {
    if (this.passed) return false;

    const birdBounds = bird.getBounds();
    const groundY = CANVAS_HEIGHT - GROUND_HEIGHT;

    if (this.isGap) {
      // Check if bird falls into gap
      if (birdBounds.x + birdBounds.w > this.x && birdBounds.x < this.x + this.width) {
        // Bird is over the gap
        if (birdBounds.y + birdBounds.h > groundY) {
          // Bird stack doesn't reach across gap
          if (!gameState.feverMode) {
            return true;
          }
        }
      }
    } else {
      // Check collision with barrier
      const barrierHeight = this.height * EGG_SIZE;
      if (this.p.collideRectRect(
        birdBounds.x, birdBounds.y, birdBounds.w, birdBounds.h,
        this.x, groundY - barrierHeight, this.width, barrierHeight
      )) {
        if (!gameState.feverMode) {
          return true;
        }
      }
    }

    // Mark as passed if bird is beyond obstacle
    if (birdBounds.x > this.x + this.width) {
      if (!this.passed) {
        this.passed = true;
        gameState.score += gameState.feverMode ? 20 : 10;
      }
    }

    return false;
  }
}

export class Feather {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.size = 15;
    this.collected = false;
    this.wobble = 0;
  }

  update(speed) {
    this.x -= speed;
    this.wobble += 0.1;
  }

  draw() {
    const p = this.p;
    p.push();
    p.translate(this.x, this.y + p.sin(this.wobble) * 3);
    p.rotate(p.sin(this.wobble * 2) * 0.2);
    
    // Feather shape
    p.fill(100, 200, 255);
    p.stroke(70, 150, 200);
    p.strokeWeight(2);
    p.ellipse(0, 0, this.size, this.size * 1.5);
    
    // Feather details
    p.stroke(70, 150, 200);
    p.strokeWeight(1);
    for (let i = -1; i <= 1; i++) {
      p.line(i * 3, -this.size/2, i * 3, this.size/2);
    }
    
    p.pop();
  }

  isOffScreen() {
    return this.x + this.size < 0;
  }

  checkCollection(bird) {
    if (this.collected) return false;
    
    const birdBounds = bird.getBounds();
    if (this.p.collideRectCircle(
      birdBounds.x, birdBounds.y, birdBounds.w, birdBounds.h,
      this.x, this.y, this.size
    )) {
      this.collected = true;
      gameState.featherCount++;
      gameState.score += 5;
      return true;
    }
    return false;
  }
}