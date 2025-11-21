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
    this.tapMoveDistance = speed * 5; // 5x the base speed for tap-based movement
    this.tiltIncrement = 0.10; // Angle change per tap (about 6 degrees) - increased for more aggressive tilting
  }

  // Discrete movement methods for tap-based control
  moveLeft() {
    this.x -= this.tapMoveDistance;
    this.x = Math.max(this.width / 2, this.x);
  }

  moveRight() {
    this.x += this.tapMoveDistance;
    this.x = Math.min(CANVAS_WIDTH - this.width / 2, this.x);
  }

  // Discrete tilt methods for tap-based control
  tiltLeft() {
    this.angle -= this.tiltIncrement;
    this.angle = Math.max(-this.maxAngle, this.angle);
  }

  tiltRight() {
    this.angle += this.tiltIncrement;
    this.angle = Math.min(this.maxAngle, this.angle);
  }

  update() {
    // Keep within bounds
    this.x = Math.max(this.width / 2, Math.min(CANVAS_WIDTH - this.width / 2, this.x));
    // Note: angle is now controlled directly by tiltLeft/tiltRight methods
    // and persists without auto-return to neutral
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
    this.restitution = 0.65; // Bounce coefficient
    this.minBounceVelocity = 1.0; // Minimum velocity after bounce
    this.collisionCooldown = 0; // Frames to wait before processing same collision
  }

  update() {
    if (!this.active) return;

    // Always apply gravity
    this.vy += this.gravity;
    
    // Update position
    this.x += this.vx;
    this.y += this.vy;
    this.rotation += this.rotationSpeed;

    // Apply air resistance
    this.vx *= 0.995;
    this.vy *= 0.998;

    // Decrement collision cooldown
    if (this.collisionCooldown > 0) {
      this.collisionCooldown--;
    }

    // Check boundaries - bounce off walls with strong separation
    const separation = 3; // Extra pixels to push away from wall
    
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
      this.y = platTop - this.size - 3;
      
      // Calculate bounce angle based on platform tilt
      const hitOffset = (this.x - platform.x) / (platform.width / 2);
      
      // Apply bounce with platform angle influence
      const baseVelocity = Math.abs(this.vy) * 0.75;
      this.vy = -baseVelocity;
      
      // Add horizontal velocity based on:
      // 1. Where it hit on the platform (edges add more horizontal)
      // 2. Platform angle (tilt adds horizontal push)
      this.vx += hitOffset * 3;
      this.vx += Math.sin(platform.angle) * 7;
      
      // Clamp horizontal velocity
      const maxVx = 10;
      this.vx = Math.max(-maxVx, Math.min(maxVx, this.vx));
      
      this.bounceCount++;
      return true;
    }
    return false;
  }

  checkObstacleCollision(obstacle) {
    // Skip if on cooldown to prevent stuck collisions
    if (this.collisionCooldown > 0) {
      return false;
    }

    // Transform object position to obstacle's local coordinate system
    const dx = this.x - obstacle.x;
    const dy = this.y - obstacle.y;
    
    // Rotate point to align with obstacle's orientation
    const cos = Math.cos(-obstacle.angle);
    const sin = Math.sin(-obstacle.angle);
    const localX = dx * cos - dy * sin;
    const localY = dx * sin + dy * cos;
    
    // Check collision in local space (axis-aligned)
    const halfW = obstacle.width / 2;
    const halfH = obstacle.height / 2;
    
    // Find closest point on obstacle to the object center
    const closestX = Math.max(-halfW, Math.min(halfW, localX));
    const closestY = Math.max(-halfH, Math.min(halfH, localY));
    
    // Calculate distance from object center to closest point
    const distX = localX - closestX;
    const distY = localY - closestY;
    const distSq = distX * distX + distY * distY;
    
    // Check if collision occurred
    if (distSq < this.size * this.size) {
      const dist = Math.sqrt(distSq);
      
      if (dist < 0.01) {
        // Object center is inside obstacle, push out in Y direction
        const pushDir = localY > 0 ? 1 : -1;
        const pushDist = this.size + halfH - Math.abs(localY) + 6; // Increased separation
        
        // Transform push back to world space
        const worldPushX = 0;
        const worldPushY = pushDir * pushDist;
        this.y += worldPushY * cos + worldPushX * sin;
        
        // Bounce velocity
        this.vy = Math.abs(this.vy) * this.restitution * pushDir;
        this.vx *= 0.8;
        
        // Add small horizontal nudge to help slide off
        this.vx += (Math.random() - 0.5) * 0.5;
        
        this.collisionCooldown = 3; // Prevent immediate re-collision
        return true;
      }
      
      // Normal collision - push object away
      const nx = distX / dist;
      const ny = distY / dist;
      
      // Push distance - increased for better separation
      const pushDist = this.size - dist + 6;
      
      // Transform normal back to world space
      const worldNx = nx * cos + ny * sin;
      const worldNy = -nx * sin + ny * cos;
      
      // Push object out of obstacle
      this.x += worldNx * pushDist;
      this.y += worldNy * pushDist;
      
      // Calculate velocity reflection
      const dotProduct = this.vx * worldNx + this.vy * worldNy;
      
      // Only reflect if moving toward obstacle
      if (dotProduct < 0) {
        this.vx -= 2 * dotProduct * worldNx;
        this.vy -= 2 * dotProduct * worldNy;
        
        // Apply bounce damping
        this.vx *= this.restitution;
        this.vy *= this.restitution;
        
        // Add small horizontal nudge to help objects slide off horizontal surfaces
        if (Math.abs(worldNy) > 0.7) { // Mostly horizontal surface
          this.vx += (Math.random() - 0.5) * 1.0;
        }
        
        // Ensure objects don't get stuck with zero velocity
        // Only enforce minimum if velocity is very small
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed < 0.3) {
          // Give it a small push to keep moving
          this.vy += this.gravity * 2;
          this.vx += (Math.random() - 0.5) * 0.5;
        }
      }
      
      this.collisionCooldown = 3; // Prevent immediate re-collision
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

    // For level 1, use a more generous capture area to ensure objects don't rest on platform
    const isLevel1 = gameState.currentLevel === 1;
    const captureBuffer = isLevel1 ? 15 : 0;

    if (objRight > targetLeft - captureBuffer && objLeft < targetRight + captureBuffer &&
        objBottom > targetTop - captureBuffer && objTop < targetBottom) {
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
  constructor(x, y, width, height, type, moveRange = 0, moveSpeed = 0, angle = 0) {
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
    this.angle = angle; // Rotation angle in radians
  }

  update() {
    if (this.type === 'moving' && this.moveRange > 0) {
      // Move the obstacle
      this.x += this.moveSpeed * this.direction;
      
      // Calculate boundary positions
      const leftBound = this.startX - this.moveRange / 2;
      const rightBound = this.startX + this.moveRange / 2;
      
      // Check and handle boundaries
      if (this.x <= leftBound) {
        this.x = leftBound;
        this.direction = 1; // Move right
      } else if (this.x >= rightBound) {
        this.x = rightBound;
        this.direction = -1; // Move left
      }
    }
  }

  render(p) {
    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.angle);
    p.fill(this.type === 'moving' ? 169 : 139, this.type === 'moving' ? 169 : 69, this.type === 'moving' ? 169 : 19);
    p.noStroke();
    p.rectMode(p.CENTER);
    p.rect(0, 0, this.width, this.height, 3);
    
    // Add visual indicator for moving obstacles
    if (this.type === 'moving') {
      p.stroke(200);
      p.strokeWeight(2);
      p.noFill();
      p.rect(0, 0, this.width + 4, this.height + 4, 3);
    }
    p.pop();
  }
}