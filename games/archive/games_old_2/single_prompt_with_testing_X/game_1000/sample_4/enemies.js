// enemies.js - Enemy classes
import { TILE_SIZE, GRAVITY, MAX_FALL_SPEED } from './globals.js';

export class Enemy {
  constructor(p, x, y, type) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.type = type;
    this.vx = 0;
    this.vy = 0;
    this.width = 20;
    this.height = 20;
    this.grounded = false;
    this.health = 20;
    this.maxHealth = 20;
    this.damage = 5;
    this.speed = 1;
    this.detectionRange = 200;
    this.attackCooldown = 0;
    this.active = true;
  }

  update(world, player) {
    if (!this.active) return;

    // Simple AI: move towards player if in range
    const dx = player.x - this.x;
    const distance = Math.abs(dx);

    if (distance < this.detectionRange) {
      if (dx > 10) {
        this.vx = this.speed;
      } else if (dx < -10) {
        this.vx = -this.speed;
      } else {
        this.vx = 0;
        // Attack if close enough
        if (this.attackCooldown === 0 && distance < 30) {
          player.takeDamage(this.damage);
          this.attackCooldown = 60;
        }
      }
    } else {
      this.vx *= 0.9;
    }

    if (this.attackCooldown > 0) {
      this.attackCooldown--;
    }

    // Apply gravity
    if (!this.grounded) {
      this.vy += GRAVITY;
      if (this.vy > MAX_FALL_SPEED) {
        this.vy = MAX_FALL_SPEED;
      }
    }

    // Move
    this.x += this.vx;
    this.y += this.vy;

    // Simple collision with world
    const tileY = Math.floor(this.y / TILE_SIZE);
    const tileX = Math.floor(this.x / TILE_SIZE);
    
    if (world.isBlockSolid(tileX, tileY + 1)) {
      this.y = (tileY + 1) * TILE_SIZE - this.height / 2;
      this.vy = 0;
      this.grounded = true;
    } else {
      this.grounded = false;
    }
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.active = false;
    }
  }

  render(p, camera) {
    if (!this.active) return;

    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;

    p.push();
    
    // Draw enemy (slime-like creature)
    p.fill(100, 200, 100);
    p.ellipse(screenX, screenY, this.width, this.height);
    
    // Eyes
    p.fill(255, 0, 0);
    p.ellipse(screenX - 5, screenY - 3, 4, 4);
    p.ellipse(screenX + 5, screenY - 3, 4, 4);
    
    // Health bar
    p.fill(255, 0, 0);
    p.rect(screenX - 10, screenY - 15, 20, 3);
    p.fill(0, 255, 0);
    p.rect(screenX - 10, screenY - 15, 20 * (this.health / this.maxHealth), 3);
    
    p.pop();
  }
}

export class Boss {
  constructor(p, x, y, tier) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.tier = tier;
    this.vx = 0;
    this.vy = 0;
    this.width = 40;
    this.height = 40;
    this.grounded = false;
    this.health = 100 + tier * 50;
    this.maxHealth = this.health;
    this.damage = 10 + tier * 5;
    this.speed = 0.5;
    this.detectionRange = 300;
    this.attackCooldown = 0;
    this.active = true;
    this.phase = 0;
    this.name = this.getBossName(tier);
  }

  getBossName(tier) {
    const names = ["Slime King", "Stone Guardian", "Iron Colossus", "Golden Golem", "Diamond Dragon", "Mythril Titan"];
    return names[tier] || "Unknown Boss";
  }

  update(world, player) {
    if (!this.active) return;

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Boss AI
    if (distance < this.detectionRange) {
      // Move towards player
      if (Math.abs(dx) > 50) {
        this.vx = (dx > 0 ? this.speed : -this.speed) * (1 + this.phase * 0.2);
      } else {
        this.vx *= 0.9;
      }

      // Jump occasionally
      if (this.grounded && this.p.random() < 0.02) {
        this.vy = -8;
      }

      // Attack
      if (this.attackCooldown === 0 && distance < 60) {
        player.takeDamage(this.damage);
        this.attackCooldown = 90 - this.phase * 10;
      }
    }

    // Phase changes
    if (this.health < this.maxHealth * 0.5 && this.phase === 0) {
      this.phase = 1;
      this.speed *= 1.5;
    }

    if (this.attackCooldown > 0) {
      this.attackCooldown--;
    }

    // Physics
    if (!this.grounded) {
      this.vy += GRAVITY;
      if (this.vy > MAX_FALL_SPEED) {
        this.vy = MAX_FALL_SPEED;
      }
    }

    this.x += this.vx;
    this.y += this.vy;

    // Collision
    const tileY = Math.floor(this.y / TILE_SIZE);
    const tileX = Math.floor(this.x / TILE_SIZE);
    
    if (world.isBlockSolid(tileX, tileY + 2)) {
      this.y = (tileY + 2) * TILE_SIZE - this.height / 2;
      this.vy = 0;
      this.grounded = true;
    } else {
      this.grounded = false;
    }
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.active = false;
      this.health = 0;
    }
  }

  render(p, camera) {
    if (!this.active) return;

    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;

    p.push();
    
    // Draw boss - more intimidating
    const pulseSize = p.sin(p.frameCount * 0.1) * 3;
    
    // Body
    p.fill(150 + this.tier * 20, 50, 200 - this.tier * 20);
    p.ellipse(screenX, screenY, this.width + pulseSize, this.height + pulseSize);
    
    // Crown/horns
    p.fill(255, 215, 0);
    p.triangle(screenX - 15, screenY - 20, screenX - 10, screenY - 30, screenX - 5, screenY - 20);
    p.triangle(screenX + 5, screenY - 20, screenX + 10, screenY - 30, screenX + 15, screenY - 20);
    
    // Eyes
    p.fill(255, 0, 0);
    p.ellipse(screenX - 8, screenY - 5, 6, 8);
    p.ellipse(screenX + 8, screenY - 5, 6, 8);
    
    // Health bar (larger for boss)
    p.fill(50);
    p.rect(screenX - 30, screenY - 30, 60, 6);
    p.fill(255, 0, 0);
    p.rect(screenX - 30, screenY - 30, 60, 6);
    p.fill(255, 100, 0);
    p.rect(screenX - 30, screenY - 30, 60 * (this.health / this.maxHealth), 6);
    
    // Boss name
    p.fill(255);
    p.textAlign(p.CENTER);
    p.textSize(10);
    p.text(this.name, screenX, screenY - 40);
    
    p.pop();
  }
}