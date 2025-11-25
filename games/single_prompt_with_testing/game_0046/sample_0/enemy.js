// enemy.js
import { GRAVITY, GROUND_Y, gameState } from './globals.js';

export class Enemy {
  constructor(p, x, y, type = 'soldier') {
    this.p = p;
    this.x = x;
    this.y = y;
    this.type = type;
    this.width = 28;
    this.height = 32;
    this.vx = 0;
    this.vy = 0;
    this.health = type === 'elite' ? 50 : 30;
    this.maxHealth = this.health;
    this.speed = type === 'elite' ? 1.5 : 1;
    this.facing = -1;
    this.grounded = false;
    this.attackCooldown = 0;
    this.attackDuration = 0;
    this.attackRange = 40;
    this.aggroRange = 200;
    this.dead = false;
    this.animFrame = 0;
    this.animTimer = 0;
    this.active = false;
  }
  
  update() {
    if (this.dead) return;
    
    // Activate when on screen
    if (!this.active && gameState.player) {
      const distToPlayer = Math.abs(this.x - gameState.player.x);
      if (distToPlayer < 700) {
        this.active = true;
      }
    }
    
    if (!this.active) return;
    
    // Cooldowns
    if (this.attackCooldown > 0) this.attackCooldown--;
    if (this.attackDuration > 0) this.attackDuration--;
    
    // AI
    if (gameState.player) {
      const distToPlayer = Math.abs(this.x - gameState.player.x);
      const dirToPlayer = gameState.player.x > this.x ? 1 : -1;
      
      if (distToPlayer < this.attackRange && this.grounded) {
        // Attack
        this.vx = 0;
        this.facing = dirToPlayer;
        if (this.attackCooldown <= 0) {
          this.attackCooldown = 60;
          this.attackDuration = 15;
        }
      } else if (distToPlayer < this.aggroRange) {
        // Chase
        this.vx = this.speed * dirToPlayer;
        this.facing = dirToPlayer;
      } else {
        // Idle
        this.vx *= 0.9;
      }
    }
    
    // Gravity
    if (!this.grounded) {
      this.vy += GRAVITY;
    }
    
    // Apply velocity
    this.x += this.vx;
    this.y += this.vy;
    
    // Ground collision
    if (this.y + this.height >= GROUND_Y) {
      this.y = GROUND_Y - this.height;
      this.vy = 0;
      this.grounded = true;
    } else {
      this.grounded = false;
    }
    
    // Animation
    this.animTimer++;
    if (this.animTimer > 10) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % 4;
    }
  }
  
  getAttackHitbox() {
    if (this.attackDuration > 5 && this.attackDuration < 12) {
      return {
        x: this.x + (this.facing > 0 ? this.width : -30),
        y: this.y + this.height / 2 - 10,
        width: 30,
        height: 20,
        damage: this.type === 'elite' ? 15 : 10
      };
    }
    return null;
  }
  
  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.dead = true;
      return true;
    }
    return false;
  }
  
  draw(p, cameraX) {
    if (this.dead) return;
    
    const screenX = this.x - cameraX;
    
    p.push();
    
    // Soldier body
    const isElite = this.type === 'elite';
    p.fill(...(isElite ? [120, 80, 80] : [80, 80, 100]));
    p.noStroke();
    
    // Torso
    p.rect(screenX + 6, this.y + 12, 16, 14);
    
    // Legs
    const legOffset = this.grounded ? this.p.sin(this.animFrame) * 2 : 0;
    p.rect(screenX + 8, this.y + 26, 5, 6 + legOffset);
    p.rect(screenX + 15, this.y + 26, 5, 6 - legOffset);
    
    // Arms
    if (this.attackDuration > 0) {
      p.rect(screenX + (this.facing > 0 ? 22 : -8), this.y + 14, 8, 4);
      // Weapon
      p.fill(150, 150, 150);
      p.rect(screenX + (this.facing > 0 ? 30 : -18), this.y + 12, 4, 12);
    } else {
      p.rect(screenX + 4, this.y + 14, 4, 10);
      p.rect(screenX + 20, this.y + 14, 4, 10);
    }
    
    // Head
    p.fill(...(isElite ? [150, 120, 100] : [180, 160, 140]));
    p.ellipse(screenX + 14, this.y + 8, 14, 14);
    
    // Helmet
    p.fill(...(isElite ? [150, 120, 50] : [120, 120, 130]));
    p.arc(screenX + 14, this.y + 6, 16, 12, this.p.PI, this.p.TWO_PI);
    
    // Eyes
    p.fill(50, 50, 50);
    p.circle(screenX + 11, this.y + 8, 3);
    p.circle(screenX + 17, this.y + 8, 3);
    
    // Health bar
    if (this.health < this.maxHealth) {
      p.fill(200, 50, 50);
      p.rect(screenX, this.y - 8, this.width, 4);
      p.fill(50, 200, 50);
      p.rect(screenX, this.y - 8, this.width * (this.health / this.maxHealth), 4);
    }
    
    p.pop();
  }
}

export class Boss {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = 80;
    this.height = 100;
    this.vx = 0;
    this.vy = 0;
    this.health = 300;
    this.maxHealth = 300;
    this.speed = 2;
    this.facing = -1;
    this.grounded = false;
    this.attackCooldown = 0;
    this.attackDuration = 0;
    this.attackType = 0;
    this.dead = false;
    this.animFrame = 0;
    this.animTimer = 0;
    this.phase = 1; // 1 or 2
    this.specialCooldown = 0;
  }
  
  update() {
    if (this.dead) return;
    
    // Phase change
    if (this.health < this.maxHealth / 2) {
      this.phase = 2;
      this.speed = 3;
    }
    
    // Cooldowns
    if (this.attackCooldown > 0) this.attackCooldown--;
    if (this.attackDuration > 0) this.attackDuration--;
    if (this.specialCooldown > 0) this.specialCooldown--;
    
    // AI
    if (gameState.player) {
      const distToPlayer = Math.abs(this.x - gameState.player.x);
      const dirToPlayer = gameState.player.x > this.x ? 1 : -1;
      this.facing = dirToPlayer;
      
      if (this.attackCooldown <= 0) {
        // Choose attack
        if (this.specialCooldown <= 0 && this.phase === 2 && this.p.random() < 0.3) {
          this.attackType = 2; // Special
          this.attackCooldown = 90;
          this.attackDuration = 30;
          this.specialCooldown = 180;
        } else if (distToPlayer < 100) {
          this.attackType = 0; // Melee
          this.attackCooldown = 45;
          this.attackDuration = 20;
        } else {
          this.attackType = 1; // Ranged
          this.attackCooldown = 60;
          this.attackDuration = 15;
        }
      }
      
      // Movement
      if (this.attackDuration <= 0) {
        if (distToPlayer > 80 && distToPlayer < 300) {
          this.vx = this.speed * dirToPlayer;
        } else {
          this.vx *= 0.9;
        }
      } else {
        this.vx = 0;
      }
    }
    
    // Gravity
    if (!this.grounded) {
      this.vy += GRAVITY;
    }
    
    // Apply velocity
    this.x += this.vx;
    this.y += this.vy;
    
    // Ground collision
    if (this.y + this.height >= GROUND_Y) {
      this.y = GROUND_Y - this.height;
      this.vy = 0;
      this.grounded = true;
    } else {
      this.grounded = false;
    }
    
    // Animation
    this.animTimer++;
    if (this.animTimer > 8) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % 4;
    }
  }
  
  getAttackData() {
    if (this.attackDuration === 15 && this.attackType === 0) {
      // Melee attack
      return {
        type: 'melee',
        x: this.x + (this.facing > 0 ? this.width : -50),
        y: this.y + this.height / 2 - 20,
        width: 50,
        height: 40,
        damage: 20
      };
    } else if (this.attackDuration === 12 && this.attackType === 1) {
      // Projectile attack
      return {
        type: 'projectile',
        x: this.x + this.width / 2,
        y: this.y + this.height / 2,
        vx: this.facing * 6,
        vy: 0
      };
    } else if (this.attackDuration > 10 && this.attackDuration < 25 && this.attackType === 2) {
      // Ground slam AOE
      return {
        type: 'aoe',
        x: this.x - 100,
        y: GROUND_Y - 30,
        width: this.width + 200,
        height: 30,
        damage: 25
      };
    }
    return null;
  }
  
  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.dead = true;
      return true;
    }
    return false;
  }
  
  draw(p, cameraX) {
    if (this.dead) return;
    
    const screenX = this.x - cameraX;
    
    p.push();
    
    // Boss body - corrupted knight
    const isPhase2 = this.phase === 2;
    
    // Legs
    p.fill(...(isPhase2 ? [80, 40, 80] : [60, 60, 80]));
    p.noStroke();
    p.rect(screenX + 20, this.y + 60, 15, 40);
    p.rect(screenX + 45, this.y + 60, 15, 40);
    
    // Torso
    p.rect(screenX + 15, this.y + 30, 50, 40);
    
    // Arms
    if (this.attackDuration > 0) {
      p.rect(screenX + (this.facing > 0 ? 65 : -25), this.y + 35, 15, 30);
      // Weapon
      p.fill(100, 100, 120);
      p.rect(screenX + (this.facing > 0 ? 80 : -40), this.y + 30, 8, 40);
    } else {
      p.rect(screenX + 5, this.y + 35, 12, 30);
      p.rect(screenX + 63, this.y + 35, 12, 30);
    }
    
    // Head
    p.fill(...(isPhase2 ? [100, 60, 100] : [80, 80, 100]));
    p.ellipse(screenX + 40, this.y + 20, 35, 35);
    
    // Helmet/Crown
    p.fill(...(isPhase2 ? [120, 80, 50] : [150, 120, 50]));
    p.rect(screenX + 20, this.y + 8, 40, 8);
    p.triangle(screenX + 30, this.y + 8, screenX + 35, this.y - 5, screenX + 40, this.y + 8);
    p.triangle(screenX + 40, this.y + 8, screenX + 45, this.y - 5, screenX + 50, this.y + 8);
    
    // Eyes - glowing
    p.fill(...(isPhase2 ? [255, 50, 255] : [255, 100, 100]));
    p.circle(screenX + 32, this.y + 20, 8);
    p.circle(screenX + 48, this.y + 20, 8);
    
    // Dark Quartz corruption effect
    if (isPhase2) {
      p.fill(100, 50, 150, 100);
      for (let i = 0; i < 3; i++) {
        const offset = this.p.sin(this.animFrame + i) * 5;
        p.circle(screenX + 40 + offset, this.y + 50 + offset, 10);
      }
    }
    
    // Health bar
    p.fill(50, 50, 50);
    p.rect(screenX - 10, this.y - 20, 100, 8);
    p.fill(...(isPhase2 ? [200, 50, 200] : [200, 50, 50]));
    p.rect(screenX - 10, this.y - 20, 100 * (this.health / this.maxHealth), 8);
    p.fill(255);
    p.textSize(10);
    p.textAlign(p.CENTER);
    p.text(`${Math.ceil(this.health)}/${this.maxHealth}`, screenX + 40, this.y - 13);
    
    p.pop();
  }
}