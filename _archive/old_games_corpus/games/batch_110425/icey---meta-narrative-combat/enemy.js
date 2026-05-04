import { GRAVITY, GROUND_Y, gameState } from './globals.js';

export class Enemy {
  constructor(p, x, y, type = "basic") {
    this.p = p;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.width = 18;
    this.height = 35;
    this.type = type;
    
    // Stats based on type
    switch(type) {
      case "basic":
        this.health = 30;
        this.maxHealth = 30;
        this.speed = 1.5;
        this.damage = 10;
        this.attackRange = 40;
        this.color = [255, 100, 100];
        this.scoreValue = 50;
        break;
      case "fast":
        this.health = 20;
        this.maxHealth = 20;
        this.speed = 3;
        this.damage = 8;
        this.attackRange = 35;
        this.color = [255, 200, 100];
        this.scoreValue = 75;
        break;
      case "tank":
        this.health = 60;
        this.maxHealth = 60;
        this.speed = 0.8;
        this.damage = 15;
        this.attackRange = 45;
        this.color = [200, 100, 255];
        this.scoreValue = 100;
        break;
    }
    
    this.grounded = false;
    this.attacking = false;
    this.attackTimer = 0;
    this.attackCooldown = 0;
    this.hitFlash = 0;
    this.dead = false;
    this.facing = -1;
    this.aggroRange = 250;
    this.patrolTarget = x + this.p.random(-100, 100);
    this.state = "patrol"; // patrol, chase, attack
  }
  
  update() {
    if (this.dead) return;
    
    const p = this.p;
    
    // Apply gravity
    if (this.y < GROUND_Y) {
      this.vy += GRAVITY;
      this.grounded = false;
    } else {
      this.y = GROUND_Y;
      this.vy = 0;
      this.grounded = true;
    }
    
    // Update timers
    if (this.attackCooldown > 0) this.attackCooldown--;
    if (this.hitFlash > 0) this.hitFlash--;
    
    // AI behavior
    const player = gameState.player;
    if (player) {
      const distToPlayer = Math.abs(this.x - player.x);
      
      if (distToPlayer < this.aggroRange) {
        this.state = "chase";
        
        // Move towards player
        if (distToPlayer > this.attackRange) {
          if (this.x < player.x) {
            this.vx = this.speed;
            this.facing = 1;
          } else {
            this.vx = -this.speed;
            this.facing = -1;
          }
        } else {
          this.state = "attack";
          this.vx = 0;
          
          // Attack
          if (this.attackCooldown === 0 && !this.attacking) {
            this.attacking = true;
            this.attackTimer = 0;
            this.attackCooldown = 80;
          }
        }
      } else {
        this.state = "patrol";
        
        // Patrol behavior
        if (Math.abs(this.x - this.patrolTarget) < 10) {
          this.patrolTarget = this.x + p.random(-100, 100);
        }
        
        if (this.x < this.patrolTarget) {
          this.vx = this.speed * 0.5;
          this.facing = 1;
        } else {
          this.vx = -this.speed * 0.5;
          this.facing = -1;
        }
      }
    }
    
    // Attack mechanics
    if (this.attacking) {
      this.attackTimer++;
      
      // Check if attack hits player
      if (this.attackTimer === 10 && player) {
        const dist = Math.abs(this.x - player.x);
        if (dist < this.attackRange + 20 && Math.abs(this.y - player.y) < 50) {
          player.takeDamage(this.damage);
        }
      }
      
      if (this.attackTimer >= 30) {
        this.attacking = false;
        this.attackTimer = 0;
      }
    }
    
    // Apply velocity
    this.x += this.vx;
    this.y += this.vy;
    
    // Friction
    this.vx *= 0.9;
  }
  
  takeDamage(amount) {
    this.health -= amount;
    this.hitFlash = 10;
    
    if (this.health <= 0) {
      this.health = 0;
      this.dead = true;
      gameState.score += this.scoreValue;
      
      // Update combo
      gameState.combo++;
      if (gameState.combo > gameState.maxCombo) {
        gameState.maxCombo = gameState.combo;
      }
      gameState.lastHitTime = this.p.frameCount;
      
      // Create particles
      this.createDeathParticles();
      return true;
    }
    return false;
  }
  
  createDeathParticles() {
    for (let i = 0; i < 8; i++) {
      gameState.particles.push({
        x: this.x,
        y: this.y - 20,
        vx: this.p.random(-3, 3),
        vy: this.p.random(-5, -2),
        life: 30,
        maxLife: 30,
        color: this.color
      });
    }
  }
  
  draw() {
    if (this.dead) return;
    
    const p = this.p;
    const screenX = this.x - gameState.cameraX;
    
    p.push();
    p.translate(screenX, this.y);
    
    // Flash when hit
    if (this.hitFlash > 0) {
      p.fill(255, 255, 255);
    } else {
      p.fill(...this.color);
    }
    
    // Body
    p.noStroke();
    p.rect(-this.width/2, -this.height, this.width, this.height);
    
    // Head
    p.fill(...(this.hitFlash > 0 ? [255, 255, 255] : this.color.map(c => c * 0.8)));
    p.ellipse(0, -this.height - 6, 12, 12);
    
    // Eyes (menacing)
    p.fill(255, 0, 0);
    p.ellipse(this.facing * 2, -this.height - 6, 3, 3);
    
    // Attack indicator
    if (this.attacking && this.attackTimer > 5) {
      p.fill(255, 0, 0, 150);
      p.ellipse(this.facing * 20, -20, 25, 25);
    }
    
    p.pop();
    
    // Health bar
    if (this.health < this.maxHealth) {
      p.push();
      p.fill(50);
      p.noStroke();
      p.rect(screenX - 15, this.y - this.height - 15, 30, 3);
      p.fill(255, 100, 100);
      p.rect(screenX - 15, this.y - this.height - 15, 30 * (this.health / this.maxHealth), 3);
      p.pop();
    }
  }
}