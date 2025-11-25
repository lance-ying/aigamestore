// player.js - Player class and related functions

import { ARENA_FLOOR_Y, ARENA_LEFT, ARENA_RIGHT, gameState } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 30;
    this.height = 50;
    this.vx = 0;
    this.vy = 0;
    this.health = 100;
    this.maxHealth = 100;
    this.isGrounded = false;
    this.facingRight = true;
    this.isAttacking = false;
    this.attackCooldown = 0;
    this.isBlocking = false;
    this.isSprinting = false;
    this.attackFrame = 0;
    this.hitboxActive = false;
    this.invulnerable = 0;
    this.momentum = 0;
    
    // Sword properties
    this.swordAngle = 0;
    this.swordLength = 35;
    this.swordExtension = 0;
  }

  update(p) {
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

    // Apply friction
    if (this.isGrounded && !this.isSprinting) {
      this.vx *= 0.85;
    }

    // Update momentum (used for damage calculation)
    this.momentum = Math.abs(this.vx);

    // Update attack animation
    if (this.isAttacking) {
      this.attackFrame++;
      this.swordExtension = Math.sin((this.attackFrame / 10) * Math.PI) * 15;
      
      if (this.attackFrame >= 5 && this.attackFrame <= 8) {
        this.hitboxActive = true;
      } else {
        this.hitboxActive = false;
      }

      if (this.attackFrame >= 15) {
        this.isAttacking = false;
        this.attackFrame = 0;
        this.swordExtension = 0;
        this.hitboxActive = false;
      }
    }

    // Update cooldowns
    if (this.attackCooldown > 0) this.attackCooldown--;
    if (this.invulnerable > 0) this.invulnerable--;

    // Update sword angle based on facing direction
    if (!this.isAttacking) {
      this.swordAngle = this.facingRight ? -45 : -135;
    }
  }

  moveLeft(isSprinting = false) {
    this.facingRight = false;
    const speed = isSprinting ? -6 : -4;
    this.vx = speed;
    this.isSprinting = isSprinting;
  }

  moveRight(isSprinting = false) {
    this.facingRight = true;
    const speed = isSprinting ? 6 : 4;
    this.vx = speed;
    this.isSprinting = isSprinting;
  }

  jump() {
    if (this.isGrounded) {
      this.vy = -12;
      this.isGrounded = false;
    }
  }

  attack() {
    if (this.attackCooldown === 0 && !this.isAttacking && !this.isBlocking) {
      this.isAttacking = true;
      this.attackFrame = 0;
      this.attackCooldown = 20;
      this.swordAngle = this.facingRight ? 45 : 135;
    }
  }

  startBlock() {
    if (!this.isAttacking) {
      this.isBlocking = true;
      this.vx *= 0.5; // Slow down when blocking
    }
  }

  stopBlock() {
    this.isBlocking = false;
  }

  takeDamage(amount) {
    if (this.invulnerable > 0) return;
    
    const actualDamage = this.isBlocking ? amount * 0.25 : amount;
    this.health -= actualDamage;
    this.invulnerable = 30;
    
    if (this.health <= 0) {
      this.health = 0;
    }

    return actualDamage;
  }

  getAttackHitbox() {
    if (!this.hitboxActive) return null;

    const swordTipX = this.x + this.width / 2 + Math.cos(this.swordAngle * Math.PI / 180) * (this.swordLength + this.swordExtension);
    const swordTipY = this.y + this.height / 2 + Math.sin(this.swordAngle * Math.PI / 180) * (this.swordLength + this.swordExtension);

    return {
      x: swordTipX,
      y: swordTipY,
      radius: 20
    };
  }

  getDamage() {
    const baseDamage = 15;
    const momentumBonus = this.momentum * 2;
    return baseDamage + momentumBonus;
  }

  render(p) {
    p.push();

    // Invulnerability flash
    if (this.invulnerable > 0 && this.invulnerable % 6 < 3) {
      p.pop();
      return;
    }

    // Body
    p.fill(200, 150, 100);
    p.rect(this.x, this.y, this.width, this.height);

    // Head
    p.fill(220, 180, 140);
    p.ellipse(this.x + this.width / 2, this.y - 10, 25, 25);

    // Helmet
    p.fill(150, 150, 150);
    p.arc(this.x + this.width / 2, this.y - 10, 28, 28, Math.PI, 0);

    // Shield (when blocking)
    if (this.isBlocking) {
      p.push();
      p.fill(100, 100, 150);
      p.stroke(80, 80, 120);
      p.strokeWeight(2);
      const shieldX = this.facingRight ? this.x + this.width : this.x;
      p.ellipse(shieldX, this.y + this.height / 2, 25, 40);
      p.pop();
    }

    // Sword
    p.push();
    p.stroke(180, 180, 180);
    p.strokeWeight(3);
    const swordBaseX = this.x + this.width / 2;
    const swordBaseY = this.y + this.height / 2;
    const swordTipX = swordBaseX + Math.cos(this.swordAngle * Math.PI / 180) * (this.swordLength + this.swordExtension);
    const swordTipY = swordBaseY + Math.sin(this.swordAngle * Math.PI / 180) * (this.swordLength + this.swordExtension);
    p.line(swordBaseX, swordBaseY, swordTipX, swordTipY);
    
    // Sword tip
    p.strokeWeight(1);
    p.fill(200, 200, 200);
    p.circle(swordTipX, swordTipY, 6);
    p.pop();

    // Cape
    p.fill(150, 30, 30);
    const capeX = this.facingRight ? this.x - 5 : this.x + this.width + 5;
    p.rect(capeX, this.y + 10, 8, 30);

    p.pop();
  }
}

export function createPlayer(x, y) {
  const player = new Player(x, y);
  gameState.player = player;
  gameState.entities.push(player);
  return player;
}