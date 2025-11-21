// enemy.js - Enemy implementation

import { gameState, GROUND_Y, PLAYER_ATTACK_DAMAGE } from './globals.js';

export class Enemy {
  constructor(x, y, type = 'basic') {
    this.type = 'enemy';
    this.enemyType = type;
    this.x = x;
    this.y = y;
    this.width = 28;
    this.height = 45;
    this.vx = 0;
    this.vy = 0;
    this.facing = -1;
    this.isGrabbed = false;
    
    // Stats based on type
    if (type === 'basic') {
      this.health = 30;
      this.maxHealth = 30;
      this.damage = 5;
      this.speed = 1;
      this.attackCooldown = 0;
      this.attackRange = 35;
      this.color = [255, 100, 100];
    } else if (type === 'fast') {
      this.health = 20;
      this.maxHealth = 20;
      this.damage = 4;
      this.speed = 2;
      this.attackCooldown = 0;
      this.attackRange = 30;
      this.color = [100, 255, 100];
    } else if (type === 'tank') {
      this.health = 50;
      this.maxHealth = 50;
      this.damage = 8;
      this.speed = 0.5;
      this.attackCooldown = 0;
      this.attackRange = 40;
      this.color = [255, 150, 50];
    }
    
    this.invulnerable = 0;
    this.stunned = 0;
    this.aiTimer = 0;
    this.scoreValue = 100;
  }

  update(p) {
    if (this.health <= 0) return;

    // Update timers
    if (this.attackCooldown > 0) this.attackCooldown--;
    if (this.invulnerable > 0) this.invulnerable--;
    if (this.stunned > 0) {
      this.stunned--;
      return;
    }

    if (this.isGrabbed) return;

    // Apply gravity
    if (this.y < GROUND_Y) {
      this.vy += 0.5;
    } else {
      this.y = GROUND_Y;
      this.vy = 0;
    }

    // AI behavior
    if (gameState.player && gameState.player.health > 0) {
      const dx = gameState.player.x - this.x;
      const dy = gameState.player.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > this.attackRange) {
        // Move toward player
        this.facing = dx > 0 ? 1 : -1;
        this.vx = this.facing * this.speed;
      } else {
        // Attack player
        this.vx = 0;
        if (this.attackCooldown === 0) {
          this.attackPlayer(p);
          this.attackCooldown = 60;
        }
      }
    }

    // Update position
    this.x += this.vx;
    this.y += this.vy;

    // Clamp to stage bounds
    this.x = p.constrain(this.x, 0, 1200 - this.width);
  }

  attackPlayer(p) {
    if (gameState.player && this.attackCooldown === 0) {
      const dx = gameState.player.x - this.x;
      const dy = gameState.player.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < this.attackRange) {
        gameState.player.takeDamage(this.damage);
      }
    }
  }

  takeDamage(amount, p) {
    if (this.invulnerable === 0) {
      this.health -= amount;
      this.invulnerable = 20;
      this.stunned = 10;
      
      if (this.health <= 0) {
        this.health = 0;
        gameState.score += this.scoreValue;
        gameState.enemiesDefeated++;
        
        // Register hit with player
        if (gameState.player) {
          gameState.player.registerHit(p);
          gameState.score += gameState.player.combo * 10;
        }
      }
    }
  }

  knockback(vx, vy) {
    this.vx = vx;
    this.vy = vy;
  }

  render(p, camera) {
    if (this.health <= 0) return;

    const screenX = this.x - camera.x;

    p.push();

    // Draw shadow
    p.fill(0, 0, 0, 50);
    p.noStroke();
    p.ellipse(screenX + this.width / 2, GROUND_Y + 5, this.width * 0.8, 10);

    // Flash when hit
    const bodyColor = this.invulnerable > 0 && Math.floor(this.invulnerable / 3) % 2 === 0 
      ? [255, 255, 255] 
      : this.color;

    // Draw body
    p.fill(...bodyColor);
    p.stroke(50);
    p.strokeWeight(2);
    p.rect(screenX, this.y, this.width, this.height);

    // Draw head
    p.fill(220, 180, 140);
    p.circle(screenX + this.width / 2, this.y + 10, 18);

    // Draw eyes
    p.fill(50);
    p.noStroke();
    const eyeOffsetX = this.facing === 1 ? 2 : -2;
    p.circle(screenX + this.width / 2 + eyeOffsetX - 3, this.y + 8, 3);
    p.circle(screenX + this.width / 2 + eyeOffsetX + 3, this.y + 8, 3);

    // Health bar
    p.fill(255, 0, 0);
    p.noStroke();
    p.rect(screenX, this.y - 8, this.width, 4);
    p.fill(0, 255, 0);
    const healthWidth = (this.health / this.maxHealth) * this.width;
    p.rect(screenX, this.y - 8, healthWidth, 4);

    p.pop();
  }
}

export class Boss extends Enemy {
  constructor(x, y) {
    super(x, y, 'tank');
    this.type = 'enemy';
    this.enemyType = 'boss';
    this.health = 150;
    this.maxHealth = 150;
    this.damage = 12;
    this.speed = 1.5;
    this.width = 40;
    this.height = 60;
    this.attackRange = 50;
    this.color = [150, 50, 200];
    this.scoreValue = 1000;
    this.phase = 1;
    this.specialAttackCooldown = 0;
  }

  update(p) {
    if (this.health <= 0) return;

    // Update timers
    if (this.attackCooldown > 0) this.attackCooldown--;
    if (this.invulnerable > 0) this.invulnerable--;
    if (this.specialAttackCooldown > 0) this.specialAttackCooldown--;
    if (this.stunned > 0) {
      this.stunned--;
      return;
    }

    // Phase transition
    if (this.health < this.maxHealth * 0.5 && this.phase === 1) {
      this.phase = 2;
      this.speed = 2;
      this.damage = 15;
    }

    if (this.isGrabbed) return;

    // Apply gravity
    if (this.y < GROUND_Y) {
      this.vy += 0.5;
    } else {
      this.y = GROUND_Y;
      this.vy = 0;
    }

    // Boss AI
    if (gameState.player && gameState.player.health > 0) {
      const dx = gameState.player.x - this.x;
      const dy = gameState.player.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      this.facing = dx > 0 ? 1 : -1;

      if (dist > this.attackRange) {
        // Move toward player
        this.vx = this.facing * this.speed;
      } else {
        this.vx = 0;
        
        // Special attack in phase 2
        if (this.phase === 2 && this.specialAttackCooldown === 0) {
          this.specialAttack(p);
          this.specialAttackCooldown = 120;
        } else if (this.attackCooldown === 0) {
          this.attackPlayer(p);
          this.attackCooldown = 40;
        }
      }
    }

    // Update position
    this.x += this.vx;
    this.y += this.vy;

    // Clamp to stage bounds
    this.x = p.constrain(this.x, 0, 1200 - this.width);
  }

  specialAttack(p) {
    // Area attack
    const hitbox = {
      x: this.x - 30,
      y: this.y - 10,
      width: this.width + 60,
      height: this.height + 20
    };

    if (gameState.player) {
      const playerRect = { 
        x: gameState.player.x, 
        y: gameState.player.y, 
        width: gameState.player.width, 
        height: gameState.player.height 
      };
      
      if (p.collideRectRect(hitbox.x, hitbox.y, hitbox.width, hitbox.height,
                            playerRect.x, playerRect.y, playerRect.width, playerRect.height)) {
        gameState.player.takeDamage(this.damage * 1.5);
        // Knockback
        const knockbackDir = gameState.player.x > this.x ? 1 : -1;
        gameState.player.vx = knockbackDir * 5;
        gameState.player.vy = -5;
      }
    }
  }

  render(p, camera) {
    if (this.health <= 0) return;

    const screenX = this.x - camera.x;

    p.push();

    // Draw shadow
    p.fill(0, 0, 0, 70);
    p.noStroke();
    p.ellipse(screenX + this.width / 2, GROUND_Y + 5, this.width * 0.9, 12);

    // Flash when hit
    const bodyColor = this.invulnerable > 0 && Math.floor(this.invulnerable / 3) % 2 === 0 
      ? [255, 255, 255] 
      : this.color;

    // Draw body (larger)
    p.fill(...bodyColor);
    p.stroke(50);
    p.strokeWeight(3);
    p.rect(screenX, this.y, this.width, this.height);

    // Draw head
    p.fill(200, 150, 120);
    p.circle(screenX + this.width / 2, this.y + 15, 25);

    // Draw eyes (angry)
    p.fill(255, 0, 0);
    p.noStroke();
    p.circle(screenX + this.width / 2 - 5, this.y + 12, 4);
    p.circle(screenX + this.width / 2 + 5, this.y + 12, 4);

    // Draw crown/boss indicator
    p.fill(255, 215, 0);
    p.triangle(
      screenX + this.width / 2 - 10, this.y,
      screenX + this.width / 2, this.y - 10,
      screenX + this.width / 2 + 10, this.y
    );

    // Special attack indicator
    if (this.specialAttackCooldown > 110) {
      p.noFill();
      p.stroke(255, 0, 255);
      p.strokeWeight(3);
      p.circle(screenX + this.width / 2, this.y + this.height / 2, 60);
    }

    // Health bar (larger)
    p.fill(100, 0, 0);
    p.noStroke();
    p.rect(screenX - 5, this.y - 12, this.width + 10, 6);
    p.fill(255, 50, 50);
    const healthWidth = (this.health / this.maxHealth) * (this.width + 10);
    p.rect(screenX - 5, this.y - 12, healthWidth, 6);

    // Boss name
    p.fill(255, 215, 0);
    p.textAlign(p.CENTER);
    p.textSize(10);
    p.text("BOSS", screenX + this.width / 2, this.y - 18);

    p.pop();
  }
}