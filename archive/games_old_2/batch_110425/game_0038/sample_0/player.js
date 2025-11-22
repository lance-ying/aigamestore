// player.js - Player character implementation

import { gameState, GROUND_Y, PLAYER_HEALTH, PLAYER_SPEED, PLAYER_ATTACK_DAMAGE, 
         PLAYER_SPECIAL_DAMAGE, PLAYER_SPECIAL_COST, PLAYER_COMBO_WINDOW } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 30;
    this.height = 50;
    this.vx = 0;
    this.vy = 0;
    this.health = PLAYER_HEALTH;
    this.maxHealth = PLAYER_HEALTH;
    this.facing = 1; // 1 = right, -1 = left
    this.isAttacking = false;
    this.attackCooldown = 0;
    this.attackFrame = 0;
    this.attackHitbox = null;
    this.isGrabbing = false;
    this.grabbedEnemy = null;
    this.grabCooldown = 0;
    this.invulnerable = 0;
    this.combo = 0;
    this.lastHitTime = 0;
    this.specialCooldown = 0;
  }

  update(p) {
    // Update timers
    if (this.attackCooldown > 0) this.attackCooldown--;
    if (this.grabCooldown > 0) this.grabCooldown--;
    if (this.invulnerable > 0) this.invulnerable--;
    if (this.specialCooldown > 0) this.specialCooldown--;

    // Check combo timeout
    if (p.millis() - this.lastHitTime > PLAYER_COMBO_WINDOW) {
      this.combo = 0;
    }

    // Apply gravity
    if (this.y < GROUND_Y) {
      this.vy += 0.5;
    } else {
      this.y = GROUND_Y;
      this.vy = 0;
    }

    // Update position
    this.x += this.vx;
    this.y += this.vy;

    // Clamp to stage bounds
    this.x = p.constrain(this.x, 0, 1200 - this.width);

    // Update attack animation
    if (this.isAttacking) {
      this.attackFrame++;
      if (this.attackFrame > 15) {
        this.isAttacking = false;
        this.attackFrame = 0;
        this.attackHitbox = null;
      } else if (this.attackFrame >= 5 && this.attackFrame <= 10) {
        // Create hitbox during attack
        this.attackHitbox = {
          x: this.x + (this.facing === 1 ? this.width : -40),
          y: this.y + 10,
          width: 40,
          height: 30
        };
      } else {
        this.attackHitbox = null;
      }
    }

    // Reset velocity
    this.vx = 0;
  }

  move(direction) {
    if (!this.isAttacking && !this.isGrabbing) {
      this.vx = direction * PLAYER_SPEED;
      if (direction !== 0) {
        this.facing = direction;
      }
    }
  }

  attack() {
    if (!this.isAttacking && this.attackCooldown === 0 && !this.isGrabbing) {
      this.isAttacking = true;
      this.attackFrame = 0;
      this.attackCooldown = 20;
      return true;
    }
    return false;
  }

  specialAttack(p) {
    if (this.specialCooldown === 0 && this.health > PLAYER_SPECIAL_COST) {
      this.health -= PLAYER_SPECIAL_COST;
      this.specialCooldown = 60;
      
      // Create special attack hitbox (larger area)
      const hitbox = {
        x: this.x - 50,
        y: this.y - 20,
        width: this.width + 100,
        height: this.height + 40,
        damage: PLAYER_SPECIAL_DAMAGE
      };

      // Hit all nearby enemies
      gameState.entities.forEach(entity => {
        if (entity.type === 'enemy' && entity.health > 0) {
          const enemyRect = { x: entity.x, y: entity.y, width: entity.width, height: entity.height };
          if (p.collideRectRect(hitbox.x, hitbox.y, hitbox.width, hitbox.height,
                                enemyRect.x, enemyRect.y, enemyRect.width, enemyRect.height)) {
            entity.takeDamage(hitbox.damage, p);
            entity.knockback(this.facing * 8, -5);
          }
        }
      });

      return true;
    }
    return false;
  }

  grab(p) {
    if (!this.isGrabbing && this.grabCooldown === 0 && !this.isAttacking) {
      // Find nearby enemy
      const nearbyEnemy = gameState.entities.find(entity => {
        if (entity.type === 'enemy' && entity.health > 0) {
          const dist = p.dist(this.x, this.y, entity.x, entity.y);
          return dist < 40;
        }
        return false;
      });

      if (nearbyEnemy) {
        this.isGrabbing = true;
        this.grabbedEnemy = nearbyEnemy;
        this.grabCooldown = 120;
        nearbyEnemy.isGrabbed = true;
        
        // Throw enemy after a moment
        setTimeout(() => {
          if (this.grabbedEnemy && this.grabbedEnemy.health > 0) {
            this.grabbedEnemy.takeDamage(20, p);
            this.grabbedEnemy.knockback(this.facing * 10, -8);
            this.grabbedEnemy.isGrabbed = false;
          }
          this.isGrabbing = false;
          this.grabbedEnemy = null;
        }, 500);

        return true;
      }
    }
    return false;
  }

  takeDamage(amount) {
    if (this.invulnerable === 0) {
      this.health -= amount;
      this.invulnerable = 60;
      this.combo = 0;
      if (this.health <= 0) {
        this.health = 0;
      }
    }
  }

  registerHit(p) {
    this.combo++;
    this.lastHitTime = p.millis();
  }

  heal(amount) {
    this.health = Math.min(this.health + amount, this.maxHealth);
  }

  render(p, camera) {
    const screenX = this.x - camera.x;
    
    p.push();
    
    // Invulnerability flash
    if (this.invulnerable > 0 && Math.floor(this.invulnerable / 5) % 2 === 0) {
      p.tint(255, 100);
    }

    // Draw shadow
    p.fill(0, 0, 0, 50);
    p.noStroke();
    p.ellipse(screenX + this.width / 2, GROUND_Y + 5, this.width * 0.8, 10);

    // Draw body
    const bodyColor = this.invulnerable > 0 ? [255, 200, 200] : [100, 150, 255];
    p.fill(...bodyColor);
    p.stroke(50);
    p.strokeWeight(2);
    p.rect(screenX, this.y, this.width, this.height);

    // Draw head
    p.fill(255, 220, 180);
    p.circle(screenX + this.width / 2, this.y + 12, 20);

    // Draw eyes
    p.fill(50);
    p.noStroke();
    const eyeOffsetX = this.facing === 1 ? 3 : -3;
    p.circle(screenX + this.width / 2 + eyeOffsetX - 4, this.y + 10, 3);
    p.circle(screenX + this.width / 2 + eyeOffsetX + 4, this.y + 10, 3);

    // Draw attacking animation
    if (this.isAttacking && this.attackFrame >= 5 && this.attackFrame <= 10) {
      p.stroke(255, 255, 0);
      p.strokeWeight(3);
      p.noFill();
      const punchX = screenX + (this.facing === 1 ? this.width : 0);
      p.line(punchX, this.y + 20, punchX + this.facing * 30, this.y + 20);
      
      // Impact effect
      p.fill(255, 255, 100, 150);
      p.noStroke();
      p.circle(punchX + this.facing * 30, this.y + 20, 15);
    }

    // Draw special attack effect
    if (this.specialCooldown > 55) {
      p.noFill();
      p.stroke(255, 100, 255);
      p.strokeWeight(3);
      const radius = (60 - this.specialCooldown) * 10;
      p.circle(screenX + this.width / 2, this.y + this.height / 2, radius);
    }

    // Draw grab indicator
    if (this.isGrabbing) {
      p.fill(255, 0, 0, 100);
      p.noStroke();
      p.rect(screenX - 5, this.y - 5, this.width + 10, this.height + 10);
    }

    p.pop();
  }
}