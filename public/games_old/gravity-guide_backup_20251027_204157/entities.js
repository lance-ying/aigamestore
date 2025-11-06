// entities.js - Game entity classes

import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';

export class Player {
  constructor(x, y, width, height, speed) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.speed = speed;
    this.baseSpeed = speed;
    this.angle = 0;
    this.maxAngle = Math.PI / 6; // 30 degrees max tilt
    this.tiltSpeed = 0.05;
  }

  update(inputState) {
    if (inputState.left) {
      this.x -= this.speed;
    }
    if (inputState.right) {
      this.x += this.speed;
    }
    
    // Handle tilting
    if (inputState.tiltLeft) {
      this.angle -= this.tiltSpeed;
      this.angle = Math.max(-this.maxAngle, this.angle);
    }
    if (inputState.tiltRight) {
      this.angle += this.tiltSpeed;
      this.angle = Math.min(this.maxAngle, this.angle);
    }
    
    // Gradually return to neutral if no tilt input
    if (!inputState.tiltLeft && !inputState.tiltRight) {
      if (Math.abs(this.angle) > 0.01) {
        this.angle *= 0.9;
      } else {
        this.angle = 0;
      }
    }
    
    // Keep within bounds
    this.x = Math.max(this.width / 2, Math.min(CANVAS_WIDTH - this.width / 2, this.x));
  }

  render(p) {
    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.angle);
    p.fill(60, 179, 113); // Medium sea green
    p.noStroke();
    p.rectMode(p.CENTER);
    p.rect(0, 0, this.width, this.height, 5);
    
    // Add visual indicator for tilt
    if (Math.abs(this.angle) > 0.01) {
      p.stroke(255, 255, 255, 150);
      p.strokeWeight(2);
      p.noFill();
      p.rect(0, 0, this.width + 4, this.height + 4, 5);
    }
    
    p.pop();
  }

  getLeft() {
    return this.x - this.width / 2;
  }

  getRight() {
    return this.x + this.width / 2;
  }

  getTop() {
    return this.y - this.height / 2;
  }

  getBottom() {
    return this.y + this.height / 2;
  }
}

export class FallingObject {
  constructor(x, y, size, type, gravity) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.type = type; // 'circle' or 'square'
    this.vx = 0;
    this.vy = 0;
    this.gravity = gravity;
    this.rotation = 0;
    this.rotationSpeed = (Math.random() - 0.5) * 0.1;
    this.active = true;
    this.bounceCount = 0;
    this.restitution = 0.6; // Bounce coefficient
    this.minBounceVelocity = 0.5; // Minimum velocity after bounce to prevent getting stuck
  }

  update() {
    if (!this.active) return;

    this.vy += this.gravity;
    this.x += this.vx;
    this.y += this.vy;
    this.rotation += this.rotationSpeed;

    // Apply air resistance
    this.vx *= 0.995;
    this.vy *= 0.998;

    // Check boundaries - bounce off walls with energy loss and strong separation
    const separation = 2; // Extra pixels to push away from wall
    
    if (this.x - this.size < 0) {
      this.x = this.size + separation;
      this.vx = Math.max(this.minBounceVelocity, Math.abs(this.vx) * this.restitution);
    } else if (this.x + this.size > CANVAS_WIDTH) {
      this.x = CANVAS_WIDTH - this.size - separation;
      this.vx = -Math.max(this.minBounceVelocity, Math.abs(this.vx) * this.restitution);
    }

    // Check if out of bounds
    if (this.y > CANVAS_HEIGHT + 50) {
      this.active = false;
    }
  }

  render(p) {
    if (!this.active) return;

    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.rotation);
    p.fill(173, 216, 230); // Light blue
    p.noStroke();
    
    if (this.type === 'circle') {
      p.ellipse(0, 0, this.size * 2);
    } else {
      p.rectMode(p.CENTER);
      p.rect(0, 0, this.size * 2, this.size * 2, 3);
    }
    p.pop();
  }

  bounceOffPlatform(platform) {
    const objLeft = this.x - this.size;
    const objRight = this.x + this.size;
    const objTop = this.y - this.size;
    const objBottom = this.y + this.size;

    const platLeft = platform.getLeft();
    const platRight = platform.getRight();
    const platTop = platform.getTop();
    const platBottom = platform.getBottom();

    // Only bounce if moving downward and overlapping
    if (this.vy > 0 && objRight > platLeft && objLeft < platRight &&
        objBottom > platTop && objTop < platBottom) {
      
      // Position object above platform with extra separation
      this.y = platTop - this.size - 2;
      
      // Calculate bounce angle based on platform tilt
      const hitOffset = (this.x - platform.x) / (platform.width / 2);
      
      // Apply bounce with platform angle influence
      const baseVelocity = Math.abs(this.vy) * 0.7;
      this.vy = -baseVelocity;
      
      // Add horizontal velocity based on:
      // 1. Where it hit on the platform (edges add more horizontal)
      // 2. Platform angle (tilt adds horizontal push)
      this.vx += hitOffset * 2.5;
      this.vx += Math.sin(platform.angle) * 6;
      
      // Clamp horizontal velocity
      const maxVx = 8;
      this.vx = Math.max(-maxVx, Math.min(maxVx, this.vx));
      
      this.bounceCount++;
      return true;
    }
    return false;
  }

  checkObstacleCollision(obstacle) {
    const objLeft = this.x - this.size;
    const objRight = this.x + this.size;
    const objTop = this.y - this.size;
    const objBottom = this.y + this.size;

    const obsLeft = obstacle.x - obstacle.width / 2;
    const obsRight = obstacle.x + obstacle.width / 2;
    const obsTop = obstacle.y - obstacle.height / 2;
    const obsBottom = obstacle.y + obstacle.height / 2;

    // Check for collision
    if (objRight > obsLeft && objLeft < obsRight &&
        objBottom > obsTop && objTop < obsBottom) {
      
      // Calculate overlap amounts
      const overlapLeft = objRight - obsLeft;
      const overlapRight = obsRight - objLeft;
      const overlapTop = objBottom - obsTop;
      const overlapBottom = obsBottom - objTop;
      
      // Find minimum overlap to determine collision side
      const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
      
      // Bounce coefficient for obstacles
      const obstacleBounce = 0.5;
      const separation = 3; // Extra pixels to push away from obstacle
      
      // Resolve collision based on smallest overlap - REMOVED velocity checks
      // This ensures objects always get separated from obstacles regardless of velocity
      if (minOverlap === overlapTop) {
        // Hit from above
        this.y = obsTop - this.size - separation;
        this.vy = -Math.max(this.minBounceVelocity, Math.abs(this.vy) * obstacleBounce);
      } else if (minOverlap === overlapBottom) {
        // Hit from below
        this.y = obsBottom + this.size + separation;
        this.vy = Math.max(this.minBounceVelocity, Math.abs(this.vy) * obstacleBounce);
      } else if (minOverlap === overlapLeft) {
        // Hit from left
        this.x = obsLeft - this.size - separation;
        this.vx = -Math.max(this.minBounceVelocity, Math.abs(this.vx) * obstacleBounce);
        // Add small upward push to help object escape
        if (Math.abs(this.vy) < 1) {
          this.vy -= 0.5;
        }
      } else if (minOverlap === overlapRight) {
        // Hit from right
        this.x = obsRight + this.size + separation;
        this.vx = Math.max(this.minBounceVelocity, Math.abs(this.vx) * obstacleBounce);
        // Add small upward push to help object escape
        if (Math.abs(this.vy) < 1) {
          this.vy -= 0.5;
        }
      }
      
      return true;
    }
    return false;
  }
}

export class TargetZone {
  constructor(x, y, width, height, speed) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.speed = speed;
    this.direction = 1;
    this.flashTimer = 0;
    this.particleEffects = [];
  }

  update() {
    if (this.speed > 0) {
      this.x += this.speed * this.direction;
      
      const leftBound = this.width / 2 + 20;
      const rightBound = CANVAS_WIDTH - this.width / 2 - 20;
      
      if (this.x <= leftBound || this.x >= rightBound) {
        this.direction *= -1;
        this.x = Math.max(leftBound, Math.min(rightBound, this.x));
      }
    }

    if (this.flashTimer > 0) {
      this.flashTimer--;
    }

    // Update particles
    for (let i = this.particleEffects.length - 1; i >= 0; i--) {
      const p = this.particleEffects[i];
      p.life--;
      p.y -= p.vy;
      p.x += p.vx;
      p.alpha = p.life / 30;
      if (p.life <= 0) {
        this.particleEffects.splice(i, 1);
      }
    }
  }

  render(p) {
    p.push();
    
    // Draw target zone
    const alpha = this.flashTimer > 0 ? 255 : 150;
    p.stroke(255, 255, 0, alpha);
    p.strokeWeight(3);
    p.noFill();
    p.rectMode(p.CENTER);
    p.rect(this.x, this.y, this.width, this.height);
    
    // Inner fill
    p.fill(255, 255, 0, this.flashTimer > 0 ? 100 : 30);
    p.noStroke();
    p.rect(this.x, this.y, this.width, this.height);
    
    p.pop();

    // Render particles
    for (const particle of this.particleEffects) {
      p.push();
      p.fill(255, 255, 0, particle.alpha * 255);
      p.noStroke();
      p.ellipse(particle.x, particle.y, particle.size);
      p.pop();
    }
  }

  checkCapture(obj) {
    const objLeft = obj.x - obj.size;
    const objRight = obj.x + obj.size;
    const objTop = obj.y - obj.size;
    const objBottom = obj.y + obj.size;

    const targetLeft = this.x - this.width / 2;
    const targetRight = this.x + this.width / 2;
    const targetTop = this.y - this.height / 2;
    const targetBottom = this.y + this.height / 2;

    if (objRight > targetLeft && objLeft < targetRight &&
        objBottom > targetTop && objTop < targetBottom) {
      this.triggerEffect(obj.x, obj.y);
      return true;
    }
    return false;
  }

  triggerEffect(x, y) {
    this.flashTimer = 15;
    
    // Create particle effect
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      this.particleEffects.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * 2,
        vy: Math.sin(angle) * 2 + 2,
        size: 6,
        life: 30,
        alpha: 1
      });
    }
  }

  getLeft() {
    return this.x - this.width / 2;
  }

  getRight() {
    return this.x + this.width / 2;
  }

  getTop() {
    return this.y - this.height / 2;
  }

  getBottom() {
    return this.y + this.height / 2;
  }
}

export class Obstacle {
  constructor(x, y, width, height, type, moveRange = 0, moveSpeed = 0) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = type; // 'static' or 'moving'
    this.moveRange = moveRange;
    this.moveSpeed = moveSpeed;
    this.startX = x;
    this.startY = y;
    this.direction = 1;
  }

  update() {
    if (this.type === 'moving' && this.moveRange > 0) {
      this.x += this.moveSpeed * this.direction;
      
      if (Math.abs(this.x - this.startX) > this.moveRange / 2) {
        this.direction *= -1;
        this.x = this.startX + (this.moveRange / 2) * this.direction;
      }
    }
  }

  render(p) {
    p.push();
    p.fill(this.type === 'moving' ? 169 : 139, this.type === 'moving' ? 169 : 69, this.type === 'moving' ? 169 : 19);
    p.noStroke();
    p.rectMode(p.CENTER);
    p.rect(this.x, this.y, this.width, this.height, 3);
    
    // Add visual indicator for moving obstacles
    if (this.type === 'moving') {
      p.stroke(200);
      p.strokeWeight(2);
      p.noFill();
      p.rect(this.x, this.y, this.width + 4, this.height + 4, 3);
    }
    p.pop();
  }
}