// entities.js - Game entity classes
import { gameState } from './globals.js';

export class Ball {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.radius = 10;
    this.spin = 0;
    this.active = false;
    this.stopped = false;
    this.outOfBounds = false;
  }

  update(p) {
    if (!this.active) return;

    // Apply velocity
    this.x += this.vx;
    this.y += this.vy;

    // Apply curve/spin effect
    if (this.spin !== 0) {
      this.vx += this.spin * 0.02;
    }

    // Apply air resistance
    this.vx *= 0.98;
    this.vy *= 0.98;

    // Apply friction when moving slowly
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (speed < 0.5) {
      this.vx *= 0.9;
      this.vy *= 0.9;
    }

    // Check if stopped
    if (speed < 0.1) {
      this.stopped = true;
      this.vx = 0;
      this.vy = 0;
    }

    // Check bounds
    if (this.x < 50 || this.x > 550 || this.y < 50 || this.y > 390) {
      this.outOfBounds = true;
    }

    // Update gameState
    gameState.ballPosition = { x: this.x, y: this.y };
    gameState.ballVelocity = { x: this.vx, y: this.vy };
    gameState.ballStopped = this.stopped;
  }

  shoot(angle, power, curve) {
    this.active = true;
    this.stopped = false;
    this.outOfBounds = false;
    
    const speed = power * 0.15;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    
    if (curve === 'LEFT') {
      this.spin = -0.5;
    } else if (curve === 'RIGHT') {
      this.spin = 0.5;
    } else {
      this.spin = 0;
    }
  }

  render(p) {
    p.push();
    p.fill(255);
    p.stroke(0);
    p.strokeWeight(2);
    p.circle(this.x, this.y, this.radius * 2);
    
    // Draw pattern
    p.noFill();
    p.stroke(0);
    p.strokeWeight(1);
    for (let i = 0; i < 5; i++) {
      const angle = (i * Math.PI * 2) / 5;
      const x2 = this.x + Math.cos(angle) * this.radius * 0.6;
      const y2 = this.y + Math.sin(angle) * this.radius * 0.6;
      p.line(this.x, this.y, x2, y2);
    }
    p.pop();
  }

  reset(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.spin = 0;
    this.active = false;
    this.stopped = false;
    this.outOfBounds = false;
  }
}

export class Defender {
  constructor(config) {
    this.type = config.type;
    this.shape = config.shape;
    this.x = config.x;
    this.y = config.y;
    this.width = config.width || 40;
    this.height = config.height || 40;
    this.radius = config.radius || 20;
    this.path = config.path;
    this.startX = config.x;
    this.startY = config.y;
    this.pathProgress = 0;
    this.hit = false;
    this.hitTimer = 0;
  }

  update(p) {
    if (this.type === 'moving' && this.path) {
      if (this.path.type === 'horizontal') {
        this.pathProgress += this.path.speed;
        const t = (Math.sin(this.pathProgress * 0.05) + 1) / 2;
        this.x = this.path.min + (this.path.max - this.path.min) * t;
      } else if (this.path.type === 'vertical') {
        this.pathProgress += this.path.speed;
        const t = (Math.sin(this.pathProgress * 0.05) + 1) / 2;
        this.y = this.path.min + (this.path.max - this.path.min) * t;
      } else if (this.path.type === 'circular') {
        this.pathProgress += this.path.speed;
        this.x = this.path.centerX + Math.cos(this.pathProgress) * this.path.radius;
        this.y = this.path.centerY + Math.sin(this.pathProgress) * this.path.radius;
      }
    }

    if (this.hit && this.hitTimer > 0) {
      this.hitTimer--;
      if (this.hitTimer <= 0) {
        this.hit = false;
      }
    }
  }

  render(p) {
    p.push();
    const color = this.hit ? [100, 150, 255] : [50, 100, 200];
    p.fill(...color);
    p.stroke(30, 60, 150);
    p.strokeWeight(2);

    if (this.shape === 'rect') {
      p.rectMode(p.CENTER);
      p.rect(this.x, this.y, this.width, this.height);
    } else if (this.shape === 'circle') {
      p.circle(this.x, this.y, this.radius * 2);
    }
    p.pop();
  }

  checkCollision(ball) {
    let collision = false;
    
    if (this.shape === 'rect') {
      collision = p5.prototype.collideCircleRect(
        ball.x, ball.y, ball.radius * 2,
        this.x - this.width / 2, this.y - this.height / 2, this.width, this.height
      );
    } else if (this.shape === 'circle') {
      collision = p5.prototype.collideCircleCircle(
        ball.x, ball.y, ball.radius * 2,
        this.x, this.y, this.radius * 2
      );
    }

    if (collision && !this.hit) {
      this.hit = true;
      this.hitTimer = 10;
      return true;
    }
    return false;
  }

  deflectBall(ball) {
    const dx = ball.x - this.x;
    const dy = ball.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    
    const nx = dx / dist;
    const ny = dy / dist;
    
    const dot = ball.vx * nx + ball.vy * ny;
    ball.vx = ball.vx - 2 * dot * nx;
    ball.vy = ball.vy - 2 * dot * ny;
    
    ball.vx *= 0.7;
    ball.vy *= 0.7;
    
    const pushDist = (this.radius || this.width / 2) + ball.radius;
    ball.x = this.x + nx * pushDist;
    ball.y = this.y + ny * pushDist;
  }

  reset() {
    this.x = this.startX;
    this.y = this.startY;
    this.pathProgress = 0;
    this.hit = false;
    this.hitTimer = 0;
  }
}

export class Goalkeeper {
  constructor(config) {
    this.x = 300;
    this.y = 70;
    this.width = 60;
    this.height = 25;
    this.speed = config.speed;
    this.coverage = config.coverage;
    this.targetX = 300;
    this.saved = false;
    this.saveTimer = 0;
  }

  update(p, ball, goalWidth) {
    const goalLeft = 300 - goalWidth / 2;
    const goalRight = 300 + goalWidth / 2;
    const moveRange = goalWidth * this.coverage;
    const minX = 300 - moveRange / 2;
    const maxX = 300 + moveRange / 2;

    if (ball.active && !ball.stopped) {
      if (ball.y < 200 && ball.vy < 0) {
        const predictedX = ball.x + (ball.vx / Math.abs(ball.vy)) * (this.y - ball.y);
        this.targetX = Math.max(minX, Math.min(maxX, predictedX));
      }
    }

    const dx = this.targetX - this.x;
    if (Math.abs(dx) > 1) {
      this.x += Math.sign(dx) * Math.min(Math.abs(dx), this.speed);
    }

    this.x = Math.max(minX, Math.min(maxX, this.x));

    if (this.saved && this.saveTimer > 0) {
      this.saveTimer--;
      if (this.saveTimer <= 0) {
        this.saved = false;
      }
    }
  }

  render(p) {
    p.push();
    const color = this.saved ? [255, 100, 100] : [200, 50, 50];
    p.fill(...color);
    p.stroke(150, 30, 30);
    p.strokeWeight(2);
    p.rectMode(p.CENTER);
    p.rect(this.x, this.y, this.width, this.height);
    
    p.fill(255);
    p.noStroke();
    p.circle(this.x - 10, this.y - 3, 6);
    p.circle(this.x + 10, this.y - 3, 6);
    p.pop();
  }

  checkCollision(ball) {
    const collision = p5.prototype.collideCircleRect(
      ball.x, ball.y, ball.radius * 2,
      this.x - this.width / 2, this.y - this.height / 2, this.width, this.height
    );

    if (collision && !this.saved) {
      this.saved = true;
      this.saveTimer = 20;
      return true;
    }
    return false;
  }

  blockBall(ball) {
    ball.vx *= -0.3;
    ball.vy *= -0.3;
    ball.y = this.y + this.height / 2 + ball.radius + 2;
  }

  reset() {
    this.x = 300;
    this.targetX = 300;
    this.saved = false;
    this.saveTimer = 0;
  }
}