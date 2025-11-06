// enemies.js - Enemy classes

import { ENEMY_TYPES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Enemy {
  constructor(type, x, y, config = {}) {
    const enemyType = ENEMY_TYPES[type];
    this.type = type;
    this.x = x;
    this.y = y;
    
    // Visual properties
    this.radius = enemyType.radius || 0;
    this.size = enemyType.size || 0;
    this.color = enemyType.color;
    
    // Stats
    this.health = enemyType.health * (config.healthMultiplier || 1);
    this.maxHealth = this.health;
    this.damage = enemyType.damage;
    this.speed = enemyType.speed * (config.speedMultiplier || 1);
    this.expValue = enemyType.expValue;
    this.pointsValue = enemyType.pointsValue;
    
    // Combat
    this.lastShot = 0;
    this.shootInterval = enemyType.shootInterval || 0;
    
    // Visual effects
    this.hitFlash = 0;
    this.isDead = false;
  }
  
  update(p, player) {
    if (this.isDead) return;
    
    // Move towards player
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 0) {
      this.x += (dx / dist) * this.speed;
      this.y += (dy / dist) * this.speed;
    }
    
    // Decrement hit flash
    if (this.hitFlash > 0) this.hitFlash--;
  }
  
  takeDamage(amount) {
    this.health -= amount;
    this.hitFlash = 5;
    
    if (this.health <= 0) {
      this.isDead = true;
      return true;
    }
    return false;
  }
  
  render(p) {
    if (this.isDead) return;
    
    p.push();
    
    // Hit flash effect
    if (this.hitFlash > 0) {
      p.fill(255, 255, 200);
    } else {
      p.fill(...this.color);
    }
    
    p.noStroke();
    
    // Render based on type
    if (this.type === "GOBLIN" || this.type === "MINIBOSS" || this.type === "BOSS") {
      p.circle(this.x, this.y, this.radius * 2);
      
      // Draw shapes for boss types
      if (this.type === "MINIBOSS") {
        p.stroke(0);
        p.strokeWeight(2);
        this.drawPentagon(p, this.x, this.y, this.radius);
      } else if (this.type === "BOSS") {
        p.stroke(0);
        p.strokeWeight(3);
        this.drawOctagon(p, this.x, this.y, this.radius);
      }
    } else if (this.type === "SPIDER") {
      p.rectMode(p.CENTER);
      p.rect(this.x, this.y, this.size, this.size);
    } else if (this.type === "IMP") {
      this.drawTriangle(p, this.x, this.y, this.size);
    }
    
    // Health bar for bosses
    if (this.type === "MINIBOSS" || this.type === "BOSS") {
      const barWidth = this.radius * 2;
      const barHeight = 4;
      const healthPercent = this.health / this.maxHealth;
      
      p.fill(50);
      p.rect(this.x - barWidth / 2, this.y - this.radius - 10, barWidth, barHeight);
      p.fill(255, 50, 50);
      p.rect(this.x - barWidth / 2, this.y - this.radius - 10, barWidth * healthPercent, barHeight);
    }
    
    p.pop();
  }
  
  drawTriangle(p, x, y, size) {
    p.beginShape();
    p.vertex(x, y - size / 2);
    p.vertex(x - size / 2, y + size / 2);
    p.vertex(x + size / 2, y + size / 2);
    p.endShape(p.CLOSE);
  }
  
  drawPentagon(p, x, y, radius) {
    p.beginShape();
    for (let i = 0; i < 5; i++) {
      const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;
      p.vertex(px, py);
    }
    p.endShape(p.CLOSE);
  }
  
  drawOctagon(p, x, y, radius) {
    p.beginShape();
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 / 8) * i;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;
      p.vertex(px, py);
    }
    p.endShape(p.CLOSE);
  }
  
  collidesWith(x, y, radius) {
    const myRadius = this.radius || this.size / 2;
    const dx = this.x - x;
    const dy = this.y - y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < (myRadius + radius);
  }
}