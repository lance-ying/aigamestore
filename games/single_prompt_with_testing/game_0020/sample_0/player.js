// player.js - Player character class
import { GRAVITY, JUMP_FORCE, MOVE_SPEED, SPRINT_MULTIPLIER, CANVAS_HEIGHT } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 16;
    this.height = 32;
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
    this.crouching = false;
    this.facing = 1; // 1 = right, -1 = left
    this.pushing = false;
    this.alive = true;
    this.interactingWith = null;
  }

  update(keys, obstacles, interactables) {
    if (!this.alive) return;

    // Horizontal movement
    let speed = MOVE_SPEED;
    if (keys.shift && !this.crouching) {
      speed *= SPRINT_MULTIPLIER;
    }

    if (keys.left) {
      this.vx = -speed;
      this.facing = -1;
    } else if (keys.right) {
      this.vx = speed;
      this.facing = 1;
    } else {
      this.vx = 0;
    }

    // Crouching
    this.crouching = keys.down;
    
    // Jumping
    if (keys.up && this.onGround && !this.crouching) {
      this.vy = JUMP_FORCE;
      this.onGround = false;
    }

    // Apply gravity
    this.vy += GRAVITY;

    // Apply velocity
    this.x += this.vx;
    this.y += this.vy;

    // Collision detection with obstacles
    this.onGround = false;
    
    for (let obs of obstacles) {
      if (this.checkCollision(obs)) {
        this.resolveCollision(obs);
      }
    }

    // Check interaction with objects
    this.pushing = false;
    this.interactingWith = null;
    
    if (keys.space) {
      for (let obj of interactables) {
        if (obj.type === 'box' && this.isNear(obj)) {
          this.pushing = true;
          this.interactingWith = obj;
          obj.push(this.facing, this.vx, obstacles);
          break;
        }
      }
    }

    // Prevent falling below ground
    if (this.y > CANVAS_HEIGHT - this.height) {
      this.y = CANVAS_HEIGHT - this.height;
      this.vy = 0;
      this.onGround = true;
    }

    // Cap falling speed
    if (this.vy > 15) this.vy = 15;
  }

  checkCollision(obs) {
    return this.x < obs.x + obs.width &&
           this.x + this.width > obs.x &&
           this.y < obs.y + obs.height &&
           this.y + this.height > obs.y;
  }

  resolveCollision(obs) {
    const overlapLeft = (this.x + this.width) - obs.x;
    const overlapRight = (obs.x + obs.width) - this.x;
    const overlapTop = (this.y + this.height) - obs.y;
    const overlapBottom = (obs.y + obs.height) - this.y;

    const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

    if (minOverlap === overlapTop && this.vy > 0) {
      this.y = obs.y - this.height;
      this.vy = 0;
      this.onGround = true;
    } else if (minOverlap === overlapBottom && this.vy < 0) {
      this.y = obs.y + obs.height;
      this.vy = 0;
    } else if (minOverlap === overlapLeft && this.vx > 0) {
      this.x = obs.x - this.width;
      this.vx = 0;
    } else if (minOverlap === overlapRight && this.vx < 0) {
      this.x = obs.x + obs.width;
      this.vx = 0;
    }
  }

  isNear(obj) {
    const distance = Math.abs(this.x + this.width / 2 - (obj.x + obj.width / 2));
    return distance < 40 && Math.abs(this.y - obj.y) < 50;
  }

  die(reason) {
    this.alive = false;
    return reason;
  }

  render(p, cameraX) {
    const screenX = this.x - cameraX;
    
    p.push();
    
    // Shadow
    p.fill(0, 0, 0, 50);
    p.noStroke();
    p.ellipse(screenX + this.width / 2, this.y + this.height, this.width, 8);
    
    // Body
    const bodyHeight = this.crouching ? this.height * 0.7 : this.height;
    const bodyY = this.crouching ? this.y + this.height * 0.3 : this.y;
    
    p.fill(40, 40, 50);
    p.stroke(30, 30, 40);
    p.strokeWeight(2);
    p.rect(screenX + 3, bodyY + 8, this.width - 6, bodyHeight - 8, 2);
    
    // Head
    p.fill(60, 50, 50);
    p.ellipse(screenX + this.width / 2, bodyY + 6, 10, 10);
    
    // Eye (facing direction)
    p.fill(200, 200, 220);
    const eyeX = screenX + this.width / 2 + (this.facing * 2);
    p.ellipse(eyeX, bodyY + 5, 3, 3);
    
    // Arms
    if (this.pushing) {
      p.stroke(40, 40, 50);
      p.strokeWeight(3);
      p.line(screenX + this.width / 2, bodyY + 12, 
             screenX + this.width / 2 + this.facing * 12, bodyY + 14);
    }
    
    p.pop();
  }
}