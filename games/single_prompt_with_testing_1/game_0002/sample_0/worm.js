// worm.js - Worm entity

import { GRAVITY, CANVAS_HEIGHT, gameState } from './globals.js';

export class Worm {
  constructor(p, x, y, team) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.team = team; // 0 = player, 1 = enemy
    this.vx = 0;
    this.vy = 0;
    this.width = 12;
    this.height = 20;
    this.hp = 100;
    this.maxHp = 100;
    this.onGround = false;
    this.facingRight = true;
    this.isActive = false;
    this.isDead = false;
    this.damageFlash = 0;
  }
  
  update(terrain) {
    if (this.isDead) return;
    
    // Apply gravity
    this.vy += GRAVITY;
    
    // Update position
    this.x += this.vx;
    this.y += this.vy;
    
    // Apply friction
    this.vx *= 0.9;
    
    // Check ground collision
    this.onGround = false;
    const groundHeight = terrain.getHeightAt(this.x);
    
    if (this.y + this.height / 2 >= groundHeight) {
      this.y = groundHeight - this.height / 2;
      this.vy = 0;
      this.onGround = true;
      this.vx *= 0.8;
    }
    
    // Bounds checking
    if (this.x < this.width / 2) {
      this.x = this.width / 2;
      this.vx = 0;
    }
    if (this.x > 600 - this.width / 2) {
      this.x = 600 - this.width / 2;
      this.vx = 0;
    }
    
    // Fall off map
    if (this.y > CANVAS_HEIGHT + 50) {
      this.takeDamage(100);
    }
    
    // Update damage flash
    if (this.damageFlash > 0) {
      this.damageFlash--;
    }
  }
  
  moveLeft() {
    if (this.onGround && !this.isDead) {
      this.vx = -2;
      this.facingRight = false;
    }
  }
  
  moveRight() {
    if (this.onGround && !this.isDead) {
      this.vx = 2;
      this.facingRight = true;
    }
  }
  
  jump() {
    if (this.onGround && !this.isDead) {
      this.vy = -8;
      this.onGround = false;
    }
  }
  
  takeDamage(amount) {
    this.hp -= amount;
    this.damageFlash = 15;
    
    if (this.hp <= 0) {
      this.hp = 0;
      this.isDead = true;
    }
  }
  
  render(p) {
    if (this.isDead) return;
    
    p.push();
    p.translate(this.x, this.y);
    
    // Flash red when damaged
    if (this.damageFlash > 0 && this.damageFlash % 4 < 2) {
      p.fill(255, 100, 100);
    } else {
      // Team colors: green for player, red for enemy
      p.fill(...(this.team === 0 ? [100, 200, 100] : [200, 100, 100]));
    }
    
    // Active indicator
    if (this.isActive) {
      p.stroke(255, 255, 0);
      p.strokeWeight(2);
    } else {
      p.stroke(0);
      p.strokeWeight(1);
    }
    
    // Body
    p.ellipse(0, 0, this.width, this.height);
    
    // Eyes
    p.fill(255);
    p.noStroke();
    const eyeOffsetX = this.facingRight ? 3 : -3;
    p.ellipse(eyeOffsetX - 2, -3, 3, 3);
    p.ellipse(eyeOffsetX + 2, -3, 3, 3);
    
    // Pupils
    p.fill(0);
    p.ellipse(eyeOffsetX - 2, -3, 1.5, 1.5);
    p.ellipse(eyeOffsetX + 2, -3, 1.5, 1.5);
    
    p.pop();
    
    // HP bar
    this.renderHealthBar(p);
  }
  
  renderHealthBar(p) {
    const barWidth = 30;
    const barHeight = 4;
    const barX = this.x - barWidth / 2;
    const barY = this.y - this.height / 2 - 10;
    
    p.push();
    p.noStroke();
    
    // Background
    p.fill(50);
    p.rect(barX, barY, barWidth, barHeight);
    
    // Health
    const healthWidth = (this.hp / this.maxHp) * barWidth;
    p.fill(...(this.hp > 50 ? [100, 200, 100] : this.hp > 25 ? [200, 200, 100] : [200, 100, 100]));
    p.rect(barX, barY, healthWidth, barHeight);
    
    p.pop();
  }
}