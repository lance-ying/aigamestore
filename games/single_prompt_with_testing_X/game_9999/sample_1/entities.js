// entities.js - Game entity classes

import { UNIT_SIZE, UNIT_SPEED, GATE_WIDTH, GATE_HEIGHT, BASE_WIDTH, BASE_HEIGHT, BASE_MAX_HEALTH, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Unit {
  constructor(x, y, vx, vy) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.size = UNIT_SIZE;
    this.alive = true;
    this.passedGates = [];
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    
    // Check bounds
    if (this.x < 0 || this.x > CANVAS_WIDTH || this.y < 0 || this.y > CANVAS_HEIGHT) {
      this.alive = false;
    }
  }
  
  render(p) {
    p.push();
    p.fill(100, 200, 255);
    p.noStroke();
    p.circle(this.x, this.y, this.size * 2);
    p.pop();
  }
}

export class Gate {
  constructor(x, y, multiplier, moveSpeed = 0) {
    this.x = x;
    this.y = y;
    this.width = GATE_WIDTH;
    this.height = GATE_HEIGHT;
    this.multiplier = multiplier; // Positive = blue, Negative = red
    this.moveSpeed = moveSpeed;
    this.moveDirection = 1;
    this.minY = 50;
    this.maxY = CANVAS_HEIGHT - 150;
    this.active = true;
  }
  
  update() {
    if (this.moveSpeed > 0) {
      this.y += this.moveSpeed * this.moveDirection;
      
      if (this.y <= this.minY || this.y >= this.maxY) {
        this.moveDirection *= -1;
      }
    }
  }
  
  render(p) {
    p.push();
    
    // Gate color based on multiplier
    if (this.multiplier > 1) {
      // Blue gate (multiplier)
      p.fill(50, 150, 255, 200);
      p.stroke(100, 200, 255);
    } else {
      // Red gate (divider)
      p.fill(255, 80, 80, 200);
      p.stroke(255, 120, 120);
    }
    
    p.strokeWeight(3);
    p.rect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height, 5);
    
    // Display multiplier
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(20);
    p.text(`x${this.multiplier}`, this.x, this.y);
    
    p.pop();
  }
  
  checkCollision(unit) {
    const p = window.gameInstance;
    return p.collideCircleRect(
      unit.x, unit.y, unit.size * 2,
      this.x - this.width / 2, this.y - this.height / 2, this.width, this.height
    );
  }
}

export class EnemyBase {
  constructor() {
    this.x = CANVAS_WIDTH - BASE_WIDTH - 20;
    this.y = CANVAS_HEIGHT - BASE_HEIGHT - 20;
    this.width = BASE_WIDTH;
    this.height = BASE_HEIGHT;
    this.health = BASE_MAX_HEALTH;
    this.maxHealth = BASE_MAX_HEALTH;
  }
  
  takeDamage(amount) {
    this.health -= amount;
    if (this.health < 0) this.health = 0;
  }
  
  isDestroyed() {
    return this.health <= 0;
  }
  
  render(p) {
    p.push();
    
    // Base structure
    p.fill(180, 50, 50);
    p.stroke(200, 70, 70);
    p.strokeWeight(3);
    p.rect(this.x, this.y, this.width, this.height, 5);
    
    // Health bar
    const healthBarWidth = this.width - 10;
    const healthBarHeight = 8;
    const healthPercent = this.health / this.maxHealth;
    
    p.noStroke();
    p.fill(50, 50, 50);
    p.rect(this.x + 5, this.y - 15, healthBarWidth, healthBarHeight);
    
    p.fill(255, 100, 100);
    p.rect(this.x + 5, this.y - 15, healthBarWidth * healthPercent, healthBarHeight);
    
    // Base details
    p.fill(150, 40, 40);
    p.rect(this.x + 10, this.y + 10, 15, 30, 2);
    p.rect(this.x + 35, this.y + 10, 15, 30, 2);
    
    p.pop();
  }
  
  checkCollision(unit) {
    const p = window.gameInstance;
    return p.collideCircleRect(
      unit.x, unit.y, unit.size * 2,
      this.x, this.y, this.width, this.height
    );
  }
}

export class Cannon {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.angle = -Math.PI / 2; // Point up
    this.width = 40;
    this.height = 30;
    this.barrelLength = 35;
  }
  
  setAngle(angle) {
    // Clamp angle to reasonable range (-135 to -45 degrees)
    const minAngle = -Math.PI * 0.75;
    const maxAngle = -Math.PI * 0.25;
    this.angle = Math.max(minAngle, Math.min(maxAngle, angle));
  }
  
  rotateBy(delta) {
    this.setAngle(this.angle + delta);
  }
  
  getBarrelTip() {
    return {
      x: this.x + Math.cos(this.angle) * this.barrelLength,
      y: this.y + Math.sin(this.angle) * this.barrelLength
    };
  }
  
  render(p) {
    p.push();
    
    // Base
    p.fill(80, 80, 80);
    p.stroke(100, 100, 100);
    p.strokeWeight(2);
    p.rect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height, 5);
    
    // Barrel
    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.angle);
    p.fill(100, 100, 100);
    p.rect(-8, 0, 16, this.barrelLength, 3);
    p.pop();
    
    // Aim line (subtle)
    const tip = this.getBarrelTip();
    p.stroke(100, 200, 255, 100);
    p.strokeWeight(1);
    p.line(tip.x, tip.y, tip.x + Math.cos(this.angle) * 100, tip.y + Math.sin(this.angle) * 100);
    
    p.pop();
  }
}

export class Champion {
  constructor(name, description, abilityFunction) {
    this.name = name;
    this.description = description;
    this.abilityFunction = abilityFunction;
    this.color = [255, 200, 100];
  }
  
  useAbility(gameState) {
    this.abilityFunction(gameState);
  }
}