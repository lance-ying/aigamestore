// entities.js - Game entities (Player, NumberBall)

import { PLAYER_WIDTH, PLAYER_HEIGHT, PLAYER_SPEED, CANVAS_WIDTH, CANVAS_HEIGHT, BALL_RADIUS } from './globals.js';
import { isPrime } from './utils.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = PLAYER_WIDTH;
    this.height = PLAYER_HEIGHT;
    this.speed = PLAYER_SPEED;
    this.type = 'player';
  }
  
  update(moveLeft, moveRight) {
    if (moveLeft) {
      this.x = Math.max(this.width / 2, this.x - this.speed);
    }
    if (moveRight) {
      this.x = Math.min(CANVAS_WIDTH - this.width / 2, this.x + this.speed);
    }
  }
  
  draw(p) {
    p.push();
    p.translate(this.x, this.y);
    
    // Body (basket/collector shape)
    p.fill(70, 130, 220);
    p.stroke(40, 80, 180);
    p.strokeWeight(2);
    p.rect(-this.width / 2, -this.height / 2, this.width, this.height, 5);
    
    // Top rim
    p.fill(255, 200, 100);
    p.noStroke();
    p.rect(-this.width / 2, -this.height / 2, this.width, 8, 5);
    
    // Handle indicators
    p.fill(200, 100, 100);
    p.circle(-this.width / 2 + 8, -this.height / 2 + 4, 6);
    p.circle(this.width / 2 - 8, -this.height / 2 + 4, 6);
    
    p.pop();
  }
}

export class NumberBall {
  constructor(x, y, number, fallSpeed) {
    this.x = x;
    this.y = y;
    this.number = number;
    this.fallSpeed = fallSpeed;
    this.radius = BALL_RADIUS;
    this.type = 'numberBall';
    this.isPrime = isPrime(number);
    this.sliced = false;
    this.collected = false;
    this.alpha = 255; // For fade out effect
    this.pulsePhase = Math.random() * Math.PI * 2;
  }
  
  update() {
    this.y += this.fallSpeed;
    this.pulsePhase += 0.1;
  }
  
  isOffScreen() {
    return this.y - this.radius > CANVAS_HEIGHT;
  }
  
  draw(p) {
    if (this.collected) return;
    
    p.push();
    
    const pulse = Math.sin(this.pulsePhase) * 2;
    const currentRadius = this.radius + pulse;
    
    // Outer glow
    p.noStroke();
    if (this.isPrime) {
      p.fill(100, 200, 100, 50);
    } else {
      p.fill(220, 100, 100, 50);
    }
    p.circle(this.x, this.y, currentRadius * 2.4);
    
    // Main ball
    if (this.isPrime) {
      p.fill(80, 220, 120, this.alpha);
      p.stroke(60, 180, 90);
    } else {
      p.fill(230, 120, 100, this.alpha);
      p.stroke(200, 90, 70);
    }
    p.strokeWeight(3);
    p.circle(this.x, this.y, currentRadius * 2);
    
    // Inner highlight
    p.noStroke();
    if (this.isPrime) {
      p.fill(150, 255, 180, this.alpha * 0.6);
    } else {
      p.fill(255, 180, 160, this.alpha * 0.6);
    }
    p.circle(this.x - currentRadius * 0.3, this.y - currentRadius * 0.3, currentRadius * 0.6);
    
    // Number text
    p.fill(255, 255, 255, this.alpha);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(this.number > 99 ? 16 : 20);
    p.textStyle(p.BOLD);
    p.text(this.number, this.x, this.y);
    
    p.pop();
  }
}

export class PrimeFactorBall extends NumberBall {
  constructor(x, y, number, fallSpeed, parentX, parentY) {
    super(x, y, number, fallSpeed);
    this.vx = (x - parentX) * 0.1; // Velocity away from parent
    this.vy = -2; // Initial upward velocity
    this.gravity = 0.15;
    this.type = 'primeFactorBall';
    this.bounced = false;
  }
  
  update() {
    // Apply physics
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity;
    
    // Slow down horizontal velocity
    this.vx *= 0.98;
    
    // After bouncing, fall normally
    if (this.bounced) {
      this.y += this.fallSpeed;
    }
    
    // Check if settled
    if (this.vy > 0 && !this.bounced) {
      this.bounced = true;
    }
    
    this.pulsePhase += 0.1;
  }
}