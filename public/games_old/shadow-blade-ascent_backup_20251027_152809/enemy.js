// enemy.js
import { CANVAS_HEIGHT, gameState } from './globals.js';

export class Enemy {
  constructor(x, y, type, level) {
    this.x = x;
    this.y = y;
    this.type = type; // 'minion', 'archer', 'guard', 'boss'
    this.width = 30;
    this.height = 50;
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
    this.facingRight = false;
    this.state = 'idle';
    this.animTimer = 0;
    this.aggroRange = 300;
    this.patrolRange = 100;
    this.patrolCenter = x;
    this.attackTimer = 0;
    this.attackCooldown = 60;
    this.shootTimer = 0;
    this.shootCooldown = 120;
    this.dead = false;
    this.deathTimer = 0;
    this.hitFlash = 0;
    
    // Scale stats by type and level
    this.setupStats(type, level);
    
    this.moveSpeed = 2;
    this.gravity = 0.6;
    this.maxFallSpeed = 15;
  }
  
  setupStats(type, level) {
    const levelMult = 1 + (level - 1) * 0.3;
    
    switch(type) {
      case 'minion':
        this.maxHealth = Math.floor(30 * levelMult);
        this.attackPower = Math.floor(5 * levelMult);
        this.defense = Math.floor(1 * levelMult);
        this.xpValue = 25;
        this.scoreValue = 25;
        this.width = 30;
        this.height = 50;
        break;
      case 'archer':
        this.maxHealth = Math.floor(25 * levelMult);
        this.attackPower = Math.floor(8 * levelMult);
        this.defense = Math.floor(0 * levelMult);
        this.xpValue = 30;
        this.scoreValue = 30;
        this.width = 30;
        this.height = 50;
        this.aggroRange = 400;
        break;
      case 'guard':
        this.maxHealth = Math.floor(60 * levelMult);
        this.attackPower = Math.floor(12 * levelMult);
        this.defense = Math.floor(3 * levelMult);
        this.xpValue = 50;
        this.scoreValue = 50;
        this.width = 40;
        this.height = 60;
        this.moveSpeed = 2.5;
        break;
      case 'boss':
        this.maxHealth = Math.floor(150 * (1 + level * 0.5));
        this.attackPower = Math.floor(15 * (1 + level * 0.3));
        this.defense = Math.floor(5 * levelMult);
        this.xpValue = 200;
        this.scoreValue = 500;
        this.width = 60;
        this.height = 80;
        this.moveSpeed = 1.5;
        this.aggroRange = 500;
        this.isBoss = true;
        this.phase = 1;
        this.specialAttackTimer = 180;
        break;
    }
    
    this.health = this.maxHealth;
  }
  
  update(p, player, platforms) {
    if (this.dead) {
      this.deathTimer++;
      this.y += 2;
      return;
    }
    
    this.animTimer++;
    if (this.hitFlash > 0) this.hitFlash--;
    if (this.attackTimer > 0) this.attackTimer--;
    if (this.shootTimer > 0) this.shootTimer--;
    if (this.specialAttackTimer > 0) this.specialAttackTimer--;
    
    const distToPlayer = Math.abs(player.x - this.x);
    const playerInRange = distToPlayer < this.aggroRange;
    
    // AI behavior
    if (this.type === 'archer') {
      this.updateArcherAI(player, distToPlayer, playerInRange);
    } else if (this.type === 'boss') {
      this.updateBossAI(p, player, distToPlayer, playerInRange);
    } else {
      this.updateMeleeAI(player, distToPlayer, playerInRange);
    }
    
    // Apply gravity
    if (!this.onGround) {
      this.vy += this.gravity;
      if (this.vy > this.maxFallSpeed) this.vy = this.maxFallSpeed;
    }
    
    // Update position
    this.x += this.vx;
    this.y += this.vy;
    
    // Check platform collisions
    this.onGround = false;
    for (let platform of platforms) {
      if (this.vy > 0 && this.y + this.height > platform.y && 
          this.y < platform.y + 10 &&
          this.x + this.width > platform.x + 5 && this.x < platform.x + platform.width - 5) {
        this.y = platform.y - this.height;
        this.vy = 0;
        this.onGround = true;
      }
    }
    
    // Don't fall off screen
    if (this.y > CANVAS_HEIGHT + 100) {
      this.health = 0;
      this.dead = true;
    }
  }
  
  updateMeleeAI(player, distToPlayer, playerInRange) {
    if (playerInRange) {
      // Chase player
      if (player.x > this.x + 40) {
        this.vx = this.moveSpeed;
        this.facingRight = true;
        this.state = 'running';
      } else if (player.x < this.x - 40) {
        this.vx = -this.moveSpeed;
        this.facingRight = false;
        this.state = 'running';
      } else {
        this.vx = 0;
        this.state = 'attacking';
      }
    } else {
      // Patrol
      const distFromCenter = this.x - this.patrolCenter;
      if (distFromCenter > this.patrolRange) {
        this.vx = -this.moveSpeed * 0.5;
        this.facingRight = false;
      } else if (distFromCenter < -this.patrolRange) {
        this.vx = this.moveSpeed * 0.5;
        this.facingRight = true;
      } else {
        this.vx = 0;
        this.state = 'idle';
      }
    }
  }
  
  updateArcherAI(player, distToPlayer, playerInRange) {
    if (playerInRange) {
      // Maintain distance
      const idealDist = 250;
      if (distToPlayer < idealDist - 50) {
        // Back away
        this.vx = player.x > this.x ? -this.moveSpeed * 0.7 : this.moveSpeed * 0.7;
        this.facingRight = player.x > this.x;
      } else if (distToPlayer > idealDist + 50) {
        // Get closer
        this.vx = player.x > this.x ? this.moveSpeed * 0.7 : -this.moveSpeed * 0.7;
        this.facingRight = player.x > this.x;
      } else {
        this.vx = 0;
        this.facingRight = player.x > this.x;
      }
      
      this.state = 'attacking';
    } else {
      this.vx = 0;
      this.state = 'idle';
    }
  }
  
  updateBossAI(p, player, distToPlayer, playerInRange) {
    // Phase transitions
    if (this.health < this.maxHealth * 0.5 && this.phase === 1) {
      this.phase = 2;
      this.moveSpeed = 2;
      this.attackCooldown = 40;
    }
    
    if (playerInRange) {
      if (distToPlayer > 100) {
        // Chase
        this.vx = player.x > this.x ? this.moveSpeed : -this.moveSpeed;
        this.facingRight = player.x > this.x;
        this.state = 'running';
      } else {
        this.vx = 0;
        this.state = 'attacking';
        this.facingRight = player.x > this.x;
      }
    } else {
      this.vx = 0;
      this.state = 'idle';
    }
  }
  
  canAttack() {
    return this.attackTimer === 0;
  }
  
  canShoot() {
    return this.shootTimer === 0;
  }
  
  performAttack() {
    this.attackTimer = this.attackCooldown;
    return {
      x: this.facingRight ? this.x + this.width : this.x - 40,
      y: this.y + 10,
      width: 40,
      height: 30,
      damage: this.attackPower,
      owner: 'enemy'
    };
  }
  
  shoot() {
    this.shootTimer = this.shootCooldown;
    return {
      x: this.facingRight ? this.x + this.width : this.x,
      y: this.y + this.height / 2,
      vx: this.facingRight ? 6 : -6,
      vy: 0,
      width: 10,
      height: 10,
      damage: this.attackPower,
      owner: 'enemy',
      type: 'projectile'
    };
  }
  
  takeDamage(amount) {
    const actualDamage = Math.max(1, amount - this.defense);
    this.health -= actualDamage;
    this.hitFlash = 10;
    
    if (this.health <= 0) {
      this.health = 0;
      this.dead = true;
    }
    
    return actualDamage;
  }
  
  draw(p, cameraX) {
    if (this.dead && this.deathTimer > 30) return;
    
    p.push();
    
    const screenX = this.x - cameraX;
    
    // Flash white when hit
    if (this.hitFlash > 0) {
      p.fill(255, 255, 255, 150);
    } else {
      p.fill(40, 40, 50);
    }
    
    // Fade out when dead
    if (this.dead) {
      const alpha = 255 - (this.deathTimer / 30) * 255;
      p.fill(40, 40, 50, alpha);
    }
    
    p.noStroke();
    
    if (this.type === 'boss') {
      this.drawBoss(p, screenX);
    } else if (this.type === 'archer') {
      this.drawArcher(p, screenX);
    } else if (this.type === 'guard') {
      this.drawGuard(p, screenX);
    } else {
      this.drawMinion(p, screenX);
    }
    
    // Health bar
    if (!this.dead && this.health < this.maxHealth) {
      p.fill(0);
      p.rect(screenX, this.y - 10, this.width, 4);
      p.fill(255, 50, 50);
      p.rect(screenX, this.y - 10, this.width * (this.health / this.maxHealth), 4);
    }
    
    p.pop();
  }
  
  drawMinion(p, screenX) {
    // Body
    p.rect(screenX + 8, this.y + 10, 14, 25, 2);
    
    // Head
    p.ellipse(screenX + 15, this.y + 5, 10, 10);
    
    // Arms
    p.rect(screenX + 4, this.y + 15, 6, 15, 2);
    p.rect(screenX + 20, this.y + 15, 6, 15, 2);
    
    // Legs
    p.rect(screenX + 10, this.y + 35, 5, 15, 2);
    p.rect(screenX + 15, this.y + 35, 5, 15, 2);
    
    // Eyes
    p.fill(255, 50, 50);
    p.ellipse(screenX + 13, this.y + 4, 2, 2);
    p.ellipse(screenX + 17, this.y + 4, 2, 2);
  }
  
  drawArcher(p, screenX) {
    this.drawMinion(p, screenX);
    
    // Bow
    p.stroke(80, 60, 40);
    p.strokeWeight(2);
    p.noFill();
    if (this.facingRight) {
      p.arc(screenX + 25, this.y + 20, 15, 20, -Math.PI/2, Math.PI/2);
    } else {
      p.arc(screenX + 5, this.y + 20, 15, 20, Math.PI/2, Math.PI*1.5);
    }
    p.noStroke();
    
    // Green eyes for archer
    p.fill(50, 255, 50);
    p.ellipse(screenX + 13, this.y + 4, 2, 2);
    p.ellipse(screenX + 17, this.y + 4, 2, 2);
  }
  
  drawGuard(p, screenX) {
    // Larger body
    p.rect(screenX + 8, this.y + 10, 24, 35, 3);
    
    // Head
    p.ellipse(screenX + 20, this.y + 5, 15, 15);
    
    // Arms
    p.rect(screenX + 4, this.y + 15, 8, 20, 2);
    p.rect(screenX + 28, this.y + 15, 8, 20, 2);
    
    // Legs
    p.rect(screenX + 12, this.y + 45, 7, 15, 2);
    p.rect(screenX + 21, this.y + 45, 7, 15, 2);
    
    // Purple eyes
    p.fill(200, 50, 200);
    p.ellipse(screenX + 17, this.y + 4, 3, 3);
    p.ellipse(screenX + 23, this.y + 4, 3, 3);
    
    // Armor detail
    p.fill(60, 60, 80);
    p.rect(screenX + 15, this.y + 20, 10, 15, 2);
  }
  
  drawBoss(p, screenX) {
    // Large imposing figure
    p.rect(screenX + 10, this.y + 15, 40, 50, 5);
    
    // Head
    p.ellipse(screenX + 30, this.y + 8, 25, 25);
    
    // Arms
    p.rect(screenX + 2, this.y + 20, 12, 30, 3);
    p.rect(screenX + 46, this.y + 20, 12, 30, 3);
    
    // Legs
    p.rect(screenX + 16, this.y + 65, 12, 15, 3);
    p.rect(screenX + 32, this.y + 65, 12, 15, 3);
    
    // Glowing runes
    p.fill(150, 50, 255, 150 + Math.sin(this.animTimer * 0.1) * 100);
    p.ellipse(screenX + 30, this.y + 30, 8, 8);
    p.ellipse(screenX + 20, this.y + 40, 6, 6);
    p.ellipse(screenX + 40, this.y + 40, 6, 6);
    
    // Eyes
    p.fill(255, 100, 100);
    p.ellipse(screenX + 25, this.y + 6, 4, 4);
    p.ellipse(screenX + 35, this.y + 6, 4, 4);
  }
}