// entities.js - Game entities

import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';

export class Sally {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = 20;
    this.height = 30;
    this.vx = 2.5;
    this.vy = 0;
    this.gravity = 0.6;
    this.jumpForce = -12;
    this.onGround = false;
    this.alive = true;
    this.reachedGoal = false;
  }

  jump() {
    if (this.onGround && this.alive) {
      this.vy = this.jumpForce;
      this.onGround = false;
    }
  }

  update(platforms, hazards, goal) {
    if (!this.alive || this.reachedGoal) return;

    // Apply gravity
    this.vy += this.gravity;
    
    // Update position
    this.x += this.vx * gameState.timeScale;
    this.y += this.vy * gameState.timeScale;

    // Check platform collisions
    this.onGround = false;
    for (let platform of platforms) {
      if (platform.active && this.checkPlatformCollision(platform)) {
        this.y = platform.y - this.height;
        this.vy = 0;
        this.onGround = true;
        break;
      }
    }

    // Check hazard collisions
    for (let hazard of hazards) {
      if (hazard.active && this.checkHazardCollision(hazard)) {
        this.alive = false;
        return;
      }
    }

    // Check goal
    if (goal && this.checkGoalCollision(goal)) {
      this.reachedGoal = true;
      return;
    }

    // Fall off screen
    if (this.y > CANVAS_HEIGHT + 50) {
      this.alive = false;
    }
  }

  checkPlatformCollision(platform) {
    const p = this.p;
    return p.collideRectRect(
      this.x, this.y, this.width, this.height,
      platform.x, platform.y, platform.width, platform.height
    ) && this.vy >= 0 && this.y + this.height - this.vy <= platform.y + 5;
  }

  checkHazardCollision(hazard) {
    const p = this.p;
    if (hazard.type === 'spike') {
      return p.collideRectRect(
        this.x, this.y, this.width, this.height,
        hazard.x, hazard.y, hazard.width, hazard.height
      );
    } else if (hazard.type === 'pit') {
      return p.collideRectRect(
        this.x, this.y, this.width, this.height,
        hazard.x, hazard.y, hazard.width, hazard.height
      );
    }
    return false;
  }

  checkGoalCollision(goal) {
    const p = this.p;
    return p.collideRectRect(
      this.x, this.y, this.width, this.height,
      goal.x, goal.y, goal.width, goal.height
    );
  }

  render() {
    const p = this.p;
    p.push();
    
    // Draw Sally (girl character)
    p.fill(255, 180, 200); // Pink dress
    p.rect(this.x, this.y + 10, this.width, this.height - 10);
    
    // Head
    p.fill(255, 220, 180); // Skin tone
    p.ellipse(this.x + this.width / 2, this.y + 5, 15, 15);
    
    // Hair
    p.fill(100, 50, 20); // Brown hair
    p.arc(this.x + this.width / 2, this.y + 5, 16, 16, p.PI, p.TWO_PI);
    
    // Eyes
    p.fill(0);
    p.circle(this.x + this.width / 2 - 3, this.y + 5, 2);
    p.circle(this.x + this.width / 2 + 3, this.y + 5, 2);
    
    p.pop();
  }
}

export class Platform {
  constructor(p, x, y, width, height, movable = false, startActive = true) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.movable = movable;
    this.active = startActive;
    this.targetY = y;
    this.moveSpeed = 3;
    this.type = 'platform';
  }

  activate() {
    if (this.movable) {
      this.active = true;
    }
  }

  deactivate() {
    if (this.movable) {
      this.active = false;
    }
  }

  update() {
    // Smooth movement for movable platforms
    if (this.movable && this.active) {
      if (Math.abs(this.y - this.targetY) > 1) {
        this.y += (this.targetY - this.y) * 0.1 * gameState.timeScale;
      }
    }
  }

  render(selected = false) {
    const p = this.p;
    p.push();
    
    if (selected) {
      p.stroke(255, 255, 0);
      p.strokeWeight(3);
    } else {
      p.noStroke();
    }
    
    p.fill(...(this.active ? [100, 200, 100] : [80, 80, 80]));
    p.rect(this.x, this.y, this.width, this.height);
    
    // Pattern
    if (this.active) {
      p.fill(120, 220, 120);
      for (let i = 0; i < this.width; i += 10) {
        p.rect(this.x + i, this.y, 5, this.height);
      }
    }
    
    p.pop();
  }
}

export class Hazard {
  constructor(p, x, y, width, height, type = 'spike') {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = type;
    this.active = true;
  }

  render() {
    const p = this.p;
    p.push();
    
    if (this.type === 'spike') {
      p.fill(200, 50, 50);
      p.noStroke();
      // Draw spikes as triangles
      const numSpikes = Math.floor(this.width / 15);
      for (let i = 0; i < numSpikes; i++) {
        const sx = this.x + i * (this.width / numSpikes);
        p.triangle(
          sx, this.y + this.height,
          sx + this.width / numSpikes / 2, this.y,
          sx + this.width / numSpikes, this.y + this.height
        );
      }
    } else if (this.type === 'pit') {
      p.fill(20, 20, 40);
      p.rect(this.x, this.y, this.width, this.height);
    }
    
    p.pop();
  }
}

export class Goal {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = 40;
    this.height = 60;
    this.animFrame = 0;
  }

  update() {
    this.animFrame += 0.1 * gameState.timeScale;
  }

  render() {
    const p = this.p;
    p.push();
    
    // Goal door
    p.fill(200, 180, 50);
    p.rect(this.x, this.y, this.width, this.height);
    
    // Door frame
    p.stroke(150, 130, 30);
    p.strokeWeight(3);
    p.noFill();
    p.rect(this.x + 2, this.y + 2, this.width - 4, this.height - 4);
    
    // Glowing effect
    const glowAlpha = 100 + Math.sin(this.animFrame) * 50;
    p.fill(255, 255, 200, glowAlpha);
    p.noStroke();
    p.rect(this.x + 5, this.y + 5, this.width - 10, this.height - 10);
    
    p.pop();
  }
}

export class Switch {
  constructor(p, x, y, linkedObjects = []) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = 30;
    this.height = 15;
    this.linkedObjects = linkedObjects;
    this.activated = false;
    this.type = 'switch';
  }

  activate() {
    this.activated = true;
    for (let obj of this.linkedObjects) {
      if (obj.activate) {
        obj.activate();
      }
    }
  }

  deactivate() {
    this.activated = false;
    for (let obj of this.linkedObjects) {
      if (obj.deactivate) {
        obj.deactivate();
      }
    }
  }

  render(selected = false) {
    const p = this.p;
    p.push();
    
    if (selected) {
      p.stroke(255, 255, 0);
      p.strokeWeight(3);
    } else {
      p.noStroke();
    }
    
    // Base
    p.fill(80, 80, 100);
    p.rect(this.x, this.y + 10, this.width, 5);
    
    // Switch button
    p.fill(...(this.activated ? [100, 255, 100] : [255, 100, 100]));
    p.rect(this.x + 5, this.y + (this.activated ? 10 : 5), this.width - 10, 10);
    
    p.pop();
  }
}