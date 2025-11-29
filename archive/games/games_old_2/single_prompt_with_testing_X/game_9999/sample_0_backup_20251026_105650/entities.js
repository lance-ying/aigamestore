// entities.js - Game entities (Cannon, Unit, Gate, Obstacle, Base)

import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';

export class Cannon {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.angle = 0; // Radians
    this.length = 50;
    this.width = 25;
  }
  
  rotate(delta) {
    this.angle += delta;
    // Limit angle to upper hemisphere
    this.angle = Math.max(-Math.PI * 0.75, Math.min(-Math.PI * 0.25, this.angle));
  }
  
  getSpawnPoint() {
    return {
      x: this.x + Math.cos(this.angle) * this.length,
      y: this.y + Math.sin(this.angle) * this.length
    };
  }
  
  getDirection() {
    return {
      x: Math.cos(this.angle),
      y: Math.sin(this.angle)
    };
  }
  
  draw(p) {
    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.angle);
    
    // Cannon base
    p.fill(60, 60, 70);
    p.rect(-15, -15, 30, 30);
    
    // Cannon barrel
    p.fill(80, 80, 90);
    p.rect(0, -this.width / 2, this.length, this.width);
    
    // Barrel tip
    p.fill(100, 100, 110);
    p.circle(this.length, 0, 12);
    
    p.pop();
  }
}

export class Unit {
  constructor(x, y, vx, vy) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = 4;
    this.alive = true;
    this.hasPassedGate = false;
  }
  
  update(speedMultiplier = 1) {
    this.x += this.vx * speedMultiplier;
    this.y += this.vy * speedMultiplier;
    
    // Apply gravity
    this.vy += 0.15;
    
    // Check bounds
    if (this.y > CANVAS_HEIGHT + 20 || this.x < -20 || this.x > CANVAS_WIDTH + 20) {
      this.alive = false;
      gameState.unitsLost++;
    }
  }
  
  draw(p) {
    if (!this.alive) return;
    
    p.push();
    p.fill(100, 200, 255);
    p.noStroke();
    p.circle(this.x, this.y, this.radius * 2);
    
    // Glow effect
    p.fill(150, 220, 255, 100);
    p.circle(this.x, this.y, this.radius * 3);
    p.pop();
  }
}

export class Gate {
  constructor(x, y, multiplier, width = 60, height = 100) {
    this.x = x;
    this.y = y;
    this.multiplier = multiplier; // Positive = blue (multiply), Negative = red (divide)
    this.width = width;
    this.height = height;
    this.oscillateSpeed = 0;
    this.oscillateRange = 0;
    this.originalY = y;
    this.frameOffset = Math.random() * 100;
  }
  
  update(frameCount) {
    if (this.oscillateSpeed > 0) {
      this.y = this.originalY + Math.sin((frameCount + this.frameOffset) * this.oscillateSpeed) * this.oscillateRange;
    }
  }
  
  checkCollision(unit) {
    if (unit.hasPassedGate) return false;
    
    const inX = unit.x > this.x - this.width / 2 && unit.x < this.x + this.width / 2;
    const inY = unit.y > this.y - this.height / 2 && unit.y < this.y + this.height / 2;
    
    return inX && inY;
  }
  
  draw(p) {
    p.push();
    
    // Gate color based on multiplier
    if (this.multiplier > 1) {
      // Blue (good)
      p.fill(50, 150, 255, 150);
      p.stroke(100, 200, 255);
    } else {
      // Red (bad)
      p.fill(255, 50, 50, 150);
      p.stroke(255, 100, 100);
    }
    
    p.strokeWeight(3);
    p.rect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
    
    // Multiplier text
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(16);
    p.text(`x${this.multiplier}`, this.x, this.y);
    
    p.pop();
  }
}

export class Obstacle {
  constructor(x, y, type = 'block') {
    this.x = x;
    this.y = y;
    this.type = type; // 'block', 'fortified'
    this.width = type === 'fortified' ? 40 : 30;
    this.height = type === 'fortified' ? 40 : 30;
    this.health = type === 'fortified' ? 3 : 1;
    this.alive = true;
  }
  
  checkCollision(unit) {
    const inX = unit.x > this.x - this.width / 2 && unit.x < this.x + this.width / 2;
    const inY = unit.y > this.y - this.height / 2 && unit.y < this.y + this.height / 2;
    return inX && inY;
  }
  
  takeDamage(amount = 1) {
    this.health -= amount;
    if (this.health <= 0) {
      this.alive = false;
      gameState.obstaclesDestroyed++;
      gameState.score += 1;
    }
  }
  
  draw(p) {
    if (!this.alive) return;
    
    p.push();
    
    if (this.type === 'fortified') {
      p.fill(120, 60, 40);
      p.stroke(80, 40, 20);
      p.strokeWeight(3);
      p.rect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
      
      // Health indicator
      p.fill(255);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(14);
      p.text(this.health, this.x, this.y);
    } else {
      p.fill(100, 100, 100);
      p.stroke(70, 70, 70);
      p.strokeWeight(2);
      p.rect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
    }
    
    p.pop();
  }
}

export class EnemyBase {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 80;
    this.height = 60;
    this.maxHealth = 100;
    this.health = this.maxHealth;
  }
  
  takeDamage(amount) {
    this.health -= amount;
    if (this.health < 0) this.health = 0;
  }
  
  isDestroyed() {
    return this.health <= 0;
  }
  
  draw(p) {
    p.push();
    
    // Base structure
    p.fill(150, 50, 50);
    p.stroke(100, 30, 30);
    p.strokeWeight(3);
    p.rect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
    
    // Turret
    p.fill(120, 40, 40);
    p.rect(this.x - 15, this.y - this.height / 2 - 20, 30, 20);
    
    // Health bar
    const barWidth = 70;
    const barHeight = 8;
    const healthPercent = this.health / this.maxHealth;
    
    p.fill(50, 50, 50);
    p.noStroke();
    p.rect(this.x - barWidth / 2, this.y + this.height / 2 + 5, barWidth, barHeight);
    
    p.fill(healthPercent > 0.3 ? 100 : 255, healthPercent > 0.3 ? 200 : 50, 50);
    p.rect(this.x - barWidth / 2, this.y + this.height / 2 + 5, barWidth * healthPercent, barHeight);
    
    p.pop();
  }
}

export class SpeedPad {
  constructor(x, y, speedBoost = 1.5) {
    this.x = x;
    this.y = y;
    this.width = 50;
    this.height = 40;
    this.speedBoost = speedBoost;
  }
  
  checkCollision(unit) {
    const inX = unit.x > this.x - this.width / 2 && unit.x < this.x + this.width / 2;
    const inY = unit.y > this.y - this.height / 2 && unit.y < this.y + this.height / 2;
    return inX && inY;
  }
  
  draw(p) {
    p.push();
    
    p.fill(255, 200, 50, 150);
    p.stroke(255, 220, 100);
    p.strokeWeight(2);
    p.rect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
    
    // Speed indicator arrows
    p.fill(255, 255, 100);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(20);
    p.text('»', this.x, this.y);
    
    p.pop();
  }
}