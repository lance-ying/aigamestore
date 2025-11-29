// enemy.js - Enemy classes and AI

import {
  ENEMY_SIZE, ENEMY_SPEED, ENEMY_DAMAGE, ENEMY_ATTACK_COOLDOWN,
  ENEMY_HEALTH, ENEMY_DETECTION_RANGE, WALL_THICKNESS,
  ROOM_WIDTH, ROOM_HEIGHT
} from './globals.js';

export class Enemy {
  constructor(x, y, type, p) {
    this.x = x;
    this.y = y;
    this.type = type; // 'basic', 'fast', 'heavy'
    this.p = p;
    
    this.width = ENEMY_SIZE;
    this.height = ENEMY_SIZE;
    
    this.health = ENEMY_HEALTH;
    this.maxHealth = ENEMY_HEALTH;
    this.damage = ENEMY_DAMAGE;
    this.speed = ENEMY_SPEED;
    
    // Type-specific stats
    if (type === 'fast') {
      this.speed = ENEMY_SPEED * 1.5;
      this.health = ENEMY_HEALTH * 0.7;
      this.maxHealth = this.health;
      this.width = ENEMY_SIZE * 0.8;
      this.height = ENEMY_SIZE * 0.8;
    } else if (type === 'heavy') {
      this.speed = ENEMY_SPEED * 0.7;
      this.health = ENEMY_HEALTH * 1.5;
      this.maxHealth = this.health;
      this.damage = ENEMY_DAMAGE * 1.5;
      this.width = ENEMY_SIZE * 1.3;
      this.height = ENEMY_SIZE * 1.3;
    }
    
    this.vx = 0;
    this.vy = 0;
    
    this.attackCooldown = 0;
    this.hitFlash = 0;
    
    this.animFrame = 0;
    this.dead = false;
  }
  
  update(gameState) {
    if (this.dead) return;
    
    this.animFrame++;
    
    if (this.attackCooldown > 0) this.attackCooldown--;
    if (this.hitFlash > 0) this.hitFlash--;
    
    const player = gameState.player;
    if (!player) return;
    
    // Calculate distance to player
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    // AI behavior
    if (dist < ENEMY_DETECTION_RANGE) {
      // Move toward player
      const angle = Math.atan2(dy, dx);
      this.vx = Math.cos(angle) * this.speed;
      this.vy = Math.sin(angle) * this.speed;
      
      // Attack if close enough
      if (dist < 30 && this.attackCooldown === 0) {
        this.attack(player);
      }
    } else {
      // Idle movement
      this.vx *= 0.9;
      this.vy *= 0.9;
    }
    
    // Apply movement
    this.x += this.vx;
    this.y += this.vy;
    
    // Constrain to room
    this.constrainToRoom();
  }
  
  constrainToRoom() {
    const minX = WALL_THICKNESS + this.width / 2;
    const maxX = ROOM_WIDTH - WALL_THICKNESS - this.width / 2;
    const minY = WALL_THICKNESS + this.height / 2;
    const maxY = ROOM_HEIGHT - WALL_THICKNESS - this.height / 2;
    
    if (this.x < minX) {
      this.x = minX;
      this.vx = 0;
    }
    if (this.x > maxX) {
      this.x = maxX;
      this.vx = 0;
    }
    if (this.y < minY) {
      this.y = minY;
      this.vy = 0;
    }
    if (this.y > maxY) {
      this.y = maxY;
      this.vy = 0;
    }
  }
  
  attack(player) {
    player.takeDamage(this.damage);
    this.attackCooldown = ENEMY_ATTACK_COOLDOWN;
  }
  
  takeDamage(amount, gameState) {
    this.health -= amount;
    this.hitFlash = 10;
    
    if (this.health <= 0) {
      this.die(gameState);
    }
  }
  
  die(gameState) {
    this.dead = true;
    gameState.score += 100;
    
    // Remove from enemies array
    const index = gameState.enemies.indexOf(this);
    if (index > -1) {
      gameState.enemies.splice(index, 1);
    }
    
    // Spawn particles
    this.spawnDeathParticles(gameState);
  }
  
  spawnDeathParticles(gameState) {
    const colors = this.getColors();
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const speed = 2 + Math.random() * 2;
      gameState.particles.push({
        x: this.x,
        y: this.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 30,
        maxLife: 30,
        color: colors.main
      });
    }
  }
  
  getColors() {
    if (this.type === 'fast') {
      return {
        main: [100, 200, 255],
        dark: [50, 100, 200],
        eye: [255, 255, 255]
      };
    } else if (this.type === 'heavy') {
      return {
        main: [200, 50, 50],
        dark: [150, 30, 30],
        eye: [255, 200, 100]
      };
    }
    return {
      main: [80, 180, 80],
      dark: [40, 100, 40],
      eye: [255, 100, 100]
    };
  }
  
  render(p) {
    if (this.dead) return;
    
    p.push();
    
    // Shadow
    p.fill(0, 0, 0, 50);
    p.noStroke();
    p.ellipse(this.x, this.y + 5, this.width * 1.2, this.height * 0.4);
    
    const colors = this.getColors();
    
    // Hit flash
    const flash = this.hitFlash > 0;
    
    // Main body
    p.fill(...(flash ? [255, 255, 255] : colors.main));
    p.stroke(...colors.dark);
    p.strokeWeight(2);
    p.ellipse(this.x, this.y, this.width, this.height);
    
    if (!flash) {
      // Eyes
      p.fill(...colors.eye);
      p.noStroke();
      const eyeOffset = this.width * 0.2;
      p.ellipse(this.x - eyeOffset, this.y - eyeOffset * 0.5, 4, 4);
      p.ellipse(this.x + eyeOffset, this.y - eyeOffset * 0.5, 4, 4);
      
      // Type indicator
      if (this.type === 'fast') {
        // Speed lines
        p.stroke(150, 220, 255, 100);
        p.strokeWeight(1);
        for (let i = 0; i < 3; i++) {
          const offset = (this.animFrame + i * 5) % 15 - 7;
          p.line(this.x - this.width, this.y + offset, this.x - this.width - 10, this.y + offset);
        }
      } else if (this.type === 'heavy') {
        // Armor plates
        p.fill(100, 30, 30);
        p.noStroke();
        p.rect(this.x - this.width * 0.3, this.y - this.height * 0.5, this.width * 0.2, this.height * 0.3);
        p.rect(this.x + this.width * 0.1, this.y - this.height * 0.5, this.width * 0.2, this.height * 0.3);
      }
    }
    
    // Health bar
    if (this.health < this.maxHealth) {
      const barWidth = this.width;
      const barHeight = 4;
      const barY = this.y - this.height / 2 - 10;
      
      p.fill(50, 50, 50);
      p.noStroke();
      p.rect(this.x - barWidth / 2, barY, barWidth, barHeight);
      
      p.fill(200, 50, 50);
      const healthWidth = (this.health / this.maxHealth) * barWidth;
      p.rect(this.x - barWidth / 2, barY, healthWidth, barHeight);
    }
    
    p.pop();
  }
}