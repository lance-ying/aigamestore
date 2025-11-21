// player.js - Player entity
import { gameState, PLAYER_SPEED, PLAYER_JUMP_FORCE, GRAVITY, CANVAS_HEIGHT } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.width = 30;
    this.height = 50;
    this.grounded = false;
    this.facing = 1; // 1 = right, -1 = left
    this.animFrame = 0;
    this.canInteract = false;
    this.nearbyInteractable = null;
  }

  update(p) {
    // Apply gravity
    if (!this.grounded) {
      this.vy += GRAVITY;
    }

    // Apply velocity
    this.x += this.vx;
    this.y += this.vy;

    // Check platform collisions
    this.grounded = false;
    for (let platform of gameState.platforms) {
      if (this.checkPlatformCollision(platform)) {
        this.grounded = true;
        this.vy = 0;
        this.y = platform.y - this.height;
      }
    }

    // Keep player in bounds
    if (this.x < 0) this.x = 0;
    if (this.x + this.width > CANVAS_HEIGHT * 2) this.x = CANVAS_HEIGHT * 2 - this.width;
    if (this.y > CANVAS_HEIGHT) {
      this.y = CANVAS_HEIGHT - this.height;
      this.grounded = true;
      this.vy = 0;
    }

    // Check for nearby interactables
    this.checkInteractables();

    // Animation
    if (Math.abs(this.vx) > 0.1) {
      this.animFrame = (this.animFrame + 0.2) % 4;
    } else {
      this.animFrame = 0;
    }

    // Friction
    this.vx *= 0.8;
  }

  checkPlatformCollision(platform) {
    return this.x + this.width > platform.x &&
           this.x < platform.x + platform.width &&
           this.y + this.height <= platform.y &&
           this.y + this.height + this.vy >= platform.y;
  }

  checkInteractables() {
    this.canInteract = false;
    this.nearbyInteractable = null;

    for (let obj of gameState.objectives) {
      const dist = Math.hypot(this.x + this.width/2 - obj.x, this.y + this.height/2 - obj.y);
      if (dist < 50 && !obj.completed) {
        this.canInteract = true;
        this.nearbyInteractable = obj;
        break;
      }
    }
  }

  moveLeft() {
    this.vx = -PLAYER_SPEED;
    this.facing = -1;
  }

  moveRight() {
    this.vx = PLAYER_SPEED;
    this.facing = 1;
  }

  jump() {
    if (this.grounded) {
      this.vy = PLAYER_JUMP_FORCE;
      this.grounded = false;
    }
  }

  interact() {
    if (this.canInteract && this.nearbyInteractable) {
      this.nearbyInteractable.interact();
      return true;
    }
    return false;
  }

  render(p, cameraX) {
    const screenX = this.x - cameraX;
    
    p.push();
    // Body
    p.fill(100, 150, 255);
    p.rect(screenX, this.y, this.width, this.height);
    
    // Head
    p.fill(255, 220, 180);
    p.ellipse(screenX + this.width/2, this.y + 10, 20, 20);
    
    // Eyes
    p.fill(0);
    const eyeOffset = this.facing * 3;
    p.ellipse(screenX + this.width/2 + eyeOffset - 4, this.y + 8, 3, 3);
    p.ellipse(screenX + this.width/2 + eyeOffset + 4, this.y + 8, 3, 3);
    
    // Arms (animated)
    p.stroke(100, 150, 255);
    p.strokeWeight(4);
    const armSwing = Math.sin(this.animFrame) * 10;
    p.line(screenX + 5, this.y + 25, screenX, this.y + 30 + armSwing);
    p.line(screenX + this.width - 5, this.y + 25, screenX + this.width, this.y + 30 - armSwing);
    p.noStroke();
    
    // Legs (animated)
    p.fill(50, 80, 150);
    const legSwing = Math.sin(this.animFrame) * 5;
    p.rect(screenX + 8, this.y + 35, 6, 15 + legSwing);
    p.rect(screenX + this.width - 14, this.y + 35, 6, 15 - legSwing);
    
    p.pop();

    // Interaction indicator
    if (this.canInteract) {
      p.push();
      p.fill(255, 255, 0);
      p.noStroke();
      p.textAlign(p.CENTER);
      p.textSize(12);
      p.text("Press Z", screenX + this.width/2, this.y - 10);
      p.pop();
    }
  }
}