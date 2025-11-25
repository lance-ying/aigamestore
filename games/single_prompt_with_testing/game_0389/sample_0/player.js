// player.js - Player entity
import { gameState, PLAYER_SIZE, MOVE_SPEED, JUMP_FORCE, GRAVITY, CANVAS_HEIGHT } from './globals.js';

export class Player {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.width = PLAYER_SIZE;
    this.height = PLAYER_SIZE;
    this.grounded = false;
    this.facingRight = true;
    this.jumpCount = 0;
    this.maxJumps = 1;
    this.animationFrame = 0;
  }

  update(keys) {
    const p = this.p;
    
    // Horizontal movement
    if (keys.left) {
      this.vx = -MOVE_SPEED;
      this.facingRight = false;
    } else if (keys.right) {
      this.vx = MOVE_SPEED;
      this.facingRight = true;
    } else {
      this.vx *= 0.8; // Friction
    }

    // Jumping
    if (keys.up && this.jumpCount < this.maxJumps) {
      this.vy = JUMP_FORCE;
      this.jumpCount++;
      this.grounded = false;
    }

    // Gravity
    this.vy += GRAVITY;
    if (this.vy > 15) this.vy = 15; // Terminal velocity

    // Update position
    this.x += this.vx;
    this.y += this.vy;

    // Check ground collision
    this.grounded = false;
    for (let platform of gameState.platforms) {
      if (this.checkPlatformCollision(platform)) {
        this.grounded = true;
        this.jumpCount = 0;
        break;
      }
    }

    // Check movable object collisions
    for (let obj of gameState.movableObjects) {
      if (obj !== gameState.grabbedObject) {
        this.checkMovableCollision(obj);
      }
    }

    // Boundary checks
    if (this.x < this.width / 2) this.x = this.width / 2;
    if (this.x > gameState.levelWidth - this.width / 2) {
      this.x = gameState.levelWidth - this.width / 2;
    }

    // Death by falling
    if (this.y > CANVAS_HEIGHT + 50) {
      gameState.health = 0;
    }

    // Animation
    this.animationFrame += 0.1;
  }

  checkPlatformCollision(platform) {
    const p = this.p;
    // Check if falling onto platform
    if (this.vy >= 0 &&
        this.x + this.width / 2 > platform.x &&
        this.x - this.width / 2 < platform.x + platform.width &&
        this.y + this.height / 2 >= platform.y &&
        this.y + this.height / 2 <= platform.y + 15) {
      this.y = platform.y - this.height / 2;
      this.vy = 0;
      return true;
    }

    // Check horizontal collisions
    if (this.x + this.width / 2 > platform.x &&
        this.x - this.width / 2 < platform.x + platform.width &&
        this.y + this.height / 2 > platform.y &&
        this.y - this.height / 2 < platform.y + platform.height) {
      
      // Left side collision
      if (this.vx > 0 && this.x < platform.x + platform.width / 2) {
        this.x = platform.x - this.width / 2;
        this.vx = 0;
      }
      // Right side collision
      else if (this.vx < 0 && this.x > platform.x + platform.width / 2) {
        this.x = platform.x + platform.width + this.width / 2;
        this.vx = 0;
      }
    }

    // Check ceiling collision
    if (this.vy < 0 &&
        this.x + this.width / 2 > platform.x &&
        this.x - this.width / 2 < platform.x + platform.width &&
        this.y - this.height / 2 <= platform.y + platform.height &&
        this.y - this.height / 2 >= platform.y) {
      this.y = platform.y + platform.height + this.height / 2;
      this.vy = 0;
    }

    return false;
  }

  checkMovableCollision(obj) {
    const p = this.p;
    const dist = p.dist(this.x, this.y + this.height / 2, obj.x, obj.y);
    
    if (dist < this.width / 2 + obj.radius) {
      // Stand on top of object
      if (this.vy >= 0 && this.y < obj.y) {
        const angle = p.atan2(this.y - obj.y, this.x - obj.x);
        this.y = obj.y - obj.radius - this.height / 2;
        this.vy = 0;
        this.grounded = true;
        this.jumpCount = 0;
      } else {
        // Push away
        const angle = p.atan2(this.y - obj.y, this.x - obj.x);
        const overlap = (this.width / 2 + obj.radius) - dist;
        this.x += p.cos(angle) * overlap;
        this.y += p.sin(angle) * overlap;
      }
    }
  }

  draw(cameraX) {
    const p = this.p;
    const screenX = this.x - cameraX;
    
    p.push();
    p.translate(screenX, this.y);
    
    // Body (robot body)
    p.fill(100, 200, 255);
    p.stroke(50, 100, 200);
    p.strokeWeight(2);
    p.rect(-this.width / 2, -this.height / 2, this.width, this.height, 3);
    
    // Eye
    const eyeX = this.facingRight ? 3 : -3;
    p.fill(255, 255, 100);
    p.noStroke();
    p.circle(eyeX, -3, 6);
    
    // Antenna
    p.stroke(50, 100, 200);
    p.strokeWeight(2);
    p.line(0, -this.height / 2, 0, -this.height / 2 - 5);
    p.fill(255, 100, 100);
    p.noStroke();
    p.circle(0, -this.height / 2 - 5, 4);
    
    // Legs (animated)
    const legOffset = Math.sin(this.animationFrame) * 3;
    p.stroke(50, 100, 200);
    p.strokeWeight(2);
    p.line(-5, this.height / 2, -5, this.height / 2 + 4 + legOffset);
    p.line(5, this.height / 2, 5, this.height / 2 + 4 - legOffset);
    
    p.pop();
  }

  getScreenX(cameraX) {
    return this.x - cameraX;
  }
}