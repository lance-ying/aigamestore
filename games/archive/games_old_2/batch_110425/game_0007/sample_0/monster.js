// monster.js - Monster entity class

import { ENTITY_MONSTER, TILE_SIZE } from './globals.js';

export class Monster {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.width = TILE_SIZE * 0.7;
    this.height = TILE_SIZE * 0.7;
    this.speed = 1.2;
    this.gravity = 0.5;
    this.onGround = false;
    this.type = ENTITY_MONSTER;
    this.health = 30;
    this.maxHealth = 30;
    this.attackCooldown = 0;
    this.facingRight = true;
    this.animFrame = 0;
    this.active = true;
    this.targetPlayer = null;
    this.detectionRange = TILE_SIZE * 5;
  }

  update(world, player) {
    if (!this.active) return;

    // Simple AI: move towards player if in range
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < this.detectionRange) {
      this.vx = dx > 0 ? this.speed : -this.speed;
      this.facingRight = dx > 0;
    } else {
      this.vx = 0;
    }

    // Apply gravity
    this.vy += this.gravity;
    if (this.vy > 15) this.vy = 15;

    // Apply velocity
    this.x += this.vx;
    this.y += this.vy;

    // Collision detection
    this.onGround = false;
    this.handleCollisions(world);

    // Animation
    if (this.vx !== 0) {
      this.animFrame += 0.1;
    }

    // Attack player if close
    if (this.attackCooldown > 0) {
      this.attackCooldown--;
    }

    if (dist < TILE_SIZE * 1.5 && this.attackCooldown === 0) {
      this.attackCooldown = 60;
      player.takeDamage(10);
    }
  }

  handleCollisions(world) {
    const left = Math.floor(this.x / TILE_SIZE);
    const right = Math.floor((this.x + this.width) / TILE_SIZE);
    const top = Math.floor(this.y / TILE_SIZE);
    const bottom = Math.floor((this.y + this.height) / TILE_SIZE);

    // Check vertical collisions
    for (let x = left; x <= right; x++) {
      if (world.isSolid(x, bottom + 1)) {
        this.y = (bottom + 1) * TILE_SIZE - this.height;
        this.vy = 0;
        this.onGround = true;
      }
      if (this.vy < 0 && world.isSolid(x, top)) {
        this.y = (top + 1) * TILE_SIZE;
        this.vy = 0;
      }
    }

    // Check horizontal collisions
    for (let y = top; y <= bottom; y++) {
      if (this.vx > 0 && world.isSolid(right + 1, y)) {
        this.x = (right + 1) * TILE_SIZE - this.width;
        this.vx = -this.vx;
        this.facingRight = false;
      }
      if (this.vx < 0 && world.isSolid(left, y)) {
        this.x = (left + 1) * TILE_SIZE;
        this.vx = -this.vx;
        this.facingRight = true;
      }
    }
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.active = false;
    }
  }

  render(p, cameraX, cameraY) {
    if (!this.active) return;

    p.push();
    
    const screenX = this.x - cameraX;
    const screenY = this.y - cameraY;
    
    // Draw monster body (slime-like)
    p.fill(150, 50, 150);
    const bounce = Math.abs(Math.sin(this.animFrame)) * 5;
    p.ellipse(screenX + this.width / 2, screenY + this.height / 2 + bounce, this.width, this.height - bounce);
    
    // Draw eyes
    p.fill(255, 0, 0);
    const eyeY = screenY + this.height * 0.3;
    if (this.facingRight) {
      p.ellipse(screenX + this.width * 0.4, eyeY, 6, 8);
      p.ellipse(screenX + this.width * 0.65, eyeY, 6, 8);
    } else {
      p.ellipse(screenX + this.width * 0.35, eyeY, 6, 8);
      p.ellipse(screenX + this.width * 0.6, eyeY, 6, 8);
    }
    
    // Draw health bar
    p.fill(50);
    p.rect(screenX, screenY - 8, this.width, 3);
    p.fill(255, 100, 100);
    p.rect(screenX, screenY - 8, this.width * (this.health / this.maxHealth), 3);
    
    p.pop();
  }
}