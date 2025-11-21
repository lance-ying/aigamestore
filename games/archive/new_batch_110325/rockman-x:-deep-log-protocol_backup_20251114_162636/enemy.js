import { CANVAS_HEIGHT, gameState } from './globals.js';

export class Enemy {
  constructor(p, x, y, type = 'basic') {
    this.p = p;
    this.x = x;
    this.y = y;
    this.type = type;
    this.width = 24;
    this.height = 24;
    this.vx = 0;
    this.vy = 0;
    this.health = type === 'basic' ? 30 : 50;
    this.maxHealth = this.health;
    this.damage = type === 'basic' ? 10 : 15;
    this.speed = type === 'basic' ? 1 : 1.5;
    this.shootCooldown = 0;
    this.shootDelay = type === 'basic' ? 90 : 60;
    this.active = true;
    this.animFrame = 0;
    this.patrolLeft = x - 100;
    this.patrolRight = x + 100;
    this.movingRight = true;
  }

  update(platforms) {
    const p = this.p;
    
    if (!this.active) return;
    
    // AI behavior
    if (gameState.player) {
      const distToPlayer = Math.abs(this.x - gameState.player.x);
      
      if (distToPlayer < 300) {
        // Chase player
        if (this.x < gameState.player.x) {
          this.vx = this.speed;
          this.movingRight = true;
        } else {
          this.vx = -this.speed;
          this.movingRight = false;
        }
      } else {
        // Patrol
        if (this.x <= this.patrolLeft) {
          this.movingRight = true;
        } else if (this.x >= this.patrolRight) {
          this.movingRight = false;
        }
        this.vx = this.movingRight ? this.speed : -this.speed;
      }
    }
    
    // Apply gravity
    this.vy += 0.5;
    this.vy = Math.min(this.vy, 15);
    
    // Update position
    this.x += this.vx;
    this.y += this.vy;
    
    // Platform collision
    for (let platform of platforms) {
      if (p.collideRectRect(
        this.x - this.width / 2, this.y - this.height / 2,
        this.width, this.height,
        platform.x, platform.y,
        platform.width, platform.height
      )) {
        if (this.vy > 0 && this.y - this.height / 2 < platform.y + 10) {
          this.y = platform.y - this.height / 2;
          this.vy = 0;
        }
      }
    }
    
    // Shooting
    this.shootCooldown--;
    if (this.shootCooldown <= 0 && gameState.player) {
      const distToPlayer = Math.abs(this.x - gameState.player.x);
      if (distToPlayer < 250) {
        this.shootCooldown = this.shootDelay;
        return true; // Signal to create projectile
      }
    }
    
    // Death check
    if (this.y > CANVAS_HEIGHT + 50) {
      this.active = false;
    }
    
    this.animFrame = (this.animFrame + 0.15) % 4;
    return false;
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.active = false;
      gameState.enemiesDefeated++;
      gameState.score += this.type === 'basic' ? 100 : 200;
    }
  }

  draw() {
    if (!this.active) return;
    
    const p = this.p;
    const screenX = this.x - gameState.camera.x;
    const screenY = this.y - gameState.camera.y;
    
    p.push();
    p.translate(screenX, screenY);
    
    if (!this.movingRight) {
      p.scale(-1, 1);
    }
    
    // Draw enemy (red corrupted robot)
    const pulse = Math.sin(this.animFrame * 2) * 0.1 + 0.9;
    
    // Body
    p.fill(200 * pulse, 20, 20);
    p.rect(-10, -10, 20, 20, 2);
    
    // Eye
    p.fill(255, 50, 50);
    p.ellipse(4, -4, 6, 6);
    
    // Corruption effect
    p.fill(255, 0, 0, 50);
    p.ellipse(0, 0, 30 * pulse, 30 * pulse);
    
    // Health bar
    if (this.health < this.maxHealth) {
      p.fill(60);
      p.rect(-12, -20, 24, 3);
      p.fill(200, 0, 0);
      p.rect(-12, -20, 24 * (this.health / this.maxHealth), 3);
    }
    
    p.pop();
  }
}

export class Boss {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = 60;
    this.height = 80;
    this.health = 500;
    this.maxHealth = 500;
    this.damage = 20;
    this.active = true;
    this.phase = 1;
    this.attackCooldown = 0;
    this.attackPattern = 0;
    this.animFrame = 0;
    this.vy = 0;
    this.targetY = y;
    this.invincible = 0;
  }

  update() {
    if (!this.active) return;
    
    this.animFrame = (this.animFrame + 0.2) % 8;
    if (this.invincible > 0) this.invincible--;
    
    // Phase changes
    if (this.health < this.maxHealth * 0.5 && this.phase === 1) {
      this.phase = 2;
    }
    
    // Floating movement
    this.vy += (this.targetY - this.y) * 0.05;
    this.vy *= 0.95;
    this.y += this.vy;
    
    // Attack patterns
    this.attackCooldown--;
    if (this.attackCooldown <= 0) {
      this.attackCooldown = this.phase === 1 ? 120 : 80;
      this.attackPattern = (this.attackPattern + 1) % 3;
      return { attack: true, pattern: this.attackPattern };
    }
    
    return { attack: false };
  }

  takeDamage(amount) {
    if (this.invincible > 0) return;
    this.health -= amount;
    this.invincible = 10;
    if (this.health <= 0) {
      this.active = false;
      gameState.bossDefeated = true;
      gameState.score += 5000;
    }
  }

  draw() {
    if (!this.active) return;
    
    const p = this.p;
    const screenX = this.x - gameState.camera.x;
    const screenY = this.y - gameState.camera.y;
    
    p.push();
    p.translate(screenX, screenY);
    
    const pulse = Math.sin(this.animFrame) * 0.1 + 1;
    
    // Boss body (large corrupted elite)
    p.fill(100, 0, 150);
    p.rect(-30, -40, 60, 80, 5);
    
    // Armor plates
    p.fill(150, 0, 200);
    p.rect(-25, -35, 20, 30, 3);
    p.rect(5, -35, 20, 30, 3);
    
    // Core (weak point)
    p.fill(255, 50, 255, 200);
    p.ellipse(0, -10, 20 * pulse, 20 * pulse);
    
    // Eyes
    p.fill(255, 0, 0);
    p.ellipse(-12, -25, 8, 8);
    p.ellipse(12, -25, 8, 8);
    
    // Corruption aura
    if (this.phase === 2) {
      p.fill(200, 0, 255, 30);
      p.ellipse(0, -10, 80 * pulse, 80 * pulse);
    }
    
    // Health bar (top of screen position)
    p.push();
    p.translate(-screenX + 300, -screenY + 20);
    p.fill(60);
    p.rect(-250, 0, 500, 15);
    p.fill(200, 0, 200);
    p.rect(-250, 0, 500 * (this.health / this.maxHealth), 15);
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(12);
    p.text("BOSS", 0, -15);
    p.pop();
    
    p.pop();
  }
}