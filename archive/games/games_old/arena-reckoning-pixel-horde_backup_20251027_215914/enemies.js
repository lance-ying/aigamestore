// enemies.js - Enemy classes

import { ENEMY_TYPES, CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';
import { Enemy as BasicEnemy } from './spawner.js';

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
    
    // Special abilities
    this.teleportInterval = enemyType.teleportInterval || 0;
    this.lastTeleport = 0;
    this.summonInterval = enemyType.summonInterval || 0;
    this.lastSummon = 0;
    
    // Visual effects
    this.hitFlash = 0;
    this.isDead = false;
    this.alpha = 255;
  }
  
  update(p, player) {
    if (this.isDead) return;
    
    // Special behaviors
    if (this.type === "WRAITH") {
      this.updateWraith(p, player);
    } else if (this.type === "NECROMANCER") {
      this.updateNecromancer(p, player);
    } else {
      // Move towards player
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 0) {
        this.x += (dx / dist) * this.speed;
        this.y += (dy / dist) * this.speed;
      }
    }
    
    // Decrement hit flash
    if (this.hitFlash > 0) this.hitFlash--;
  }
  
  updateWraith(p, player) {
    const currentTime = Date.now();
    
    // Phase in and out
    this.alpha = 150 + Math.sin(currentTime * 0.01) * 100;
    
    // Teleport behavior
    if (currentTime - this.lastTeleport > this.teleportInterval) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 100 + Math.random() * 100;
      this.x = player.x + Math.cos(angle) * distance;
      this.y = player.y + Math.sin(angle) * distance;
      
      // Keep in bounds
      this.x = Math.max(20, Math.min(CANVAS_WIDTH - 20, this.x));
      this.y = Math.max(20, Math.min(CANVAS_HEIGHT - 20, this.y));
      
      this.lastTeleport = currentTime;
    } else {
      // Move towards player
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 0) {
        this.x += (dx / dist) * this.speed;
        this.y += (dy / dist) * this.speed;
      }
    }
  }
  
  updateNecromancer(p, player) {
    const currentTime = Date.now();
    
    // Keep distance from player
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < 150) {
      // Move away
      if (dist > 0) {
        this.x -= (dx / dist) * this.speed;
        this.y -= (dy / dist) * this.speed;
      }
    } else if (dist > 250) {
      // Move closer
      if (dist > 0) {
        this.x += (dx / dist) * this.speed;
        this.y += (dy / dist) * this.speed;
      }
    }
    
    // Summon minions
    if (currentTime - this.lastSummon > this.summonInterval && gameState.enemies.length < 50) {
      this.summonMinion(p);
      this.lastSummon = currentTime;
    }
  }
  
  summonMinion(p) {
    // Summon a weak goblin nearby
    const angle = Math.random() * Math.PI * 2;
    const distance = 30;
    const x = this.x + Math.cos(angle) * distance;
    const y = this.y + Math.sin(angle) * distance;
    
    const minion = new Enemy("GOBLIN", x, y, { healthMultiplier: 0.5, speedMultiplier: 0.8 });
    gameState.enemies.push(minion);
    gameState.entities.push(minion);
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
      p.fill(255, 255, 200, this.alpha || 255);
    } else {
      p.fill(...this.color, this.alpha || 255);
    }
    
    p.noStroke();
    
    // Render based on type
    if (this.type === "GOBLIN" || this.type === "MINIBOSS" || this.type === "BOSS" || this.type === "BRUTE" || this.type === "GOLEM") {
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
      } else if (this.type === "GOLEM") {
        p.stroke(50);
        p.strokeWeight(3);
        p.noFill();
        p.circle(this.x, this.y, this.radius * 2);
        p.fill(...this.color);
        p.noStroke();
        p.circle(this.x, this.y, this.radius * 1.5);
      }
    } else if (this.type === "SPIDER" || this.type === "WRAITH") {
      p.rectMode(p.CENTER);
      p.rect(this.x, this.y, this.size, this.size);
      
      if (this.type === "WRAITH") {
        // Ghost trail effect
        p.fill(...this.color, (this.alpha || 255) * 0.3);
        p.rect(this.x - 3, this.y, this.size * 0.8, this.size * 0.8);
      }
    } else if (this.type === "IMP" || this.type === "NECROMANCER") {
      this.drawTriangle(p, this.x, this.y, this.size);
      
      if (this.type === "NECROMANCER") {
        // Necromancer staff/aura
        p.stroke(...this.color);
        p.strokeWeight(2);
        p.noFill();
        p.circle(this.x, this.y - this.size, 8);
      }
    }
    
    // Health bar for bosses and tough enemies
    if (this.type === "MINIBOSS" || this.type === "BOSS" || this.type === "GOLEM" || this.type === "NECROMANCER") {
      const barWidth = (this.radius || this.size) * 2;
      const barHeight = 4;
      const healthPercent = this.health / this.maxHealth;
      
      p.fill(50);
      p.rect(this.x - barWidth / 2, this.y - (this.radius || this.size) - 10, barWidth, barHeight);
      p.fill(255, 50, 50);
      p.rect(this.x - barWidth / 2, this.y - (this.radius || this.size) - 10, barWidth * healthPercent, barHeight);
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