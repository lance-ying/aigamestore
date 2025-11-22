import { COURT, NET, BALL_SIZE, gameState } from './globals.js';

export class Ball {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.gravity = 0.3;
    this.bounceY = y;
    this.isServing = true;
    this.hasBouncedOnce = false;
    this.lastHitBy = null;
    this.bounces = 0;
    this.trailPositions = [];
  }

  update(p) {
    if (this.isServing) return;

    // Apply gravity
    this.vy += this.gravity;

    // Update position
    this.x += this.vx;
    this.y += this.vy;

    // Add to trail
    this.trailPositions.push({ x: this.x, y: this.y });
    if (this.trailPositions.length > 5) {
      this.trailPositions.shift();
    }

    // Bounce on court
    if (this.y >= COURT.y + COURT.height - BALL_SIZE / 2) {
      this.y = COURT.y + COURT.height - BALL_SIZE / 2;
      this.vy *= -0.7;
      this.vx *= 0.95;
      this.bounces++;
      
      if (Math.abs(this.vy) < 0.5) {
        this.vy = 0;
        this.vx *= 0.9;
      }
    }

    // Net collision
    if (
      this.x >= NET.x - BALL_SIZE / 2 &&
      this.x <= NET.x + NET.width + BALL_SIZE / 2 &&
      this.y >= NET.y &&
      this.y <= NET.y + NET.height
    ) {
      if (this.vx > 0) {
        this.x = NET.x - BALL_SIZE / 2;
      } else {
        this.x = NET.x + NET.width + BALL_SIZE / 2;
      }
      this.vx *= -0.4;
      this.vy *= 0.6;
    }

    // Out of bounds checks
    if (this.x < COURT.x || this.x > COURT.x + COURT.width) {
      return 'out';
    }
    
    if (this.bounces >= 2) {
      return 'double_bounce';
    }

    return null;
  }

  draw(p) {
    // Draw trail
    for (let i = 0; i < this.trailPositions.length; i++) {
      const alpha = (i + 1) / this.trailPositions.length * 100;
      p.push();
      p.fill(200, 200, 0, alpha);
      p.noStroke();
      const size = BALL_SIZE * (0.5 + 0.5 * (i + 1) / this.trailPositions.length);
      p.circle(this.trailPositions[i].x, this.trailPositions[i].y, size);
      p.pop();
    }

    // Draw ball
    p.push();
    p.fill(200, 200, 0);
    p.stroke(150, 150, 0);
    p.strokeWeight(1);
    p.circle(this.x, this.y, BALL_SIZE);
    p.pop();
  }

  serve(direction, power) {
    this.isServing = false;
    this.hasBouncedOnce = false;
    this.bounces = 0;
    this.vx = direction * power * 0.5;
    this.vy = -power * 0.4;
  }

  hit(angle, speed, shotType) {
    this.bounces = 0;
    
    let powerMultiplier = 1;
    let verticalComponent = -0.3;
    
    if (shotType === 'DROP') {
      powerMultiplier = 0.5;
      verticalComponent = -0.6;
    } else if (shotType === 'POWER') {
      powerMultiplier = 1.5;
      verticalComponent = -0.2;
    }
    
    this.vx = Math.cos(angle) * speed * powerMultiplier;
    this.vy = verticalComponent * speed * powerMultiplier;
    this.trailPositions = [];
  }

  reset(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.isServing = true;
    this.hasBouncedOnce = false;
    this.bounces = 0;
    this.trailPositions = [];
  }
}