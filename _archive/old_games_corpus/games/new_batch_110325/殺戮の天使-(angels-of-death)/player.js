// player.js - Player character class
import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';

export class Player {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = 24;
    this.height = 40;
    this.vx = 0;
    this.vy = 0;
    this.speed = 2;
    this.sprintSpeed = 3.5;
    this.jumpForce = -8;
    this.gravity = 0.4;
    this.onGround = false;
    this.onLadder = false;
    this.maxHealth = 100;
    this.health = this.maxHealth;
    this.facing = 1; // 1 = right, -1 = left
    this.animFrame = 0;
    this.animTimer = 0;
    this.isMoving = false;
  }

  update(keys, ladders, platforms, traps) {
    const p = this.p;
    this.animTimer++;
    
    // Check if on ladder
    this.onLadder = false;
    for (let ladder of ladders) {
      if (this.p.collideRectRect(
        this.x, this.y, this.width, this.height,
        ladder.x, ladder.y, ladder.width, ladder.height
      )) {
        this.onLadder = true;
        break;
      }
    }

    // Movement
    this.isMoving = false;
    const currentSpeed = keys[16] ? this.sprintSpeed : this.speed; // Shift for sprint

    if (keys[37]) { // Left
      this.vx = -currentSpeed;
      this.facing = -1;
      this.isMoving = true;
    } else if (keys[39]) { // Right
      this.vx = currentSpeed;
      this.facing = 1;
      this.isMoving = true;
    } else {
      this.vx = 0;
    }

    // Ladder climbing
    if (this.onLadder) {
      this.vy = 0;
      this.onGround = true;
      if (keys[38]) { // Up
        this.vy = -currentSpeed;
        this.isMoving = true;
      } else if (keys[40]) { // Down
        this.vy = currentSpeed;
        this.isMoving = true;
      }
    } else {
      // Apply gravity
      this.vy += this.gravity;
      if (this.vy > 12) this.vy = 12;
    }

    // Update position
    this.x += this.vx;
    this.y += this.vy;

    // Collision with platforms and ground
    this.onGround = false;
    
    // Ground collision
    if (this.y + this.height >= CANVAS_HEIGHT - 50) {
      this.y = CANVAS_HEIGHT - 50 - this.height;
      this.vy = 0;
      this.onGround = true;
    }

    // Platform collisions
    for (let platform of platforms) {
      if (this.p.collideRectRect(
        this.x, this.y, this.width, this.height,
        platform.x, platform.y, platform.width, platform.height
      )) {
        // Top collision
        if (this.vy > 0 && this.y + this.height - this.vy < platform.y + 5) {
          this.y = platform.y - this.height;
          this.vy = 0;
          this.onGround = true;
        }
        // Bottom collision
        else if (this.vy < 0 && this.y - this.vy > platform.y + platform.height - 5) {
          this.y = platform.y + platform.height;
          this.vy = 0;
        }
        // Side collisions
        else if (this.vx > 0) {
          this.x = platform.x - this.width;
          this.vx = 0;
        } else if (this.vx < 0) {
          this.x = platform.x + platform.width;
          this.vx = 0;
        }
      }
    }

    // Boundary checks
    if (this.x < 0) this.x = 0;
    if (this.x + this.width > CANVAS_WIDTH) this.x = CANVAS_WIDTH - this.width;
    if (this.y < 0) this.y = 0;

    // Check trap collisions
    for (let trap of traps) {
      if (trap.active && this.p.collideRectRect(
        this.x, this.y, this.width, this.height,
        trap.x, trap.y, trap.width, trap.height
      )) {
        this.takeDamage(100, trap.type);
        return;
      }
    }

    // Animation
    if (this.isMoving && this.animTimer % 8 === 0) {
      this.animFrame = (this.animFrame + 1) % 4;
    } else if (!this.isMoving) {
      this.animFrame = 0;
    }
  }

  takeDamage(amount, source) {
    this.health -= amount;
    if (this.health <= 0) {
      this.health = 0;
      gameState.deathMessage = `Killed by ${source}`;
    }
  }

  draw() {
    const p = this.p;
    p.push();
    
    // Shadow
    p.fill(0, 0, 0, 50);
    p.noStroke();
    p.ellipse(this.x + this.width/2, this.y + this.height + 2, this.width * 0.8, 8);
    
    // Body
    p.fill(220, 180, 150);
    p.stroke(0);
    p.strokeWeight(2);
    p.rect(this.x + this.width/2 - 6, this.y + 12, 12, 18, 2);
    
    // Head
    p.fill(230, 190, 160);
    p.circle(this.x + this.width/2, this.y + 8, 14);
    
    // Hair (Rachel's long hair)
    p.fill(200, 160, 100);
    p.noStroke();
    p.beginShape();
    p.vertex(this.x + this.width/2 - 7, this.y + 4);
    p.vertex(this.x + this.width/2 - 9, this.y + 20);
    p.vertex(this.x + this.width/2 - 3, this.y + 18);
    p.endShape(p.CLOSE);
    p.beginShape();
    p.vertex(this.x + this.width/2 + 7, this.y + 4);
    p.vertex(this.x + this.width/2 + 9, this.y + 20);
    p.vertex(this.x + this.width/2 + 3, this.y + 18);
    p.endShape(p.CLOSE);
    
    // Eyes
    p.fill(80, 60, 40);
    p.circle(this.x + this.width/2 - 3 * this.facing, this.y + 7, 2);
    p.circle(this.x + this.width/2 + 3 * this.facing, this.y + 7, 2);
    
    // Arms
    p.stroke(0);
    p.strokeWeight(2);
    const armOffset = Math.sin(this.animFrame * 0.8) * 3;
    p.line(this.x + this.width/2 - 6, this.y + 15, this.x + this.width/2 - 10, this.y + 22 + armOffset);
    p.line(this.x + this.width/2 + 6, this.y + 15, this.x + this.width/2 + 10, this.y + 22 - armOffset);
    
    // Legs
    const legOffset = Math.sin(this.animFrame * 0.8) * 4;
    p.line(this.x + this.width/2 - 3, this.y + 30, this.x + this.width/2 - 5, this.y + 40 + legOffset);
    p.line(this.x + this.width/2 + 3, this.y + 30, this.x + this.width/2 + 5, this.y + 40 - legOffset);
    
    p.pop();
    
    // Health bar
    p.push();
    p.fill(100, 0, 0);
    p.noStroke();
    p.rect(this.x, this.y - 8, this.width, 4);
    p.fill(0, 200, 0);
    p.rect(this.x, this.y - 8, this.width * (this.health / this.maxHealth), 4);
    p.pop();
  }

  canInteract(interactables) {
    for (let obj of interactables) {
      const dist = this.p.dist(this.x + this.width/2, this.y + this.height/2, obj.x + obj.width/2, obj.y + obj.height/2);
      if (dist < 50) {
        return obj;
      }
    }
    return null;
  }
}