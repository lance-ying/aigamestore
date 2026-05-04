import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GRAVITY, JUMP_VELOCITY, MOVE_SPEED, ATTACK_DURATION, DAMAGE_FLASH_DURATION } from './globals.js';

export class Player {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = 30;
    this.height = 50;
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
    this.maxHP = 10;
    this.hp = this.maxHP;
    this.attackDamage = 10;
    this.isAttacking = false;
    this.attackTimer = 0;
    this.damageFlashTimer = 0;
    this.facing = 1; // 1 = right, -1 = left
    this.invulnerableTimer = 0;
    this.attackBoostTimer = 0;
    this.attackBoostAmount = 0;
  }

  update(keys, platforms) {
    // Handle movement
    this.vx = 0;
    if ((keys[37] || keys[65]) && !this.isAttacking) { // Left
      this.vx = -MOVE_SPEED;
      this.facing = -1;
    }
    if ((keys[39] || keys[68]) && !this.isAttacking) { // Right
      this.vx = MOVE_SPEED;
      this.facing = 1;
    }

    // Jump
    if ((keys[38] || keys[87] || keys[32]) && this.onGround && !this.isAttacking) {
      this.vy = JUMP_VELOCITY;
      this.onGround = false;
    }

    // Attack
    if ((keys[90] || keys[16]) && !this.isAttacking && this.attackTimer === 0) {
      this.isAttacking = true;
      this.attackTimer = ATTACK_DURATION;
    }

    // Update attack timer
    if (this.attackTimer > 0) {
      this.attackTimer--;
      if (this.attackTimer === 0) {
        this.isAttacking = false;
      }
    }

    // Update damage flash
    if (this.damageFlashTimer > 0) {
      this.damageFlashTimer--;
    }

    // Update invulnerability
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer--;
    }

    // Update attack boost
    if (this.attackBoostTimer > 0) {
      this.attackBoostTimer--;
      if (this.attackBoostTimer === 0) {
        this.attackBoostAmount = 0;
      }
    }

    // Apply gravity
    this.vy += GRAVITY;

    // Apply velocity
    this.x += this.vx;
    this.y += this.vy;

    // Ground collision
    this.onGround = false;
    for (let platform of platforms) {
      if (this.p.collideRectRect(this.x, this.y, this.width, this.height, 
                                   platform.x, platform.y, platform.width, platform.height)) {
        // Determine collision side
        const overlapLeft = (this.x + this.width) - platform.x;
        const overlapRight = (platform.x + platform.width) - this.x;
        const overlapTop = (this.y + this.height) - platform.y;
        const overlapBottom = (platform.y + platform.height) - this.y;

        const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

        if (minOverlap === overlapTop && this.vy > 0) {
          this.y = platform.y - this.height;
          this.vy = 0;
          this.onGround = true;
        } else if (minOverlap === overlapBottom && this.vy < 0) {
          this.y = platform.y + platform.height;
          this.vy = 0;
        } else if (minOverlap === overlapLeft && this.vx > 0) {
          this.x = platform.x - this.width;
        } else if (minOverlap === overlapRight && this.vx < 0) {
          this.x = platform.x + platform.width;
        }
      }
    }

    // Canvas boundaries
    if (this.x < 0) this.x = 0;
    if (this.x + this.width > CANVAS_WIDTH) this.x = CANVAS_WIDTH - this.width;
    if (this.y > CANVAS_HEIGHT) {
      this.takeDamage(this.hp); // Fall death
    }
  }

  takeDamage(amount) {
    if (this.invulnerableTimer > 0) return;
    
    this.hp -= amount;
    this.damageFlashTimer = DAMAGE_FLASH_DURATION;
    this.invulnerableTimer = 60; // 1 second invulnerability
    
    if (this.hp <= 0) {
      this.hp = 0;
    }
  }

  heal(amount) {
    this.hp = Math.min(this.hp + amount, this.maxHP);
  }

  applyAttackBoost(amount, duration) {
    this.attackBoostAmount = amount;
    this.attackBoostTimer = duration;
  }

  getCurrentAttackDamage() {
    return this.attackDamage + this.attackBoostAmount;
  }

  getAttackHitbox() {
    if (!this.isAttacking) return null;
    
    const attackWidth = 40;
    const attackHeight = 30;
    const attackX = this.facing > 0 ? this.x + this.width : this.x - attackWidth;
    const attackY = this.y + this.height / 2 - attackHeight / 2;
    
    return { x: attackX, y: attackY, width: attackWidth, height: attackHeight };
  }

  render() {
    this.p.push();
    
    // Flash white when damaged
    if (this.damageFlashTimer > 0 && this.damageFlashTimer % 4 < 2) {
      this.p.fill(255);
    } else {
      this.p.fill(50, 100, 200);
    }
    
    // Draw player body
    this.p.rect(this.x, this.y, this.width, this.height);
    
    // Draw face
    this.p.fill(255);
    const eyeY = this.y + 15;
    const eyeOffset = 8;
    this.p.ellipse(this.x + this.width / 2 - eyeOffset * this.facing, eyeY, 5, 5);
    this.p.ellipse(this.x + this.width / 2 + eyeOffset * this.facing, eyeY, 5, 5);
    
    // Draw legs (simple animation)
    this.p.fill(40, 80, 180);
    const legWidth = 8;
    const legHeight = 10;
    const legY = this.y + this.height;
    const animOffset = Math.abs(this.vx) > 0 && this.onGround ? Math.sin(this.p.frameCount * 0.3) * 3 : 0;
    this.p.rect(this.x + 5, legY - legHeight + animOffset, legWidth, legHeight);
    this.p.rect(this.x + this.width - 5 - legWidth, legY - legHeight - animOffset, legWidth, legHeight);
    
    // Draw attack
    if (this.isAttacking && this.attackTimer > ATTACK_DURATION / 2) {
      this.p.fill(255, 200, 0, 150);
      const hitbox = this.getAttackHitbox();
      this.p.rect(hitbox.x, hitbox.y, hitbox.width, hitbox.height);
    }
    
    // Draw attack boost indicator
    if (this.attackBoostTimer > 0) {
      this.p.fill(255, 215, 0);
      this.p.noStroke();
      const glowSize = 3 + Math.sin(this.p.frameCount * 0.2) * 2;
      this.p.ellipse(this.x + this.width / 2, this.y - 10, glowSize, glowSize);
    }
    
    this.p.pop();
  }
}