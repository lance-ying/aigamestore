// player.js
import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 40;
    this.height = 60;
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
    this.facingRight = true;
    this.state = 'idle'; // idle, running, jumping, attacking, dodging, casting
    this.animFrame = 0;
    this.animTimer = 0;
    
    // Stats
    this.health = 100;
    this.maxHealth = 100;
    this.mana = 50;
    this.maxMana = 50;
    this.level = 1;
    this.xp = 0;
    this.xpThreshold = 100;
    this.attackPower = 10;
    this.defense = 2;
    
    // Combat
    this.invulnerable = false;
    this.invulnerableTimer = 0;
    this.attackTimer = 0;
    this.attackCooldown = 20; // frames
    this.dodgeTimer = 0;
    this.dodgeCooldown = 60;
    this.skill1Cooldown = 0;
    this.skill1MaxCooldown = 180; // 3 seconds at 60fps
    this.skill2Cooldown = 0;
    this.skill2MaxCooldown = 300; // 5 seconds
    this.skill2Unlocked = false;
    
    // Movement
    this.moveSpeed = 4;
    this.jumpForce = -12;
    this.gravity = 0.6;
    this.maxFallSpeed = 15;
    
    // Hitbox for attacks
    this.attackHitbox = null;
  }
  
  update(p, keys, platforms, enemies) {
    this.animTimer++;
    
    // Handle state timers
    if (this.attackTimer > 0) {
      this.attackTimer--;
      if (this.attackTimer === 0) {
        this.state = 'idle';
        this.attackHitbox = null;
      }
    }
    
    if (this.dodgeTimer > 0) {
      this.dodgeTimer--;
      if (this.dodgeTimer === 0) {
        this.state = 'idle';
      }
    }
    
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer--;
      if (this.invulnerableTimer === 0) {
        this.invulnerable = false;
      }
    }
    
    if (this.skill1Cooldown > 0) this.skill1Cooldown--;
    if (this.skill2Cooldown > 0) this.skill2Cooldown--;
    
    // Mana regeneration
    if (this.mana < this.maxMana && p.frameCount % 30 === 0) {
      this.mana = Math.min(this.maxMana, this.mana + 1);
    }
    
    // Handle movement (if not in special state)
    if (this.state !== 'attacking' && this.state !== 'dodging' && this.state !== 'casting') {
      this.vx = 0;
      
      if (keys.left) {
        this.vx = -this.moveSpeed;
        this.facingRight = false;
        this.state = 'running';
      } else if (keys.right) {
        this.vx = this.moveSpeed;
        this.facingRight = true;
        this.state = 'running';
      } else if (this.onGround) {
        this.state = 'idle';
      }
      
      // Jump
      if (keys.up && this.onGround) {
        this.vy = this.jumpForce;
        this.onGround = false;
        this.state = 'jumping';
      }
    }
    
    // Apply gravity
    if (!this.onGround) {
      this.vy += this.gravity;
      if (this.vy > this.maxFallSpeed) this.vy = this.maxFallSpeed;
      if (this.state !== 'attacking' && this.state !== 'dodging') {
        this.state = 'jumping';
      }
    }
    
    // Update position
    this.x += this.vx;
    this.y += this.vy;
    
    // Check platform collisions
    this.onGround = false;
    for (let platform of platforms) {
      if (this.vx > 0 && this.x + this.width > platform.x && 
          this.x < platform.x + platform.width &&
          this.y + this.height > platform.y && this.y < platform.y + platform.height) {
        this.x = platform.x - this.width;
        this.vx = 0;
      }
      if (this.vx < 0 && this.x < platform.x + platform.width && 
          this.x + this.width > platform.x &&
          this.y + this.height > platform.y && this.y < platform.y + platform.height) {
        this.x = platform.x + platform.width;
        this.vx = 0;
      }
      
      if (this.vy > 0 && this.y + this.height > platform.y && 
          this.y < platform.y + 10 &&
          this.x + this.width > platform.x + 5 && this.x < platform.x + platform.width - 5) {
        this.y = platform.y - this.height;
        this.vy = 0;
        this.onGround = true;
      }
    }
    
    // World boundaries
    if (this.x < 0) this.x = 0;
    if (this.x > gameState.levelWidth - this.width) {
      this.x = gameState.levelWidth - this.width;
    }
    if (this.y > CANVAS_HEIGHT + 100) {
      this.takeDamage(this.health); // Fall death
    }
    
    // Update attack hitbox position
    if (this.attackHitbox) {
      this.attackHitbox.x = this.facingRight ? this.x + this.width : this.x - 50;
      this.attackHitbox.y = this.y + 10;
    }
  }
  
  attack(p) {
    if (this.attackTimer > 0 || this.dodgeTimer > 0) return;
    
    this.state = 'attacking';
    this.attackTimer = this.attackCooldown;
    this.animFrame = 0;
    
    // Create attack hitbox
    this.attackHitbox = {
      x: this.facingRight ? this.x + this.width : this.x - 50,
      y: this.y + 10,
      width: 50,
      height: 40,
      damage: this.attackPower,
      owner: 'player'
    };
    
    return this.attackHitbox;
  }
  
  dodge(p) {
    if (this.dodgeTimer > 0 || this.attackTimer > 0) return;
    
    this.state = 'dodging';
    this.dodgeTimer = this.dodgeCooldown;
    this.invulnerable = true;
    this.invulnerableTimer = 20; // Brief invulnerability
    
    // Quick dash
    const dashDistance = 80;
    this.x += this.facingRight ? dashDistance : -dashDistance;
  }
  
  useSkill1(p) {
    if (this.skill1Cooldown > 0 || this.mana < 20) return null;
    
    this.skill1Cooldown = this.skill1MaxCooldown;
    this.mana -= 20;
    this.state = 'casting';
    this.attackTimer = 15;
    
    // Create AoE attack
    return {
      x: this.facingRight ? this.x + this.width : this.x - 100,
      y: this.y,
      width: 100,
      height: 80,
      damage: this.attackPower * 2,
      duration: 15,
      owner: 'player',
      type: 'aoe'
    };
  }
  
  useSkill2(p) {
    if (!this.skill2Unlocked || this.skill2Cooldown > 0 || this.mana < 30) return null;
    
    this.skill2Cooldown = this.skill2MaxCooldown;
    this.mana -= 30;
    this.state = 'casting';
    this.attackTimer = 10;
    
    // Create projectile
    return {
      x: this.facingRight ? this.x + this.width : this.x,
      y: this.y + 20,
      vx: this.facingRight ? 10 : -10,
      vy: 0,
      width: 20,
      height: 20,
      damage: this.attackPower * 1.5,
      owner: 'player',
      type: 'projectile'
    };
  }
  
  takeDamage(amount) {
    if (this.invulnerable) return;
    
    const actualDamage = Math.max(1, amount - this.defense);
    this.health -= actualDamage;
    this.invulnerable = true;
    this.invulnerableTimer = 30;
    
    if (this.health <= 0) {
      this.health = 0;
    }
    
    return actualDamage;
  }
  
  gainXP(amount) {
    this.xp += amount;
    if (this.xp >= this.xpThreshold) {
      this.levelUp();
    }
  }
  
  levelUp() {
    this.level++;
    this.xp = this.xp - this.xpThreshold;
    this.xpThreshold = Math.floor(this.xpThreshold * 1.5);
    
    // Increase stats
    this.maxHealth += 20;
    this.health = this.maxHealth;
    this.maxMana += 10;
    this.mana = this.maxMana;
    this.attackPower += 3;
    this.defense += 1;
    
    // Unlock skill 2 at level 2
    if (this.level === 2) {
      this.skill2Unlocked = true;
    }
  }
  
  collect(item) {
    if (item.type === 'gold') {
      gameState.score += 1;
    } else if (item.type === 'health') {
      this.health = Math.min(this.maxHealth, this.health + 30);
    } else if (item.type === 'mana') {
      this.mana = Math.min(this.maxMana, this.mana + 20);
    }
  }
  
  draw(p, cameraX) {
    p.push();
    
    // Flash when invulnerable
    if (this.invulnerable && Math.floor(p.frameCount / 5) % 2 === 0) {
      p.tint(255, 150);
    }
    
    // Draw shadow (player silhouette)
    p.fill(20, 20, 40);
    p.noStroke();
    
    const screenX = this.x - cameraX;
    
    // Body
    p.rect(screenX + 10, this.y + 10, 20, 35, 3);
    
    // Head
    p.ellipse(screenX + 20, this.y + 5, 15, 15);
    
    // Arms
    const armOffset = Math.sin(this.animTimer * 0.15) * 3;
    p.rect(screenX + 5, this.y + 15 + armOffset, 8, 20, 2);
    p.rect(screenX + 27, this.y + 15 - armOffset, 8, 20, 2);
    
    // Legs
    const legOffset = Math.sin(this.animTimer * 0.2) * 5;
    if (this.state === 'running') {
      p.rect(screenX + 12, this.y + 45, 6, 15, 2);
      p.rect(screenX + 22, this.y + 45, 6, 15, 2);
    } else {
      p.rect(screenX + 12, this.y + 45, 7, 15, 2);
      p.rect(screenX + 21, this.y + 45, 7, 15, 2);
    }
    
    // Weapon (katana)
    p.stroke(100, 100, 120);
    p.strokeWeight(2);
    if (this.state === 'attacking') {
      const angle = this.facingRight ? -0.5 : 0.5;
      p.line(
        screenX + 20, this.y + 20,
        screenX + 20 + Math.cos(angle) * 30,
        this.y + 20 + Math.sin(angle) * 30
      );
    } else {
      p.line(
        screenX + (this.facingRight ? 30 : 10),
        this.y + 25,
        screenX + (this.facingRight ? 30 : 10),
        this.y + 35
      );
    }
    
    // Eyes (glowing)
    p.noStroke();
    p.fill(100, 200, 255);
    const eyeY = this.y + 4;
    if (this.facingRight) {
      p.ellipse(screenX + 23, eyeY, 3, 3);
    } else {
      p.ellipse(screenX + 17, eyeY, 3, 3);
    }
    
    p.pop();
    
    // Draw attack hitbox (debug)
    if (this.attackHitbox && false) {
      p.push();
      p.fill(255, 0, 0, 50);
      p.rect(this.attackHitbox.x - cameraX, this.attackHitbox.y, 
             this.attackHitbox.width, this.attackHitbox.height);
      p.pop();
    }
  }
}