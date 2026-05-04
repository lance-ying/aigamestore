import { PLAYER_SIZE, JUMP_FORCE, GRAVITY, CANVAS_HEIGHT, GROUND_HEIGHT, COLORS } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = PLAYER_SIZE;
    this.height = PLAYER_SIZE;
    this.velocityY = 0;
    this.isJumping = false;
    this.rotation = 0;
  }

  jump() {
    if (!this.isJumping) {
      this.velocityY = -JUMP_FORCE;
      this.isJumping = true;
    }
  }

  update(p) {
    // Apply gravity
    this.velocityY += GRAVITY;
    this.y += this.velocityY;

    // Check ground collision
    const groundY = CANVAS_HEIGHT - GROUND_HEIGHT - this.height / 2;
    if (this.y > groundY) {
      this.y = groundY;
      this.velocityY = 0;
      this.isJumping = false;
    }

    // Update rotation based on movement
    if (this.isJumping) {
      this.rotation += 0.1;
    } else {
      this.rotation = 0;
    }
  }

  draw(p) {
    p.push();
    p.translate(this.x + this.width / 2, this.y + this.height / 2);
    p.rotate(this.rotation);
    p.fill(...COLORS.player);
    p.rectMode(p.CENTER);
    p.rect(0, 0, this.width, this.height);
    p.pop();
  }

  getHitbox() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    };
  }
}

export class Obstacle {
  constructor(x, y, width, height, type = 'spike') {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = type; // 'spike', 'block', 'pit'
    this.passed = false;
  }

  update(scrollSpeed) {
    this.x -= scrollSpeed;
  }

  draw(p) {
    p.fill(...COLORS.obstacle);
    
    if (this.type === 'spike') {
      // Draw spike
      p.triangle(
        this.x, this.y + this.height,
        this.x + this.width / 2, this.y,
        this.x + this.width, this.y + this.height
      );
    } else if (this.type === 'block') {
      // Draw block
      p.rect(this.x, this.y, this.width, this.height);
    } else if (this.type === 'pit') {
      // Draw pit (just a visual indicator)
      p.fill(0, 0, 0, 100);
      p.rect(this.x, CANVAS_HEIGHT - GROUND_HEIGHT, this.width, GROUND_HEIGHT);
    }
  }

  getHitbox() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    };
  }

  isVisible() {
    return this.x + this.width > 0 && this.x < CANVAS_WIDTH;
  }
}

export class Star {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 20;
    this.rotation = 0;
    this.collected = false;
  }

  update(scrollSpeed) {
    this.x -= scrollSpeed;
    this.rotation += 0.03;
  }

  draw(p) {
    if (this.collected) return;
    
    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.rotation);
    p.fill(...COLORS.star);
    p.beginShape();
    for (let i = 0; i < 5; i++) {
      let angle = p.TWO_PI / 5 * i - p.PI / 2;
      let x1 = p.cos(angle) * this.size / 2;
      let y1 = p.sin(angle) * this.size / 2;
      p.vertex(x1, y1);
      
      angle += p.TWO_PI / 10;
      let x2 = p.cos(angle) * this.size / 4;
      let y2 = p.sin(angle) * this.size / 4;
      p.vertex(x2, y2);
    }
    p.endShape(p.CLOSE);
    p.pop();
  }

  getHitbox() {
    return {
      x: this.x - this.size / 2,
      y: this.y - this.size / 2,
      width: this.size,
      height: this.size
    };
  }

  isVisible() {
    return this.x + this.size > 0 && this.x - this.size < CANVAS_WIDTH;
  }
}

export class LevelEnd {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 50;
    this.height = CANVAS_HEIGHT - GROUND_HEIGHT - y;
  }

  update(scrollSpeed) {
    this.x -= scrollSpeed;
  }

  draw(p) {
    p.fill(0, 255, 0);
    p.rect(this.x, this.y, this.width, this.height);
    
    // Add a finish line pattern
    p.fill(0);
    const checkSize = 10;
    for (let y = this.y; y < this.y + this.height; y += checkSize * 2) {
      for (let x = this.x; x < this.x + this.width; x += checkSize * 2) {
        p.rect(x, y, checkSize, checkSize);
        p.rect(x + checkSize, y + checkSize, checkSize, checkSize);
      }
    }
  }

  getHitbox() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    };
  }
}