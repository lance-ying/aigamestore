// target.js - Target entities (primary targets and guards)

import { CANVAS_HEIGHT } from './globals.js';

export class Target {
  constructor(x, y, isPrimary = false) {
    this.x = x;
    this.y = y;
    this.isPrimary = isPrimary;
    this.alive = true;
    this.health = 100;
    this.width = 20;
    this.height = 40;
    this.headRadius = 8;
    
    // Movement
    this.patrolStart = x;
    this.patrolEnd = x + (Math.random() > 0.5 ? 100 : -100);
    this.patrolSpeed = 0.5 + Math.random() * 0.5;
    this.patrolDirection = 1;
    this.stopTimer = 0;
    this.stopDuration = 60 + Math.floor(Math.random() * 120);
    
    // State
    this.alerted = false;
    this.alertTimer = 0;
  }
  
  update() {
    if (!this.alive) return;
    
    // Patrol movement
    if (this.stopTimer > 0) {
      this.stopTimer--;
    } else {
      this.x += this.patrolSpeed * this.patrolDirection;
      
      if (this.x >= this.patrolEnd && this.patrolDirection > 0) {
        this.patrolDirection = -1;
        this.stopTimer = this.stopDuration;
      } else if (this.x <= this.patrolStart && this.patrolDirection < 0) {
        this.patrolDirection = 1;
        this.stopTimer = this.stopDuration;
      }
    }
    
    // Alert timer
    if (this.alertTimer > 0) {
      this.alertTimer--;
      if (this.alertTimer === 0) {
        this.alerted = false;
      }
    }
  }
  
  takeDamage(damage, isHeadshot = false) {
    if (!this.alive) return false;
    
    if (isHeadshot) {
      this.health = 0;
    } else {
      this.health -= damage;
    }
    
    if (this.health <= 0) {
      this.alive = false;
      return true;
    }
    return false;
  }
  
  alert() {
    this.alerted = true;
    this.alertTimer = 180; // 3 seconds
  }
  
  isHeadshot(x, y) {
    const headX = this.x;
    const headY = this.y - this.height / 2 - this.headRadius;
    const dist = Math.sqrt((x - headX) ** 2 + (y - headY) ** 2);
    return dist <= this.headRadius;
  }
  
  isBodyshot(x, y) {
    return x >= this.x - this.width / 2 &&
           x <= this.x + this.width / 2 &&
           y >= this.y - this.height / 2 &&
           y <= this.y + this.height / 2;
  }
  
  draw(p) {
    if (!this.alive) return;
    
    p.push();
    
    // Body
    if (this.isPrimary) {
      p.fill(200, 50, 50); // Red for primary targets
    } else {
      p.fill(80, 80, 120); // Blue-gray for guards
    }
    
    if (this.alerted) {
      p.stroke(255, 255, 0);
      p.strokeWeight(2);
    } else {
      p.noStroke();
    }
    
    p.rectMode(p.CENTER);
    p.rect(this.x, this.y, this.width, this.height, 3);
    
    // Head
    p.fill(220, 180, 150);
    p.circle(this.x, this.y - this.height / 2 - this.headRadius, this.headRadius * 2);
    
    // Indicator above primary targets
    if (this.isPrimary) {
      p.fill(255, 50, 50);
      p.noStroke();
      p.triangle(
        this.x, this.y - this.height / 2 - this.headRadius * 2 - 10,
        this.x - 5, this.y - this.height / 2 - this.headRadius * 2 - 3,
        this.x + 5, this.y - this.height / 2 - this.headRadius * 2 - 3
      );
    }
    
    p.pop();
  }
}