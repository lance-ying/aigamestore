// player.js - Player character class

import { 
  GROUND_Y, 
  GRAVITY, 
  MAX_HEALTH, 
  ATTACK_RANGE,
  PUNCH_DAMAGE,
  KICK_DAMAGE,
  COMBO_DAMAGE_MULTIPLIER,
  ATTACK_COOLDOWN,
  HIT_STUN_DURATION,
  gameState
} from './globals.js';

export class Player {
  constructor(x, y, isPlayer = true) {
    this.x = x;
    this.y = y;
    this.width = 40;
    this.height = 80;
    this.vx = 0;
    this.vy = 0;
    this.health = MAX_HEALTH;
    this.maxHealth = MAX_HEALTH;
    this.isPlayer = isPlayer;
    this.isJumping = false;
    this.isCrouching = false;
    this.facingRight = isPlayer;
    this.isAttacking = false;
    this.attackType = null;
    this.attackFrame = 0;
    this.attackCooldown = 0;
    this.hitStun = 0;
    this.damage = 1.0;
    this.defense = 1.0;
    this.speed = 1.0;
    this.animation = {
      frame: 0,
      type: 'idle'
    };
    this.recentInputs = [];
    this.comboWindow = 30;
  }

  update(p) {
    // Hit stun prevents movement
    if (this.hitStun > 0) {
      this.hitStun--;
      this.animation.type = 'hurt';
    }

    // Gravity
    if (this.y < GROUND_Y) {
      this.vy += GRAVITY;
      this.isJumping = true;
    } else {
      this.y = GROUND_Y;
      this.vy = 0;
      this.isJumping = false;
    }

    // Apply velocity
    this.x += this.vx;
    this.y += this.vy;

    // Boundaries
    this.x = p.constrain(this.x, 50, 550);

    // Update attack
    if (this.isAttacking) {
      this.attackFrame++;
      if (this.attackFrame > 20) {
        this.isAttacking = false;
        this.attackType = null;
        this.attackFrame = 0;
      }
    }

    if (this.attackCooldown > 0) {
      this.attackCooldown--;
    }

    // Update animation
    this.animation.frame++;
    if (!this.isAttacking && !this.hitStun) {
      if (this.isJumping) {
        this.animation.type = 'jump';
      } else if (this.isCrouching) {
        this.animation.type = 'crouch';
      } else if (Math.abs(this.vx) > 0.1) {
        this.animation.type = 'walk';
      } else {
        this.animation.type = 'idle';
      }
    }

    // Clean old inputs
    this.recentInputs = this.recentInputs.filter(inp => p.frameCount - inp.frame < this.comboWindow);
  }

  moveLeft() {
    if (this.hitStun > 0) return;
    this.vx = -3 * this.speed;
    this.facingRight = false;
  }

  moveRight() {
    if (this.hitStun > 0) return;
    this.vx = 3 * this.speed;
    this.facingRight = true;
  }

  jump() {
    if (this.hitStun > 0) return;
    if (!this.isJumping && !this.isCrouching) {
      this.vy = -15;
      this.isJumping = true;
    }
  }

  crouch() {
    if (this.hitStun > 0) return;
    if (!this.isJumping) {
      this.isCrouching = true;
      this.height = 40;
    }
  }

  standUp() {
    this.isCrouching = false;
    this.height = 80;
  }

  stopMove() {
    this.vx = 0;
  }

  recordInput(type, frame) {
    this.recentInputs.push({ type, frame });
  }

  checkCombo() {
    // Check for special combo patterns
    if (this.recentInputs.length < 2) return null;
    
    const recent = this.recentInputs.slice(-3).map(i => i.type);
    
    // Forward + Attack combos
    if (recent.includes('right') && recent.includes('punch')) {
      return 'forward_punch';
    }
    if (recent.includes('right') && recent.includes('kick')) {
      return 'forward_kick';
    }
    
    // Jump attacks
    if (recent.includes('jump') && recent.includes('punch')) {
      return 'jump_punch';
    }
    if (recent.includes('jump') && recent.includes('kick')) {
      return 'jump_kick';
    }
    
    // Crouch attacks
    if (recent.includes('crouch') && recent.includes('punch')) {
      return 'crouch_punch';
    }
    if (recent.includes('crouch') && recent.includes('kick')) {
      return 'crouch_kick';
    }
    
    return null;
  }

  attack(type, p) {
    if (this.attackCooldown > 0 || this.hitStun > 0) return false;
    
    const combo = this.checkCombo();
    
    this.isAttacking = true;
    this.attackType = combo || type;
    this.attackFrame = 0;
    this.attackCooldown = ATTACK_COOLDOWN;
    this.animation.type = 'attack';
    
    return true;
  }

  getAttackDamage() {
    let baseDamage = this.attackType === 'kick' ? KICK_DAMAGE : PUNCH_DAMAGE;
    
    // Combo moves deal more damage
    if (this.attackType && this.attackType.includes('_')) {
      baseDamage *= COMBO_DAMAGE_MULTIPLIER;
    }
    
    return baseDamage * this.damage;
  }

  takeDamage(amount) {
    const actualDamage = amount / this.defense;
    this.health -= actualDamage;
    this.hitStun = HIT_STUN_DURATION;
    
    if (this.health <= 0) {
      this.health = 0;
    }
    
    return actualDamage;
  }

  isInRange(target) {
    const distance = Math.abs(this.x - target.x);
    return distance < ATTACK_RANGE;
  }

  getHitbox() {
    if (!this.isAttacking) return null;
    
    const hitboxSize = 50;
    const hitboxX = this.facingRight ? this.x + this.width : this.x - hitboxSize;
    
    return {
      x: hitboxX,
      y: this.y + 20,
      width: hitboxSize,
      height: 40
    };
  }

  draw(p) {
    p.push();
    
    // Shadow
    p.fill(0, 0, 0, 50);
    p.ellipse(this.x + this.width / 2, GROUND_Y + this.height + 5, this.width * 1.5, 10);
    
    // Body color based on player/enemy
    const bodyColor = this.isPlayer ? [50, 100, 200] : [200, 50, 50];
    
    // Flash white when hit
    if (this.hitStun > 0 && this.hitStun % 4 < 2) {
      p.fill(255, 255, 255);
    } else {
      p.fill(...bodyColor);
    }
    
    // Draw body
    if (this.isCrouching) {
      p.rect(this.x, this.y + 40, this.width, this.height);
    } else {
      p.rect(this.x, this.y, this.width, this.height);
    }
    
    // Draw head
    p.fill(...(this.hitStun > 0 && this.hitStun % 4 < 2 ? [255, 255, 255] : [220, 180, 140]));
    p.ellipse(this.x + this.width / 2, this.y - 10, 30, 30);
    
    // Draw limbs based on animation
    p.stroke(0);
    p.strokeWeight(4);
    
    if (this.isAttacking && this.attackFrame < 15) {
      // Attack animation
      const armExtend = this.facingRight ? 30 : -30;
      const armY = this.attackType === 'kick' ? this.y + 50 : this.y + 20;
      p.line(this.x + this.width / 2, this.y + 20, this.x + this.width / 2 + armExtend, armY);
      
      // Draw attack effect
      p.noStroke();
      p.fill(255, 255, 0, 150);
      const effectX = this.facingRight ? this.x + this.width + 10 : this.x - 20;
      p.ellipse(effectX, armY, 20, 20);
    } else {
      // Normal limbs
      const walkOffset = Math.sin(this.animation.frame * 0.2) * 5;
      p.line(this.x + this.width / 2, this.y + 30, this.x + this.width / 2 + walkOffset, this.y + this.height);
      p.line(this.x + this.width / 2, this.y + 30, this.x + this.width / 2 - walkOffset, this.y + this.height);
    }
    
    p.noStroke();
    
    // Health bar
    const barWidth = 60;
    const barHeight = 6;
    const barX = this.x + this.width / 2 - barWidth / 2;
    const barY = this.y - 30;
    
    // Background
    p.fill(100, 100, 100);
    p.rect(barX, barY, barWidth, barHeight);
    
    // Health
    const healthPercent = this.health / this.maxHealth;
    const healthColor = healthPercent > 0.5 ? [0, 255, 0] : healthPercent > 0.25 ? [255, 255, 0] : [255, 0, 0];
    p.fill(...healthColor);
    p.rect(barX, barY, barWidth * healthPercent, barHeight);
    
    // Border
    p.noFill();
    p.stroke(0);
    p.strokeWeight(1);
    p.rect(barX, barY, barWidth, barHeight);
    
    p.pop();
  }

  reset() {
    this.health = this.maxHealth;
    this.hitStun = 0;
    this.isAttacking = false;
    this.attackCooldown = 0;
    this.vx = 0;
    this.vy = 0;
    this.isJumping = false;
    this.isCrouching = false;
    this.standUp();
    this.recentInputs = [];
  }
}