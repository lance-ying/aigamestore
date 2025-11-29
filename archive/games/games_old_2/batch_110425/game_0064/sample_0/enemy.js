// enemy.js - Enemy class and related functions
import { GROUND_Y, GRAVITY, ENEMY_WIDTH, ENEMY_HEIGHT, gameState } from './globals.js';

export class Enemy {
  constructor(x, y, config) {
    this.x = x;
    this.y = y;
    this.width = config.isBoss ? ENEMY_WIDTH * 2 : ENEMY_WIDTH;
    this.height = config.isBoss ? ENEMY_HEIGHT * 1.5 : ENEMY_HEIGHT;
    this.maxHealth = config.health;
    this.health = config.health;
    this.damage = config.damage;
    this.gold = config.gold;
    this.vx = 0;
    this.vy = 0;
    this.facingRight = false;
    this.attackTimer = 0;
    this.attackCooldown = 90;
    this.moveTimer = 0;
    this.aiState = "idle";
    this.hitTimer = 0;
    this.dead = false;
    this.deathTimer = 0;
    this.isBoss = config.isBoss || false;
    this.animFrame = 0;
    this.animTimer = 0;
  }

  update() {
    if (this.dead) {
      this.deathTimer++;
      return;
    }

    // Apply gravity
    if (this.y < GROUND_Y - this.height) {
      this.vy += GRAVITY;
    } else {
      this.y = GROUND_Y - this.height;
      this.vy = 0;
    }

    this.x += this.vx;
    this.y += this.vy;

    // Update timers
    if (this.attackTimer > 0) this.attackTimer--;
    if (this.hitTimer > 0) this.hitTimer--;
    if (this.moveTimer > 0) this.moveTimer--;

    // Animation
    this.animTimer++;
    if (this.animTimer % 15 === 0) {
      this.animFrame = (this.animFrame + 1) % 3;
    }

    // AI behavior
    this.updateAI();

    // Deceleration
    this.vx *= 0.9;
  }

  updateAI() {
    if (!gameState.player) return;

    const player = gameState.player;
    const dx = player.x - this.x;
    const distance = Math.abs(dx);

    // Determine facing direction
    this.facingRight = dx > 0;

    if (distance < 50 && this.attackTimer <= 0) {
      // Attack range
      this.aiState = "attacking";
      this.attackTimer = this.attackCooldown;
      this.attemptAttack();
    } else if (distance < 200) {
      // Chase range
      this.aiState = "chasing";
      if (this.moveTimer <= 0) {
        const speed = this.isBoss ? 1.5 : 1;
        this.vx = dx > 0 ? speed : -speed;
        this.moveTimer = 30;
      }
    } else {
      // Idle or wander
      this.aiState = "idle";
      if (this.moveTimer <= 0 && Math.random() < 0.02) {
        this.vx = Math.random() < 0.5 ? -0.5 : 0.5;
        this.moveTimer = 60;
      }
    }
  }

  attemptAttack() {
    if (!gameState.player) return;
    
    const player = gameState.player;
    const dx = Math.abs(player.x - this.x);
    
    if (dx < 60) {
      player.takeDamage(this.damage);
    }
  }

  takeDamage(damage) {
    if (this.dead) return;
    
    this.health -= damage;
    this.hitTimer = 15;
    
    if (this.health <= 0) {
      this.health = 0;
      this.die();
    }
  }

  die() {
    this.dead = true;
    this.deathTimer = 0;
    
    // Drop gold
    gameState.goldDrops.push({
      x: this.x + this.width / 2,
      y: this.y,
      vy: -5,
      vx: (Math.random() - 0.5) * 4,
      value: this.gold,
      lifetime: 300
    });

    // Create death particles
    for (let i = 0; i < 8; i++) {
      gameState.particles.push({
        x: this.x + this.width / 2,
        y: this.y + this.height / 2,
        vx: (Math.random() - 0.5) * 6,
        vy: Math.random() * -6,
        size: Math.random() * 8 + 4,
        life: 60,
        color: this.isBoss ? [150, 0, 200] : [150, 50, 50]
      });
    }
  }

  render(p) {
    if (this.dead && this.deathTimer > 30) return;

    p.push();

    // Flash when hit
    if (this.hitTimer > 0 && this.hitTimer % 6 < 3) {
      p.tint(255, 150, 150);
    }

    // Fade out when dying
    if (this.dead) {
      const alpha = 255 * (1 - this.deathTimer / 30);
      p.tint(255, alpha);
    }

    // Draw shadow
    p.fill(0, 0, 0, 50);
    p.noStroke();
    p.ellipse(this.x + this.width / 2, GROUND_Y + 5, this.width * 0.8, 10);

    // Draw enemy body
    const bodyColor = this.isBoss ? [100, 0, 120] : [120, 50, 50];
    p.fill(...bodyColor);
    p.stroke(80, 30, 30);
    p.strokeWeight(2);
    p.rect(this.x, this.y, this.width, this.height, 5);

    // Draw head/horns
    p.fill(80, 30, 30);
    p.triangle(
      this.x + this.width * 0.3, this.y,
      this.x + this.width * 0.5, this.y - 10,
      this.x + this.width * 0.7, this.y
    );

    // Draw eyes
    p.fill(255, 200, 0);
    p.noStroke();
    const eyeY = this.y + 15;
    p.ellipse(this.x + this.width * 0.35, eyeY, 8, 6);
    p.ellipse(this.x + this.width * 0.65, eyeY, 8, 6);

    // Draw health bar
    if (!this.dead && this.health < this.maxHealth) {
      const barWidth = this.width;
      const barHeight = 5;
      const barY = this.y - 10;
      
      p.fill(50, 50, 50);
      p.noStroke();
      p.rect(this.x, barY, barWidth, barHeight);
      
      const healthPercent = this.health / this.maxHealth;
      p.fill(healthPercent > 0.5 ? 100 : 200, healthPercent > 0.3 ? 200 : 50, 50);
      p.rect(this.x, barY, barWidth * healthPercent, barHeight);
    }

    // Attack indicator
    if (this.attackTimer > this.attackCooldown - 20) {
      p.noFill();
      p.stroke(255, 100, 100);
      p.strokeWeight(2);
      p.arc(this.x + this.width / 2, this.y + this.height / 2, 60, 60, 0, Math.PI * 2);
    }

    p.pop();
  }

  getCollisionBox() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    };
  }
}