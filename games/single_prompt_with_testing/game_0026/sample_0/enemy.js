// enemy.js - Enemy classes

import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';
import { Projectile } from './projectile.js';

export class Enemy {
  constructor(p, x, y, type = 'melee') {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = 16;
    this.height = 28;
    this.type = type;
    this.health = 1;
    this.alive = true;
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
    this.gravity = 0.4;
    
    // AI
    this.detectionRange = 250;
    this.attackRange = type === 'melee' ? 50 : 300;
    this.moveSpeed = type === 'melee' ? 1.5 : 0.8;
    this.attackCooldown = 0;
    this.attackDelay = type === 'melee' ? 60 : 120;
    this.facingRight = true;
    
    // Animation
    this.animFrame = 0;
    this.animTimer = 0;
    
    // Death
    this.deathTimer = 0;
  }
  
  update() {
    if (!this.alive) {
      this.deathTimer++;
      return;
    }
    
    const p = this.p;
    const player = gameState.player;
    
    if (!player || !player.alive) return;
    
    // Apply gravity
    this.vy += this.gravity;
    if (this.vy > 15) this.vy = 15;
    
    this.y += this.vy;
    
    // Ground collision
    const groundY = CANVAS_HEIGHT - 50;
    if (this.y + this.height >= groundY) {
      this.y = groundY - this.height;
      this.vy = 0;
      this.onGround = true;
    } else {
      this.onGround = false;
    }
    
    // AI behavior
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    // Face player
    this.facingRight = dx > 0;
    
    // Detection and movement
    if (dist < this.detectionRange) {
      if (dist > this.attackRange) {
        // Move toward player
        this.vx = dx > 0 ? this.moveSpeed : -this.moveSpeed;
      } else {
        // In attack range
        this.vx = 0;
        
        // Attack
        if (this.attackCooldown <= 0) {
          this.attack();
          this.attackCooldown = this.attackDelay;
        }
      }
    } else {
      this.vx = 0;
    }
    
    this.x += this.vx;
    
    // Wall collision
    if (this.x < 0) this.x = 0;
    if (this.x + this.width > CANVAS_WIDTH) this.x = CANVAS_WIDTH - this.width;
    
    // Update cooldowns
    if (this.attackCooldown > 0) {
      this.attackCooldown--;
    }
    
    // Animation
    this.animTimer++;
    if (this.animTimer > 10) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % 4;
    }
  }
  
  attack() {
    const player = gameState.player;
    if (!player || !player.alive) return;
    
    if (this.type === 'ranged') {
      // Shoot projectile
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      const projectile = new Projectile(
        this.p,
        this.x + this.width / 2,
        this.y + this.height / 2,
        (dx / dist) * 4,
        (dy / dist) * 4,
        'enemy'
      );
      
      gameState.projectiles.push(projectile);
      gameState.entities.push(projectile);
    }
  }
  
  takeDamage() {
    this.health--;
    if (this.health <= 0) {
      this.alive = false;
      gameState.score += 100;
      this.createDeathParticles();
      return true;
    }
    return false;
  }
  
  createDeathParticles() {
    const p = this.p;
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      const speed = 2 + Math.random() * 2;
      gameState.particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 30,
        maxLife: 30,
        size: 4,
        color: [255, 50, 50]
      });
    }
  }
  
  render() {
    const p = this.p;
    
    if (!this.alive) {
      if (this.deathTimer < 20) {
        p.push();
        p.fill(255, 0, 0, 255 - this.deathTimer * 12);
        p.noStroke();
        p.ellipse(this.x + this.width / 2, this.y + this.height / 2, 30, 30);
        p.pop();
      }
      return;
    }
    
    p.push();
    p.translate(this.x + this.width / 2, this.y + this.height / 2);
    if (!this.facingRight) p.scale(-1, 1);
    
    // Body color based on type
    const bodyColor = this.type === 'melee' ? p.color(180, 60, 60) : p.color(80, 80, 120);
    p.fill(bodyColor);
    p.noStroke();
    p.rect(-this.width / 2, -this.height / 2, this.width, this.height);
    
    // Head
    p.fill(140, 40, 40);
    p.ellipse(0, -this.height / 2 - 4, 10, 10);
    
    // Weapon indicator
    if (this.type === 'ranged') {
      p.fill(100, 100, 140);
      p.rect(this.width / 2, 0, 12, 4);
    } else {
      p.stroke(180);
      p.strokeWeight(2);
      p.line(this.width / 2, 5, this.width / 2 + 15, 0);
    }
    
    // Eyes
    p.fill(255, 200, 0);
    p.noStroke();
    p.ellipse(3, -this.height / 2 - 4, 2, 2);
    
    p.pop();
    
    // Alert indicator when attacking
    if (this.attackCooldown > this.attackDelay - 20) {
      p.push();
      p.fill(255, 0, 0);
      p.noStroke();
      p.ellipse(this.x + this.width / 2, this.y - 10, 6, 6);
      p.pop();
    }
  }
}