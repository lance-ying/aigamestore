// enemies.js - Enemy entities and behaviors

import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';

export class Enemy {
  constructor(x, y, type = 'basic') {
    this.x = x;
    this.y = y;
    this.type = type;
    this.setupType();
    this.hitCooldown = 0;
  }
  
  setupType() {
    switch(this.type) {
      case 'basic':
        this.size = 15;
        this.speed = 1.5;
        this.health = 20;
        this.maxHealth = 20;
        this.damage = 5;
        this.color = [255, 100, 100];
        this.xpValue = 3;
        this.scoreValue = 10;
        break;
      case 'fast':
        this.size = 12;
        this.speed = 2.8;
        this.health = 10;
        this.maxHealth = 10;
        this.damage = 3;
        this.color = [255, 150, 100];
        this.xpValue = 2;
        this.scoreValue = 15;
        break;
      case 'tank':
        this.size = 22;
        this.speed = 0.8;
        this.health = 50;
        this.maxHealth = 50;
        this.damage = 10;
        this.color = [200, 80, 80];
        this.xpValue = 8;
        this.scoreValue = 30;
        break;
      case 'shooter':
        this.size = 14;
        this.speed = 1.0;
        this.health = 15;
        this.maxHealth = 15;
        this.damage = 4;
        this.color = [255, 100, 200];
        this.xpValue = 5;
        this.scoreValue = 20;
        this.shootCooldown = 90;
        this.lastShotTime = 0;
        break;
    }
  }
  
  update(p, player) {
    if (this.hitCooldown > 0) {
      this.hitCooldown--;
    }
    
    // Move toward player
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 0) {
      this.x += (dx / dist) * this.speed * gameState.difficulty;
      this.y += (dy / dist) * this.speed * gameState.difficulty;
    }
    
    // Shooter type behavior
    if (this.type === 'shooter' && dist > 100) {
      const currentTime = p.frameCount;
      if (currentTime - this.lastShotTime >= this.shootCooldown) {
        this.shoot(p, player);
        this.lastShotTime = currentTime;
      }
    }
    
    // Check collision with player
    const collisionDist = this.size + player.size;
    if (dist < collisionDist && this.hitCooldown === 0) {
      player.takeDamage(this.damage);
      this.hitCooldown = 30;
    }
  }
  
  shoot(p, player) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 0) {
      gameState.projectiles.push({
        x: this.x,
        y: this.y,
        vx: (dx / dist) * 3,
        vy: (dy / dist) * 3,
        size: 5,
        damage: this.damage,
        lifetime: 90,
        age: 0,
        color: [255, 50, 150],
        type: 'enemy_projectile',
        piercing: false
      });
    }
  }
  
  takeDamage(amount) {
    this.health -= amount;
    this.hitCooldown = 5;
    return this.health <= 0;
  }
  
  draw(p) {
    p.push();
    
    // Flash when hit
    const isHit = this.hitCooldown > 0;
    
    // Shadow
    p.fill(0, 0, 0, 50);
    p.noStroke();
    p.ellipse(this.x + 2, this.y + 2, this.size * 2, this.size * 2);
    
    // Body
    p.fill(...(isHit ? [255, 255, 255] : this.color));
    p.stroke(50);
    p.strokeWeight(2);
    p.ellipse(this.x, this.y, this.size * 2, this.size * 2);
    
    // Type indicator
    p.fill(100);
    p.noStroke();
    if (this.type === 'fast') {
      // Triangle
      p.triangle(
        this.x, this.y - 6,
        this.x - 5, this.y + 5,
        this.x + 5, this.y + 5
      );
    } else if (this.type === 'tank') {
      // Square
      p.rect(this.x - 5, this.y - 5, 10, 10);
    } else if (this.type === 'shooter') {
      // Cross
      p.rect(this.x - 6, this.y - 2, 12, 4);
      p.rect(this.x - 2, this.y - 6, 4, 12);
    }
    
    p.pop();
    
    // Health bar
    if (this.health < this.maxHealth) {
      const barWidth = this.size * 2;
      const barHeight = 3;
      const barY = this.y - this.size - 6;
      
      p.fill(50);
      p.noStroke();
      p.rect(this.x - barWidth / 2, barY, barWidth, barHeight);
      
      const healthPercent = this.health / this.maxHealth;
      p.fill(255, 100, 100);
      p.rect(this.x - barWidth / 2, barY, barWidth * healthPercent, barHeight);
    }
  }
}

export function spawnEnemy(p) {
  const side = Math.floor(Math.random() * 4);
  let x, y;
  
  switch(side) {
    case 0: // top
      x = Math.random() * CANVAS_WIDTH;
      y = -20;
      break;
    case 1: // right
      x = CANVAS_WIDTH + 20;
      y = Math.random() * CANVAS_HEIGHT;
      break;
    case 2: // bottom
      x = Math.random() * CANVAS_WIDTH;
      y = CANVAS_HEIGHT + 20;
      break;
    case 3: // left
      x = -20;
      y = Math.random() * CANVAS_HEIGHT;
      break;
  }
  
  // Determine enemy type based on difficulty
  const rand = Math.random();
  let type = 'basic';
  
  if (gameState.difficulty > 1.5) {
    if (rand < 0.3) type = 'fast';
    else if (rand < 0.5) type = 'tank';
    else if (rand < 0.65) type = 'shooter';
  } else if (gameState.difficulty > 1.0) {
    if (rand < 0.3) type = 'fast';
    else if (rand < 0.4) type = 'tank';
  }
  
  const enemy = new Enemy(x, y, type);
  gameState.enemies.push(enemy);
  gameState.entities.push(enemy);
}