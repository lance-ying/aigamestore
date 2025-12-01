import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GRAVITY, DAMAGE_FLASH_DURATION } from './globals.js';
import { createParticles } from './particles.js';

export class Enemy {
  constructor(p, x, y, type) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.type = type;
    this.vx = 0;
    this.vy = 0;
    this.damageFlashTimer = 0;
    this.isDead = false;
    
    // Type-specific properties
    if (type === 'slime') {
      this.width = 20;
      this.height = 20;
      this.hp = 10;
      this.maxHP = 10;
      this.damage = 1;
      this.speed = 1;
      this.color = [80, 200, 80];
      this.points = 10;
      this.patrolDirection = 1;
      this.patrolDistance = 100;
      this.startX = x;
    } else if (type === 'bat') {
      this.width = 25;
      this.height = 15;
      this.hp = 15;
      this.maxHP = 15;
      this.damage = 1;
      this.speed = 1.5;
      this.color = [150, 80, 200];
      this.points = 15;
      this.patrolDirection = 1;
      this.patrolDistance = 120;
      this.startX = x;
      this.startY = y;
      this.flying = true;
      this.verticalSpeed = 0.5;
    } else if (type === 'knight') {
      this.width = 40;
      this.height = 60;
      this.hp = 100;
      this.maxHP = 100;
      this.damage = 5;
      this.speed = 0.8;
      this.color = [120, 120, 120];
      this.points = 50;
      this.attackCooldown = 0;
      this.attackRange = 80;
    } else if (type === 'boss') {
      this.width = 60;
      this.height = 80;
      this.hp = 200;
      this.maxHP = 200;
      this.damage = 10;
      this.speed = 1;
      this.color = [150, 50, 50];
      this.points = 200;
      this.attackCooldown = 0;
      this.attackPattern = 0;
      this.lastSpawnHP = 200;
    }
  }

  update(platforms, player) {
    if (this.isDead) return;

    // Update damage flash
    if (this.damageFlashTimer > 0) {
      this.damageFlashTimer--;
    }

    // Type-specific behavior
    if (this.type === 'slime') {
      this.updateSlime(platforms);
    } else if (this.type === 'bat') {
      this.updateBat();
    } else if (this.type === 'knight') {
      this.updateKnight(platforms, player);
    } else if (this.type === 'boss') {
      this.updateBoss(platforms, player);
    }

    // Apply gravity for non-flying enemies
    if (!this.flying) {
      this.vy += GRAVITY;
    }

    // Apply velocity
    this.x += this.vx;
    this.y += this.vy;

    // Platform collision for ground enemies
    if (!this.flying) {
      let onGround = false;
      for (let platform of platforms) {
        if (this.p.collideRectRect(this.x, this.y, this.width, this.height, 
                                     platform.x, platform.y, platform.width, platform.height)) {
          const overlapTop = (this.y + this.height) - platform.y;
          if (overlapTop < 20 && this.vy > 0) {
            this.y = platform.y - this.height;
            this.vy = 0;
            onGround = true;
          }
        }
      }
    }

    // Check collision with player
    if (player && this.p.collideRectRect(this.x, this.y, this.width, this.height,
                                          player.x, player.y, player.width, player.height)) {
      player.takeDamage(this.damage);
    }
  }

  updateSlime(platforms) {
    // Check if should turn around BEFORE setting velocity
    if (Math.abs(this.x - this.startX) > this.patrolDistance) {
      this.patrolDirection *= -1;
    }
    
    // Simple patrol
    this.vx = this.speed * this.patrolDirection;
  }

  updateBat() {
    // Check if should turn around BEFORE setting velocity
    if (Math.abs(this.x - this.startX) > this.patrolDistance) {
      this.patrolDirection *= -1;
    }
    
    // Patrol horizontally and vertically
    this.vx = this.speed * this.patrolDirection;
    this.vy = this.verticalSpeed * Math.sin(this.p.frameCount * 0.05);
  }

  updateKnight(platforms, player) {
    if (!player) return;

    // Attack cooldown
    if (this.attackCooldown > 0) {
      this.attackCooldown--;
    }

    // Move toward player if within range
    const distToPlayer = Math.abs(player.x - this.x);
    if (distToPlayer < 200) {
      const direction = player.x > this.x ? 1 : -1;
      this.vx = this.speed * direction;
      
      // Dash attack
      if (distToPlayer < this.attackRange && this.attackCooldown === 0) {
        this.vx = direction * this.speed * 3;
        this.attackCooldown = 120;
      }
    } else {
      this.vx = 0;
    }
  }

  updateBoss(platforms, player) {
    if (!player) return;

    // Attack cooldown
    if (this.attackCooldown > 0) {
      this.attackCooldown--;
    }

    // Spawn minions at health thresholds
    if (this.hp < this.lastSpawnHP - 40) {
      this.spawnMinions();
      this.lastSpawnHP = this.hp;
    }

    // Movement pattern
    const distToPlayer = Math.abs(player.x - this.x);
    if (distToPlayer > 100) {
      const direction = player.x > this.x ? 1 : -1;
      this.vx = this.speed * direction * 0.5;
    } else {
      this.vx = 0;
    }

    // Attack patterns
    if (this.attackCooldown === 0) {
      this.attackPattern = (this.attackPattern + 1) % 2;
      if (this.attackPattern === 0) {
        // Ground pound
        this.vy = -8;
        this.attackCooldown = 90;
      } else {
        // Dash
        const direction = player.x > this.x ? 1 : -1;
        this.vx = direction * this.speed * 4;
        this.attackCooldown = 90;
      }
    }
  }

  spawnMinions() {
    const slime1 = new Enemy(this.p, this.x - 50, this.y, 'slime');
    const slime2 = new Enemy(this.p, this.x + 50, this.y, 'slime');
    gameState.enemies.push(slime1, slime2);
    gameState.entities.push(slime1, slime2);
  }

  takeDamage(amount) {
    this.hp -= amount;
    this.damageFlashTimer = DAMAGE_FLASH_DURATION;
    
    if (this.hp <= 0) {
      this.hp = 0;
      this.die();
    }
  }

  die() {
    this.isDead = true;
    gameState.score += this.points;
    createParticles(this.p, this.x + this.width / 2, this.y + this.height / 2, this.color);
    
    if (this.type === 'boss') {
      gameState.bossDefeated = true;
    }
  }

  render() {
    if (this.isDead) return;

    this.p.push();
    
    // Flash when damaged
    if (this.damageFlashTimer > 0 && this.damageFlashTimer % 4 < 2) {
      this.p.fill(255, 200, 200);
    } else {
      this.p.fill(...this.color);
    }
    
    if (this.type === 'slime') {
      // Draw slime as rounded square
      this.p.rect(this.x, this.y, this.width, this.height, 5);
      this.p.fill(0, 150, 0);
      this.p.ellipse(this.x + 7, this.y + 8, 4, 4);
      this.p.ellipse(this.x + 13, this.y + 8, 4, 4);
    } else if (this.type === 'bat') {
      // Draw bat as ellipse with wings
      this.p.ellipse(this.x + this.width / 2, this.y + this.height / 2, this.width, this.height);
      const wingFlap = Math.sin(this.p.frameCount * 0.3) * 5;
      this.p.fill(100, 50, 150);
      this.p.triangle(this.x, this.y + this.height / 2, this.x - 10, this.y + wingFlap, this.x, this.y + this.height);
      this.p.triangle(this.x + this.width, this.y + this.height / 2, this.x + this.width + 10, this.y + wingFlap, this.x + this.width, this.y + this.height);
    } else if (this.type === 'knight') {
      // Draw knight with armor details
      this.p.rect(this.x, this.y, this.width, this.height);
      this.p.fill(80, 80, 80);
      this.p.rect(this.x + 5, this.y + 10, this.width - 10, this.height - 20);
      this.p.fill(200, 200, 200);
      this.p.rect(this.x + this.width / 2 - 3, this.y + 5, 6, 15);
    } else if (this.type === 'boss') {
      // Draw boss with crown
      this.p.rect(this.x, this.y, this.width, this.height);
      this.p.fill(200, 50, 50);
      this.p.rect(this.x + 5, this.y + 5, this.width - 10, this.height - 10);
      this.p.fill(255, 215, 0);
      // Crown
      this.p.triangle(this.x + 10, this.y, this.x + 15, this.y - 10, this.x + 20, this.y);
      this.p.triangle(this.x + 20, this.y, this.x + 25, this.y - 15, this.x + 30, this.y);
      this.p.triangle(this.x + 30, this.y, this.x + 35, this.y - 10, this.x + 40, this.y);
    }
    
    // HP bar for bosses and knights
    if (this.type === 'knight' || this.type === 'boss') {
      const barWidth = this.width;
      const barHeight = 4;
      const barY = this.y - 10;
      this.p.fill(100, 0, 0);
      this.p.rect(this.x, barY, barWidth, barHeight);
      this.p.fill(0, 200, 0);
      this.p.rect(this.x, barY, barWidth * (this.hp / this.maxHP), barHeight);
    }
    
    this.p.pop();
  }
}