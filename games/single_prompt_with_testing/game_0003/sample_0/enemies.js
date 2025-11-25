// enemies.js - Enemy entities and AI
import { ENEMY_BASE_SIZE, ENEMY_BASE_SPEED, ENEMY_BASE_DAMAGE, ENEMY_BASE_HEALTH, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Enemy {
  constructor(x, y, type = 'basic') {
    this.x = x;
    this.y = y;
    this.type = type;
    this.size = ENEMY_BASE_SIZE;
    this.speed = ENEMY_BASE_SPEED;
    this.damage = ENEMY_BASE_DAMAGE;
    this.health = ENEMY_BASE_HEALTH;
    this.maxHealth = ENEMY_BASE_HEALTH;
    this.dead = false;
    this.attackCooldown = 0;
    this.attackCooldownMax = 60;
    this.hitFlash = 0;
    this.animTimer = 0;
    
    // Apply type modifiers
    this.applyTypeModifiers();
  }
  
  applyTypeModifiers() {
    switch (this.type) {
      case 'fast':
        this.speed *= 1.5;
        this.health *= 0.7;
        this.maxHealth *= 0.7;
        this.size *= 0.9;
        break;
      case 'tank':
        this.speed *= 0.7;
        this.health *= 2.0;
        this.maxHealth *= 2.0;
        this.size *= 1.3;
        this.damage *= 1.5;
        break;
      case 'swarm':
        this.speed *= 1.2;
        this.health *= 0.5;
        this.maxHealth *= 0.5;
        this.size *= 0.7;
        break;
    }
  }
  
  update(p, player, difficultyMultiplier) {
    if (this.dead) return;
    
    // AI: Move towards player
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 1) {
      this.x += (dx / dist) * this.speed * difficultyMultiplier;
      this.y += (dy / dist) * this.speed * difficultyMultiplier;
    }
    
    // Attack cooldown
    if (this.attackCooldown > 0) {
      this.attackCooldown--;
    }
    
    // Hit flash
    if (this.hitFlash > 0) {
      this.hitFlash--;
    }
    
    // Animation
    this.animTimer++;
  }
  
  takeDamage(amount) {
    this.health -= amount;
    this.hitFlash = 5;
    if (this.health <= 0) {
      this.dead = true;
      return true;
    }
    return false;
  }
  
  canAttack() {
    return this.attackCooldown <= 0;
  }
  
  attack() {
    this.attackCooldown = this.attackCooldownMax;
  }
  
  render(p, camera) {
    if (this.dead) return;
    
    const screenX = this.x - camera.x + CANVAS_WIDTH / 2;
    const screenY = this.y - camera.y + CANVAS_HEIGHT / 2;
    
    p.push();
    
    // Flash when hit
    if (this.hitFlash > 0) {
      p.fill(255, 200, 200);
    } else {
      // Different colors by type
      switch (this.type) {
        case 'fast':
          p.fill(255, 100, 100);
          break;
        case 'tank':
          p.fill(150, 50, 150);
          break;
        case 'swarm':
          p.fill(100, 255, 100);
          break;
        default:
          p.fill(200, 50, 50);
      }
    }
    
    p.stroke(100, 0, 0);
    p.strokeWeight(2);
    
    // Body
    const wobble = Math.sin(this.animTimer * 0.15) * 2;
    p.ellipse(screenX, screenY + wobble, this.size, this.size * 1.2);
    
    // Eyes
    p.fill(255, 0, 0);
    p.noStroke();
    p.ellipse(screenX - this.size * 0.2, screenY - this.size * 0.1, 4, 4);
    p.ellipse(screenX + this.size * 0.2, screenY - this.size * 0.1, 4, 4);
    
    // Health bar
    if (this.health < this.maxHealth) {
      const barWidth = this.size;
      const barHeight = 3;
      const healthPercent = this.health / this.maxHealth;
      
      p.fill(50);
      p.rect(screenX - barWidth / 2, screenY - this.size - 5, barWidth, barHeight);
      p.fill(255, 0, 0);
      p.rect(screenX - barWidth / 2, screenY - this.size - 5, barWidth * healthPercent, barHeight);
    }
    
    p.pop();
  }
}

export function spawnEnemy(p, player, difficultyMultiplier) {
  // Spawn off-screen around player
  const angle = p.random(0, p.TWO_PI);
  const distance = 400;
  const x = player.x + Math.cos(angle) * distance;
  const y = player.y + Math.sin(angle) * distance;
  
  // Choose enemy type based on difficulty
  let type = 'basic';
  const roll = p.random(0, 100);
  
  if (difficultyMultiplier > 1.5) {
    if (roll < 15) type = 'tank';
    else if (roll < 40) type = 'fast';
    else if (roll < 60) type = 'swarm';
  } else if (difficultyMultiplier > 1.2) {
    if (roll < 10) type = 'tank';
    else if (roll < 35) type = 'fast';
    else if (roll < 50) type = 'swarm';
  } else {
    if (roll < 20) type = 'fast';
    else if (roll < 35) type = 'swarm';
  }
  
  return new Enemy(x, y, type);
}