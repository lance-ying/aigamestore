import { gameState, GRAVITY, JUMP_STRENGTH, MOVE_SPEED, CANVAS_HEIGHT } from './globals.js';

export class Player {
  constructor(x, y, color, id, p) {
    this.x = x;
    this.y = y;
    this.width = 20;
    this.height = 30;
    this.color = color;
    this.id = id; // 1 or 2
    this.p = p;
    
    this.vx = 0;
    this.vy = 0;
    this.isOnGround = false;
    this.isAlive = true;
    
    this.jumpBufferFrames = 0;
    this.coyoteTimeFrames = 0;
  }
  
  update(inputs, platforms, spikes) {
    if (!this.isAlive) return;
    
    // Store previous position for collision resolution
    const prevX = this.x;
    const prevY = this.y;
    
    // Handle input
    if (inputs.left) {
      this.vx = -MOVE_SPEED;
    } else if (inputs.right) {
      this.vx = MOVE_SPEED;
    } else {
      this.vx = 0;
    }
    
    // Jump buffering
    if (inputs.jump) {
      this.jumpBufferFrames = 5;
    }
    if (this.jumpBufferFrames > 0) {
      this.jumpBufferFrames--;
    }
    
    // Coyote time
    if (this.isOnGround) {
      this.coyoteTimeFrames = 5;
    } else if (this.coyoteTimeFrames > 0) {
      this.coyoteTimeFrames--;
    }
    
    // Jump
    if (this.jumpBufferFrames > 0 && this.coyoteTimeFrames > 0) {
      this.vy = JUMP_STRENGTH;
      this.jumpBufferFrames = 0;
      this.isOnGround = false;
    }
    
    // Apply gravity
    this.vy += GRAVITY;
    
    // Terminal velocity
    if (this.vy > 15) this.vy = 15;
    
    // Apply velocity
    this.x += this.vx;
    this.y += this.vy;
    
    // Check ground collision
    this.isOnGround = false;
    
    for (let platform of platforms) {
      if (this.checkCollision(platform)) {
        // Determine collision side
        const overlapLeft = (this.x + this.width) - platform.x;
        const overlapRight = (platform.x + platform.width) - this.x;
        const overlapTop = (this.y + this.height) - platform.y;
        const overlapBottom = (platform.y + platform.height) - this.y;
        
        const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
        
        if (minOverlap === overlapTop && this.vy > 0) {
          // Collision from top
          this.y = platform.y - this.height;
          this.vy = 0;
          this.isOnGround = true;
        } else if (minOverlap === overlapBottom && this.vy < 0) {
          // Collision from bottom
          this.y = platform.y + platform.height;
          this.vy = 0;
        } else if (minOverlap === overlapLeft) {
          // Collision from left
          this.x = platform.x - this.width;
          this.vx = 0;
        } else if (minOverlap === overlapRight) {
          // Collision from right
          this.x = platform.x + platform.width;
          this.vx = 0;
        }
      }
    }
    
    // Canvas boundaries
    if (this.x < 0) this.x = 0;
    if (this.x + this.width > this.p.width) this.x = this.p.width - this.width;
    
    // Death if fall off screen
    if (this.y > CANVAS_HEIGHT + 50) {
      this.isAlive = false;
    }
    
    // Check spike collision
    for (let spike of spikes) {
      if (this.checkCollision(spike)) {
        this.isAlive = false;
      }
    }
  }
  
  checkCollision(rect) {
    return this.p.collideRectRect(
      this.x, this.y, this.width, this.height,
      rect.x, rect.y, rect.width, rect.height
    );
  }
  
  checkPointCollision(px, py) {
    return px >= this.x && px <= this.x + this.width &&
           py >= this.y && py <= this.y + this.height;
  }
  
  display() {
    this.p.push();
    
    if (!this.isAlive) {
      // Death animation
      this.p.fill(50);
      this.p.noStroke();
      this.p.ellipse(this.x + this.width/2, this.y + this.height/2, 25, 25);
      this.p.pop();
      return;
    }
    
    // Draw player body
    this.p.fill(...this.color);
    this.p.stroke(255, 255, 255, 200);
    this.p.strokeWeight(2);
    this.p.rect(this.x, this.y, this.width, this.height, 3);
    
    // Draw eyes
    this.p.fill(255);
    this.p.noStroke();
    this.p.ellipse(this.x + 6, this.y + 8, 5, 5);
    this.p.ellipse(this.x + 14, this.y + 8, 5, 5);
    
    // Draw pupils
    this.p.fill(0);
    this.p.ellipse(this.x + 6, this.y + 8, 2, 2);
    this.p.ellipse(this.x + 14, this.y + 8, 2, 2);
    
    // Draw smile
    this.p.noFill();
    this.p.stroke(255);
    this.p.strokeWeight(1.5);
    this.p.arc(this.x + 10, this.y + 13, 8, 6, 0, this.p.PI);
    
    this.p.pop();
  }
}