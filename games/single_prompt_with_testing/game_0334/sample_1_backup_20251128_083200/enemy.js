// enemy.js - Enemy entity implementation

import { gameState, COLORS } from './globals.js';
import { distance, angleBetween, addCameraShake, isOnScreen, removeFromArray } from './utils.js';
import { isWalkable } from './world.js';
import { createParticleBurst } from './particles.js';

export class Enemy {
  constructor(x, y, p) {
    this.x = x;
    this.y = y;
    this.radius = 12;
    
    // Physics
    this.vx = 0;
    this.vy = 0;
    this.speed = 1.5;
    
    // Combat
    this.health = 30;
    this.maxHealth = 30;
    this.damage = 10;
    this.attackRange = 25;
    this.detectionRange = 200;
    this.attackCooldown = 60;
    this.lastAttackTime = 0;
    
    // AI state
    this.state = 'idle'; // idle, chase, attack
    this.stateTimer = 0;
    this.wanderAngle = p.random(Math.PI * 2);
    this.wanderTimer = 0;
    
    // Animation
    this.animFrame = 0;
    this.flashTimer = 0;
    
    // Add to game state
    gameState.enemies.push(this);
    gameState.entities.push(this);
  }
  
  update(p) {
    if (!gameState.player) return;
    
    // Update flash effect
    if (this.flashTimer > 0) {
      this.flashTimer--;
    }
    
    // Calculate distance to player
    const distToPlayer = distance(this.x, this.y, gameState.player.x, gameState.player.y);
    
    // AI behavior
    if (distToPlayer < this.detectionRange) {
      this.state = 'chase';
      
      if (distToPlayer < this.attackRange) {
        this.state = 'attack';
        this.tryAttack();
      } else {
        // Move towards player
        const angle = angleBetween(this.x, this.y, gameState.player.x, gameState.player.y);
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
      }
    } else {
      this.state = 'idle';
      
      // Wander behavior
      this.wanderTimer--;
      if (this.wanderTimer <= 0) {
        this.wanderAngle = p.random(Math.PI * 2);
        this.wanderTimer = Math.floor(p.random(60, 120));
      }
      
      this.vx = Math.cos(this.wanderAngle) * this.speed * 0.3;
      this.vy = Math.sin(this.wanderAngle) * this.speed * 0.3;
    }
    
    // Apply movement with collision check
    const nextX = this.x + this.vx;
    const nextY = this.y + this.vy;
    
    if (isWalkable(nextX, this.y)) {
      this.x = nextX;
    } else {
      this.vx = 0;
      this.wanderAngle += Math.PI / 2;
    }
    
    if (isWalkable(this.x, nextY)) {
      this.y = nextY;
    } else {
      this.vy = 0;
      this.wanderAngle += Math.PI / 2;
    }
    
    // Keep in world bounds
    this.x = Math.max(this.radius, Math.min(gameState.worldWidth - this.radius, this.x));
    this.y = Math.max(this.radius, Math.min(gameState.worldHeight - this.radius, this.y));
    
    // Update animation
    this.animFrame += 0.1;
  }
  
  tryAttack() {
    const timeSinceLastAttack = gameState.frameCount - this.lastAttackTime;
    if (timeSinceLastAttack < this.attackCooldown) return;
    
    this.lastAttackTime = gameState.frameCount;
    
    if (gameState.player) {
      const dist = distance(this.x, this.y, gameState.player.x, gameState.player.y);
      if (dist < this.attackRange) {
        gameState.player.takeDamage(this.damage);
        this.flashTimer = 5;
      }
    }
  }
  
  takeDamage(amount) {
    this.health -= amount;
    this.flashTimer = 5;
    
    if (this.health <= 0) {
      this.die();
    }
  }
  
  die() {
    gameState.enemiesDefeated++;
    gameState.score += 100;
    
    createParticleBurst(this.x, this.y, 15, COLORS.enemy);
    addCameraShake(4);
    
    removeFromArray(gameState.enemies, this);
    removeFromArray(gameState.entities, this);
  }
  
  render(p) {
    if (!isOnScreen(this.x, this.y)) return;
    
    const screenX = this.x - gameState.cameraX + gameState.cameraShakeX;
    const screenY = this.y - gameState.cameraY + gameState.cameraShakeY;
    
    p.push();
    p.translate(screenX, screenY);
    
    // Glow effect
    p.fill(...COLORS.enemyGlow);
    p.noStroke();
    p.circle(0, 0, this.radius * 3);
    
    // Flash effect
    const flash = this.flashTimer > 0;
    
    // Main body
    p.fill(...(flash ? [255, 255, 255] : COLORS.enemy));
    p.stroke(0);
    p.strokeWeight(2);
    
    // Animated shape
    const points = 6;
    const pulseOffset = Math.sin(this.animFrame) * 2;
    p.beginShape();
    for (let i = 0; i < points; i++) {
      const angle = (Math.PI * 2 / points) * i;
      const r = this.radius + pulseOffset;
      const px = Math.cos(angle) * r;
      const py = Math.sin(angle) * r;
      p.vertex(px, py);
    }
    p.endShape(p.CLOSE);
    
    // Health bar
    if (this.health < this.maxHealth) {
      const barWidth = 30;
      const barHeight = 4;
      const healthRatio = this.health / this.maxHealth;
      
      p.fill(100, 0, 0);
      p.noStroke();
      p.rect(-barWidth / 2, -this.radius - 10, barWidth, barHeight);
      
      p.fill(255, 0, 0);
      p.rect(-barWidth / 2, -this.radius - 10, barWidth * healthRatio, barHeight);
    }
    
    p.pop();
  }
}