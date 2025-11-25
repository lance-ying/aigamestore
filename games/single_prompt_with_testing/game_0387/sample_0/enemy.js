// enemy.js - Enemy class and AI

import { ARENA_FLOOR_Y, ARENA_LEFT, ARENA_RIGHT, gameState } from './globals.js';

export class Enemy {
  constructor(x, y, isChampion = false) {
    this.x = x;
    this.y = y;
    this.width = 30;
    this.height = 50;
    this.vx = 0;
    this.vy = 0;
    this.health = isChampion ? 80 : 50;
    this.maxHealth = this.health;
    this.isGrounded = false;
    this.facingRight = true;
    this.isAttacking = false;
    this.attackCooldown = 0;
    this.attackFrame = 0;
    this.hitboxActive = false;
    this.aiTimer = 0;
    this.aiState = "IDLE";
    this.targetDistance = 0;
    this.isChampion = isChampion;
    this.invulnerable = 0;
    this.isDead = false;
    
    // Weapon
    this.weaponAngle = 0;
    this.weaponLength = 35;
    this.weaponExtension = 0;
  }

  update(p) {
    if (this.isDead) return;

    // Apply gravity
    if (this.y < ARENA_FLOOR_Y) {
      this.vy += 0.6;
    } else {
      this.y = ARENA_FLOOR_Y;
      this.vy = 0;
      this.isGrounded = true;
    }

    // Apply velocity
    this.x += this.vx;
    this.y += this.vy;

    // Boundary checking
    if (this.x < ARENA_LEFT) {
      this.x = ARENA_LEFT;
      this.vx = 0;
    }
    if (this.x > ARENA_RIGHT - this.width) {
      this.x = ARENA_RIGHT - this.width;
      this.vx = 0;
    }

    // Friction
    if (this.isGrounded) {
      this.vx *= 0.85;
    }

    // Update attack animation
    if (this.isAttacking) {
      this.attackFrame++;
      this.weaponExtension = Math.sin((this.attackFrame / 10) * Math.PI) * 15;
      
      if (this.attackFrame >= 5 && this.attackFrame <= 8) {
        this.hitboxActive = true;
      } else {
        this.hitboxActive = false;
      }

      if (this.attackFrame >= 15) {
        this.isAttacking = false;
        this.attackFrame = 0;
        this.weaponExtension = 0;
        this.hitboxActive = false;
      }
    }

    // Update cooldowns
    if (this.attackCooldown > 0) this.attackCooldown--;
    if (this.invulnerable > 0) this.invulnerable--;

    // Update weapon angle
    if (!this.isAttacking) {
      this.weaponAngle = this.facingRight ? -45 : -135;
    }

    // AI behavior
    this.updateAI(p);
  }

  updateAI(p) {
    if (!gameState.player || this.isDead) return;

    this.aiTimer++;
    const player = gameState.player;
    
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    this.targetDistance = Math.sqrt(dx * dx + dy * dy);

    // Face player
    this.facingRight = dx > 0;

    // AI decision making
    if (this.aiTimer % 30 === 0) {
      if (this.targetDistance < 60 && this.attackCooldown === 0) {
        this.aiState = "ATTACK";
      } else if (this.targetDistance > 150) {
        this.aiState = "APPROACH";
      } else if (this.targetDistance > 80) {
        this.aiState = "APPROACH";
      } else {
        this.aiState = p.random() < 0.3 ? "RETREAT" : "CIRCLE";
      }
    }

    // Execute AI state
    switch (this.aiState) {
      case "APPROACH":
        this.vx = this.facingRight ? 3 : -3;
        break;
      case "RETREAT":
        this.vx = this.facingRight ? -2 : 2;
        break;
      case "CIRCLE":
        this.vx = p.random() < 0.5 ? 2 : -2;
        if (this.isGrounded && p.random() < 0.02) {
          this.vy = -10;
          this.isGrounded = false;
        }
        break;
      case "ATTACK":
        this.attack();
        break;
      case "IDLE":
        this.vx *= 0.9;
        break;
    }

    // Champion has enhanced abilities
    if (this.isChampion) {
      if (this.targetDistance < 100 && this.isGrounded && p.random() < 0.01) {
        this.vy = -10;
        this.isGrounded = false;
      }
    }
  }

  attack() {
    if (this.attackCooldown === 0 && !this.isAttacking) {
      this.isAttacking = true;
      this.attackFrame = 0;
      this.attackCooldown = this.isChampion ? 25 : 40;
      this.weaponAngle = this.facingRight ? 45 : 135;
    }
  }

  takeDamage(amount) {
    if (this.invulnerable > 0 || this.isDead) return 0;
    
    this.health -= amount;
    this.invulnerable = 20;
    
    if (this.health <= 0) {
      this.health = 0;
      this.isDead = true;
      return amount;
    }

    return amount;
  }

  getAttackHitbox() {
    if (!this.hitboxActive || this.isDead) return null;

    const weaponTipX = this.x + this.width / 2 + Math.cos(this.weaponAngle * Math.PI / 180) * (this.weaponLength + this.weaponExtension);
    const weaponTipY = this.y + this.height / 2 + Math.sin(this.weaponAngle * Math.PI / 180) * (this.weaponLength + this.weaponExtension);

    return {
      x: weaponTipX,
      y: weaponTipY,
      radius: 20
    };
  }

  render(p) {
    if (this.isDead) return;

    p.push();

    // Invulnerability flash
    if (this.invulnerable > 0 && this.invulnerable % 6 < 3) {
      p.pop();
      return;
    }

    // Champion glow
    if (this.isChampion) {
      p.fill(255, 215, 0, 30);
      p.noStroke();
      p.ellipse(this.x + this.width / 2, this.y + this.height / 2, 80, 80);
    }

    // Body
    const bodyColor = this.isChampion ? [180, 140, 100] : [160, 120, 80];
    p.fill(...bodyColor);
    p.rect(this.x, this.y, this.width, this.height);

    // Head
    const headColor = this.isChampion ? [200, 160, 120] : [180, 140, 100];
    p.fill(...headColor);
    p.ellipse(this.x + this.width / 2, this.y - 10, 25, 25);

    // Helmet
    const helmetColor = this.isChampion ? [200, 180, 50] : [120, 120, 120];
    p.fill(...helmetColor);
    p.arc(this.x + this.width / 2, this.y - 10, 28, 28, Math.PI, 0);

    // Weapon
    p.push();
    const weaponColor = this.isChampion ? [220, 200, 80] : [150, 150, 150];
    p.stroke(...weaponColor);
    p.strokeWeight(3);
    const weaponBaseX = this.x + this.width / 2;
    const weaponBaseY = this.y + this.height / 2;
    const weaponTipX = weaponBaseX + Math.cos(this.weaponAngle * Math.PI / 180) * (this.weaponLength + this.weaponExtension);
    const weaponTipY = weaponBaseY + Math.sin(this.weaponAngle * Math.PI / 180) * (this.weaponLength + this.weaponExtension);
    p.line(weaponBaseX, weaponBaseY, weaponTipX, weaponTipY);
    
    p.strokeWeight(1);
    p.fill(...weaponColor);
    p.circle(weaponTipX, weaponTipY, 6);
    p.pop();

    // Armor markings
    p.stroke(0);
    p.strokeWeight(1);
    p.line(this.x + 10, this.y + 20, this.x + 20, this.y + 20);
    p.line(this.x + 10, this.y + 30, this.x + 20, this.y + 30);

    // Health bar
    p.noStroke();
    p.fill(100, 0, 0);
    p.rect(this.x, this.y - 20, this.width, 4);
    p.fill(0, 200, 0);
    p.rect(this.x, this.y - 20, this.width * (this.health / this.maxHealth), 4);

    p.pop();
  }
}

export function spawnEnemy(x, y, isChampion = false) {
  const enemy = new Enemy(x, y, isChampion);
  gameState.enemies.push(enemy);
  gameState.entities.push(enemy);
  return enemy;
}