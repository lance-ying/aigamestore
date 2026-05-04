// player.js - Player entity and logic

import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';

export class Player {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.size = 20;
    this.speed = 2.5;
    this.direction = 0; // angle in radians
    this.velocityX = 0;
    this.velocityY = 0;
  }

  update(walls) {
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
    
    // Draw ninja body (triangle)
    this.p.fill(30, 30, 30);
    this.p.stroke(0);
    this.p.strokeWeight(1);
    this.p.triangle(
      this.size / 2, 0,
      -this.size / 2, -this.size / 3,
      -this.size / 2, this.size / 3
    );
    
    // Draw front indicator (white dot)
    this.p.fill(255);
    this.p.noStroke();
    this.p.circle(this.size / 3, 0, 4);
    
    this.p.pop();
  }

  setVelocity(vx, vy) {
    this.velocityX = vx;
    this.velocityY = vy;
  }

  attemptTakedown(enemies) {
    for (let i = enemies.length - 1; i >= 0; i--) {
      const enemy = enemies[i];
      if (!enemy.eliminated) {
        const dist = this.p.dist(this.x, this.y, enemy.x, enemy.y);
        if (dist < 30 && !enemy.isDetecting) {
          // Successful takedown
          enemy.eliminated = true;
          const points = enemy.isPrimaryTarget ? 500 : 100;
          gameState.score += points;
          
          // Remove from entities
          const entityIndex = gameState.entities.indexOf(enemy);
          if (entityIndex > -1) {
            gameState.entities.splice(entityIndex, 1);
          }
          
          return true;
        }
      }
    }
    return false;
  }

  attemptVentUse(vents) {
    for (let vent of vents) {
      const dist = this.p.dist(this.x, this.y, vent.x, vent.y);
      if (dist < 20) {
        // Teleport to linked vent
        if (vent.linkedVent) {
          this.x = vent.linkedVent.x;
          this.y = vent.linkedVent.y;
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
          barrel.explosionTimer = 20;
          
          // Check enemies in explosion radius
          let enemiesHit = 0;
          for (let enemy of enemies) {
            if (!enemy.eliminated) {
              const enemyDist = this.p.dist(barrel.x, barrel.y, enemy.x, enemy.y);
              if (enemyDist < 60) {
                enemy.eliminated = true;
                const points = enemy.isPrimaryTarget ? 500 : 100;
                gameState.score += points;
                enemiesHit++;
                
                // Remove from entities
                const entityIndex = gameState.entities.indexOf(enemy);
                if (entityIndex > -1) {
                  gameState.entities.splice(entityIndex, 1);
                }
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