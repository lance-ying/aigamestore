// enemy.js - Enemy entities

import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';

export class Enemy {
  constructor(x, y, type = "basic") {
    this.x = x;
    this.y = y;
    this.type = type;
    
    // Stats based on type and wave
    this.setupStats();
    
    // Movement
    this.vx = 0;
    this.vy = 0;
    
    // Visual
    this.animationOffset = Math.random() * 1000;
    this.hue = Math.random() * 360;
  }
  
  setupStats() {
    const waveMultiplier = 1 + (gameState.waveLevel - 1) * 0.2;
    
    switch (this.type) {
      case "basic":
        this.radius = 10;
        this.speed = 0.8 * waveMultiplier;
        this.maxHealth = 30 * waveMultiplier;
        this.health = this.maxHealth;
        this.damage = 5;
        this.expValue = 10;
        this.color = [255, 100, 100];
        break;
        
      case "fast":
        this.radius = 8;
        this.speed = 1.5 * waveMultiplier;
        this.maxHealth = 20 * waveMultiplier;
        this.health = this.maxHealth;
        this.damage = 3;
        this.expValue = 15;
        this.color = [255, 150, 50];
        break;
        
      case "tank":
        this.radius = 14;
        this.speed = 0.5 * waveMultiplier;
        this.maxHealth = 80 * waveMultiplier;
        this.health = this.maxHealth;
        this.damage = 10;
        this.expValue = 30;
        this.color = [150, 100, 255];
        break;
    }
    
    this.contactDamage = this.damage;
    this.lastDamageFrame = -60;
  }
  
  update(p) {
    if (!gameState.player) return;
    
    // Move toward player
    const dx = gameState.player.x - this.x;
    const dy = gameState.player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 0) {
      this.vx = (dx / dist) * this.speed;
      this.vy = (dy / dist) * this.speed;
    }
    
    this.x += this.vx;
    this.y += this.vy;
    
    // Check collision with player
    const playerDist = Math.sqrt(
      (this.x - gameState.player.x) ** 2 +
      (this.y - gameState.player.y) ** 2
    );
    
    if (playerDist < this.radius + gameState.player.radius) {
      // Damage player on contact (with cooldown)
      if (p.frameCount - this.lastDamageFrame > 60) {
        gameState.player.takeDamage(this.contactDamage);
        this.lastDamageFrame = p.frameCount;
      }
    }
  }
  
  takeDamage(amount) {
    this.health -= amount;
    return this.health <= 0;
  }
  
  render(p) {
    p.push();
    
    // Pulsing animation
    const pulse = p.sin((p.frameCount + this.animationOffset) * 0.1) * 0.15 + 1;
    const renderRadius = this.radius * pulse;
    
    // Body
    p.fill(...this.color);
    p.stroke(this.color[0] * 0.7, this.color[1] * 0.7, this.color[2] * 0.7);
    p.strokeWeight(2);
    
    // Different shapes for different types
    if (this.type === "basic") {
      p.circle(this.x, this.y, renderRadius * 2);
    } else if (this.type === "fast") {
      p.triangle(
        this.x + renderRadius, this.y,
        this.x - renderRadius / 2, this.y - renderRadius,
        this.x - renderRadius / 2, this.y + renderRadius
      );
    } else if (this.type === "tank") {
      p.rect(this.x - renderRadius, this.y - renderRadius, renderRadius * 2, renderRadius * 2);
    }
    
    // Health bar for tougher enemies
    if (this.maxHealth > 30) {
      const barWidth = this.radius * 2;
      const barHeight = 3;
      const barX = this.x - barWidth / 2;
      const barY = this.y - this.radius - 6;
      
      p.fill(100, 30, 30);
      p.noStroke();
      p.rect(barX, barY, barWidth, barHeight);
      
      const healthPercent = this.health / this.maxHealth;
      p.fill(200, 50, 50);
      p.rect(barX, barY, barWidth * healthPercent, barHeight);
    }
    
    p.pop();
  }
}

export function spawnEnemy(p) {
  // Random spawn from edges
  const side = Math.floor(Math.random() * 4);
  let x, y;
  
  switch (side) {
    case 0: // Top
      x = Math.random() * CANVAS_WIDTH;
      y = -20;
      break;
    case 1: // Right
      x = CANVAS_WIDTH + 20;
      y = Math.random() * CANVAS_HEIGHT;
      break;
    case 2: // Bottom
      x = Math.random() * CANVAS_WIDTH;
      y = CANVAS_HEIGHT + 20;
      break;
    case 3: // Left
      x = -20;
      y = Math.random() * CANVAS_HEIGHT;
      break;
  }
  
  // Determine enemy type based on wave
  let type = "basic";
  const rand = Math.random();
  
  if (gameState.waveLevel >= 2) {
    if (rand < 0.3) type = "fast";
    else if (rand < 0.5) type = "tank";
  }
  
  const enemy = new Enemy(x, y, type);
  gameState.enemies.push(enemy);
  gameState.entities.push(enemy);
  
  return enemy;
}