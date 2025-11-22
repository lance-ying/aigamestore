// enemy.js - Enemy entities

import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';

export class Enemy {
  constructor(p, x, y, type = 'basic') {
    this.p = p;
    this.x = x;
    this.y = y;
    this.type = type;
    this.isDead = false;
    
    // Set properties based on type
    this.setupType();
    
    this.vx = 0;
    this.vy = 0;
    this.angle = 0;
    this.fireTimer = 0;
    this.behaviorTimer = 0;
  }
  
  setupType() {
    const types = {
      basic: {
        width: 20,
        height: 20,
        speed: 1.5,
        health: 30,
        damage: 10,
        fireRate: 60,
        color: [200, 80, 80],
        score: 10
      },
      fast: {
        width: 16,
        height: 16,
        speed: 2.8,
        health: 20,
        damage: 8,
        fireRate: 80,
        color: [255, 150, 80],
        score: 15
      },
      tank: {
        width: 28,
        height: 28,
        speed: 0.8,
        health: 80,
        damage: 15,
        fireRate: 45,
        color: [120, 80, 200],
        score: 25
      },
      sniper: {
        width: 18,
        height: 18,
        speed: 1.2,
        health: 25,
        damage: 20,
        fireRate: 120,
        color: [80, 200, 120],
        score: 20
      }
    };
    
    const typeData = types[this.type] || types.basic;
    Object.assign(this, typeData);
    this.maxHealth = this.health;
  }
  
  update() {
    if (this.isDead || !gameState.player || gameState.player.isDead) return;
    
    this.behaviorTimer++;
    
    // AI behavior based on type
    switch(this.type) {
      case 'basic':
        this.basicBehavior();
        break;
      case 'fast':
        this.fastBehavior();
        break;
      case 'tank':
        this.tankBehavior();
        break;
      case 'sniper':
        this.sniperBehavior();
        break;
    }
    
    // Apply movement
    this.x += this.vx;
    this.y += this.vy;
    
    // Boundary check
    this.x = this.p.constrain(this.x, this.width / 2, CANVAS_WIDTH - this.width / 2);
    this.y = this.p.constrain(this.y, this.height / 2, CANVAS_HEIGHT - this.height / 2);
    
    // Update angle
    const dx = gameState.player.x - this.x;
    const dy = gameState.player.y - this.y;
    this.angle = this.p.atan2(dy, dx);
    
    // Fire cooldown
    this.fireTimer--;
  }
  
  basicBehavior() {
    // Move toward player, maintain medium distance
    const dx = gameState.player.x - this.x;
    const dy = gameState.player.y - this.y;
    const dist = this.p.sqrt(dx * dx + dy * dy);
    
    if (dist > 150) {
      this.vx = (dx / dist) * this.speed;
      this.vy = (dy / dist) * this.speed;
    } else if (dist < 100) {
      this.vx = -(dx / dist) * this.speed * 0.5;
      this.vy = -(dy / dist) * this.speed * 0.5;
    } else {
      this.vx *= 0.9;
      this.vy *= 0.9;
    }
  }
  
  fastBehavior() {
    // Aggressive chase
    const dx = gameState.player.x - this.x;
    const dy = gameState.player.y - this.y;
    const dist = this.p.sqrt(dx * dx + dy * dy);
    
    this.vx = (dx / dist) * this.speed;
    this.vy = (dy / dist) * this.speed;
  }
  
  tankBehavior() {
    // Slow advance, strafe occasionally
    const dx = gameState.player.x - this.x;
    const dy = gameState.player.y - this.y;
    const dist = this.p.sqrt(dx * dx + dy * dy);
    
    if (this.behaviorTimer % 120 < 60) {
      this.vx = (dx / dist) * this.speed;
      this.vy = (dy / dist) * this.speed;
    } else {
      // Strafe
      this.vx = -(dy / dist) * this.speed;
      this.vy = (dx / dist) * this.speed;
    }
  }
  
  sniperBehavior() {
    // Keep distance
    const dx = gameState.player.x - this.x;
    const dy = gameState.player.y - this.y;
    const dist = this.p.sqrt(dx * dx + dy * dy);
    
    if (dist < 220) {
      this.vx = -(dx / dist) * this.speed;
      this.vy = -(dy / dist) * this.speed;
    } else if (dist > 280) {
      this.vx = (dx / dist) * this.speed * 0.5;
      this.vy = (dy / dist) * this.speed * 0.5;
    } else {
      this.vx *= 0.95;
      this.vy *= 0.95;
    }
  }
  
  fire() {
    if (this.fireTimer > 0 || !gameState.player) return null;
    
    this.fireTimer = this.fireRate;
    
    // Different firing patterns based on type
    const bullets = [];
    
    if (this.type === 'sniper') {
      // Single accurate shot
      bullets.push({
        x: this.x,
        y: this.y,
        angle: this.angle,
        damage: this.damage
      });
    } else if (this.type === 'tank') {
      // Triple shot
      for (let i = -1; i <= 1; i++) {
        bullets.push({
          x: this.x,
          y: this.y,
          angle: this.angle + i * 0.2,
          damage: this.damage
        });
      }
    } else {
      // Single shot
      bullets.push({
        x: this.x,
        y: this.y,
        angle: this.angle,
        damage: this.damage
      });
    }
    
    return bullets;
  }
  
  takeDamage(amount) {
    if (this.isDead) return false;
    
    this.health -= amount;
    if (this.health <= 0) {
      this.health = 0;
      this.isDead = true;
      return true;
    }
    return false;
  }
  
  render() {
    const p = this.p;
    
    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.angle);
    
    // Body
    const colors = {
      basic: [200, 80, 80],
      fast: [255, 150, 80],
      tank: [120, 80, 200],
      sniper: [80, 200, 120]
    };
    const color = colors[this.type] || colors.basic;
    
    p.fill(...color);
    p.stroke(...color.map(c => c * 0.7));
    p.strokeWeight(2);
    
    if (this.type === 'tank') {
      p.rect(-this.width / 2, -this.height / 2, this.width, this.height, 2);
    } else {
      p.triangle(-this.width / 2, -this.height / 2,
                 -this.width / 2, this.height / 2,
                 this.width / 2, 0);
    }
    
    // Core
    p.fill(...color.map(c => c * 1.3));
    p.noStroke();
    p.circle(0, 0, this.width * 0.4);
    
    p.pop();
    
    // Health bar
    this.renderHealthBar();
  }
  
  renderHealthBar() {
    const p = this.p;
    const barWidth = this.width;
    const barHeight = 3;
    const barX = this.x - barWidth / 2;
    const barY = this.y - this.height / 2 - 8;
    
    p.push();
    p.noStroke();
    
    p.fill(40, 40, 40);
    p.rect(barX, barY, barWidth, barHeight);
    
    const healthWidth = (this.health / this.maxHealth) * barWidth;
    p.fill(200, 80, 80);
    p.rect(barX, barY, healthWidth, barHeight);
    
    p.pop();
  }
}