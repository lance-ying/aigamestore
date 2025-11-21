// player.js - Player entity and logic

import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';

export class Player {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.size = 28; // Increased from 20 to 28 for better visibility
    this.speed = 2.5;
    this.direction = 0; // angle in radians
    this.velocityX = 0;
    this.velocityY = 0;
    
    // Smooth discrete movement properties
    this.isMoving = false;
    this.targetX = x;
    this.targetY = y;
    this.moveSpeed = 5; // Speed of smooth interpolation (pixels per frame)
  }

  update(walls) {
    // Handle smooth discrete movement
    if (this.isMoving) {
      const dx = this.targetX - this.x;
      const dy = this.targetY - this.y;
      const dist = this.p.sqrt(dx * dx + dy * dy);
      
      if (dist < this.moveSpeed) {
        // Snap to target when close enough
        this.x = this.targetX;
        this.y = this.targetY;
        this.isMoving = false;
        this.velocityX = 0;
        this.velocityY = 0;
      } else {
        // Move toward target smoothly
        const angle = this.p.atan2(dy, dx);
        const stepX = this.p.cos(angle) * this.moveSpeed;
        const stepY = this.p.sin(angle) * this.moveSpeed;
        
        // Store old position
        const oldX = this.x;
        const oldY = this.y;
        
        this.x += stepX;
        this.y += stepY;
        
        // Check wall collisions
        let collided = false;
        for (let wall of walls) {
          if (this.collidesWithWall(wall)) {
            collided = true;
            break;
          }
        }
        
        if (collided) {
          // If we hit a wall during interpolation, stop at current position
          this.x = oldX;
          this.y = oldY;
          this.targetX = oldX;
          this.targetY = oldY;
          this.isMoving = false;
          this.velocityX = 0;
          this.velocityY = 0;
        } else {
          // Update velocity for direction indicator
          this.velocityX = stepX;
          this.velocityY = stepY;
        }
      }
    } else {
      // Non-discrete movement (for test modes)
      if (this.velocityX !== 0 || this.velocityY !== 0) {
        // Store old position
        const oldX = this.x;
        const oldY = this.y;

        // Apply velocity
        this.x += this.velocityX;
        this.y += this.velocityY;

        // Check wall collisions
        for (let wall of walls) {
          if (this.collidesWithWall(wall)) {
            this.x = oldX;
            this.y = oldY;
            break;
          }
        }

        // Keep in bounds
        this.x = this.p.constrain(this.x, this.size / 2, CANVAS_WIDTH - this.size / 2);
        this.y = this.p.constrain(this.y, this.size / 2, CANVAS_HEIGHT - this.size / 2);
      }
    }

    // Update direction based on velocity
    if (this.velocityX !== 0 || this.velocityY !== 0) {
      this.direction = this.p.atan2(this.velocityY, this.velocityX);
    }
  }

  collidesWithWall(wall) {
    return this.p.collideRectRect(
      this.x - this.size / 2,
      this.y - this.size / 2,
      this.size,
      this.size,
      wall.x,
      wall.y,
      wall.w,
      wall.h
    );
  }

  render() {
    this.p.push();
    this.p.translate(this.x, this.y);
    this.p.rotate(this.direction);
    
    // Draw ninja body (triangle) with glow effect for better visibility
    this.p.fill(30, 30, 30);
    this.p.stroke(100, 150, 255);
    this.p.strokeWeight(2);
    this.p.triangle(
      this.size / 2, 0,
      -this.size / 2, -this.size / 3,
      -this.size / 2, this.size / 3
    );
    
    // Draw front indicator (white dot)
    this.p.fill(255);
    this.p.noStroke();
    this.p.circle(this.size / 3, 0, 5);
    
    this.p.pop();
  }

  setVelocity(vx, vy) {
    this.velocityX = vx;
    this.velocityY = vy;
  }
  
  setTargetPosition(targetX, targetY) {
    // Only set new target if not currently moving
    if (!this.isMoving) {
      this.targetX = targetX;
      this.targetY = targetY;
      this.isMoving = true;
      
      // Set initial direction
      const dx = targetX - this.x;
      const dy = targetY - this.y;
      if (dx !== 0 || dy !== 0) {
        this.direction = this.p.atan2(dy, dx);
      }
    }
  }

  attemptTakedown(enemies) {
    for (let i = enemies.length - 1; i >= 0; i--) {
      const enemy = enemies[i];
      if (!enemy.eliminated) {
        const dist = this.p.dist(this.x, this.y, enemy.x, enemy.y);
        if (dist < 35 && !enemy.isDetecting) {
          // Successful takedown - trigger animation
          enemy.eliminated = true;
          enemy.eliminatedTimer = 30; // 0.5 seconds fade out
          const points = enemy.isPrimaryTarget ? 500 : 100;
          gameState.score += points;
          
          // Create takedown particles
          this.createTakedownParticles(enemy.x, enemy.y);
          
          // Remove from entities after animation completes
          // (will be handled in enemy.update())
          
          return true;
        }
      }
    }
    return false;
  }

  createTakedownParticles(x, y) {
    if (!gameState.particles) {
      gameState.particles = [];
    }
    
    // Create particle burst
    for (let i = 0; i < 12; i++) {
      const angle = (this.p.TWO_PI / 12) * i;
      const speed = this.p.random(2, 4);
      gameState.particles.push({
        x: x,
        y: y,
        vx: this.p.cos(angle) * speed,
        vy: this.p.sin(angle) * speed,
        life: 30,
        maxLife: 30,
        size: this.p.random(3, 6),
        color: [150, 150, 150]
      });
    }
  }

  attemptVentUse(vents) {
    for (let vent of vents) {
      const dist = this.p.dist(this.x, this.y, vent.x, vent.y);
      if (dist < 25) {
        // Teleport to linked vent
        if (vent.linkedVent) {
          this.x = vent.linkedVent.x;
          this.y = vent.linkedVent.y;
          this.targetX = this.x;
          this.targetY = this.y;
          this.isMoving = false;
          return true;
        }
      }
    }
    return false;
  }

  attemptBarrelDetonate(barrels, enemies) {
    for (let i = barrels.length - 1; i >= 0; i--) {
      const barrel = barrels[i];
      if (!barrel.exploded) {
        const dist = this.p.dist(this.x, this.y, barrel.x, barrel.y);
        if (dist < 35) {
          barrel.exploded = true;
          barrel.explosionTimer = 30; // Increased for better visual
          
          // Create explosion particles
          barrel.createExplosionParticles();
          
          // Check enemies in explosion radius
          let enemiesHit = 0;
          for (let enemy of enemies) {
            if (!enemy.eliminated) {
              const enemyDist = this.p.dist(barrel.x, barrel.y, enemy.x, enemy.y);
              if (enemyDist < 70) {
                enemy.eliminated = true;
                enemy.eliminatedTimer = 20;
                const points = enemy.isPrimaryTarget ? 500 : 100;
                gameState.score += points;
                enemiesHit++;
                
                // Create impact particles
                this.createTakedownParticles(enemy.x, enemy.y);
              }
            }
          }
          
          if (enemiesHit > 0) {
            gameState.score += 200; // Barrel bonus
          }
          
          return true;
        }
      }
    }
    return false;
  }
}