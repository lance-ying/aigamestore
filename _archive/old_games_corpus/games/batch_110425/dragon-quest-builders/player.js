// player.js - Player entity class

import { ENTITY_PLAYER, TILE_SIZE, MATERIAL_DIRT, MATERIAL_STONE, MATERIAL_WOOD } from './globals.js';

export class Player {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.width = TILE_SIZE * 0.6;
    this.height = TILE_SIZE * 0.8;
    this.speed = 2.5;
    this.gravity = 0.5;
    this.jumpPower = -10;
    this.onGround = false;
    this.type = ENTITY_PLAYER;
    this.health = 100;
    this.maxHealth = 100;
    this.attackCooldown = 0;
    this.facingRight = true;
    this.animFrame = 0;
    this.hasWeapon = false;
  }

  update(world, keys) {
    // Horizontal movement
    this.vx = 0;
    if (keys.left) {
      this.vx = -this.speed;
      this.facingRight = false;
    }
    if (keys.right) {
      this.vx = this.speed;
      this.facingRight = true;
    }

    // Apply gravity
    this.vy += this.gravity;
    if (this.vy > 15) this.vy = 15;

    // Jump
    if (keys.up && this.onGround) {
      this.vy = this.jumpPower;
      this.onGround = false;
    }

    // Apply velocity
    this.x += this.vx;
    this.y += this.vy;

    // Collision detection with world
    this.onGround = false;
    this.handleCollisions(world);

    // Update animation
    if (this.vx !== 0) {
      this.animFrame += 0.15;
    }

    // Update cooldowns
    if (this.attackCooldown > 0) {
      this.attackCooldown--;
    }

    // Keep player in bounds
    if (this.x < 0) this.x = 0;
    if (this.x + this.width > TILE_SIZE * world.blocks[0].length) {
      this.x = TILE_SIZE * world.blocks[0].length - this.width;
    }
  }

  handleCollisions(world) {
    const left = Math.floor(this.x / TILE_SIZE);
    const right = Math.floor((this.x + this.width) / TILE_SIZE);
    const top = Math.floor(this.y / TILE_SIZE);
    const bottom = Math.floor((this.y + this.height) / TILE_SIZE);

    // Check vertical collisions
    for (let x = left; x <= right; x++) {
      // Bottom collision
      if (world.isSolid(x, bottom + 1)) {
        this.y = (bottom + 1) * TILE_SIZE - this.height;
        this.vy = 0;
        this.onGround = true;
      }
      
      // Top collision
      if (this.vy < 0 && world.isSolid(x, top)) {
        this.y = (top + 1) * TILE_SIZE;
        this.vy = 0;
      }
    }

    // Check horizontal collisions
    for (let y = top; y <= bottom; y++) {
      if (this.vx > 0 && world.isSolid(right + 1, y)) {
        this.x = (right + 1) * TILE_SIZE - this.width;
        this.vx = 0;
      }
      if (this.vx < 0 && world.isSolid(left, y)) {
        this.x = (left + 1) * TILE_SIZE;
        this.vx = 0;
      }
    }
  }

  getTargetBlock(world) {
    // Get the block in front of the player
    const offsetX = this.facingRight ? 1 : -1;
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    
    const targetX = Math.floor((centerX + offsetX * TILE_SIZE) / TILE_SIZE);
    const targetY = Math.floor(centerY / TILE_SIZE);
    
    return { x: targetX, y: targetY };
  }

  canPlaceBlock(world, x, y) {
    // Can't place on self
    const playerLeft = Math.floor(this.x / TILE_SIZE);
    const playerRight = Math.floor((this.x + this.width) / TILE_SIZE);
    const playerTop = Math.floor(this.y / TILE_SIZE);
    const playerBottom = Math.floor((this.y + this.height) / TILE_SIZE);
    
    if (x >= playerLeft && x <= playerRight && y >= playerTop && y <= playerBottom) {
      return false;
    }
    
    return !world.isSolid(x, y);
  }

  attack() {
    if (this.attackCooldown > 0 || !this.hasWeapon) return false;
    this.attackCooldown = 30;
    return true;
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health < 0) this.health = 0;
  }

  render(p, cameraX, cameraY) {
    p.push();
    
    const screenX = this.x - cameraX;
    const screenY = this.y - cameraY;
    
    // Draw player body
    p.fill(100, 150, 255);
    p.rect(screenX, screenY, this.width, this.height * 0.6);
    
    // Draw player head
    p.fill(255, 200, 150);
    const headSize = this.width * 0.8;
    p.rect(screenX + this.width / 2 - headSize / 2, screenY - headSize * 0.3, headSize, headSize);
    
    // Draw eyes
    p.fill(0);
    const eyeY = screenY - headSize * 0.1;
    if (this.facingRight) {
      p.rect(screenX + this.width * 0.5, eyeY, 3, 3);
      p.rect(screenX + this.width * 0.7, eyeY, 3, 3);
    } else {
      p.rect(screenX + this.width * 0.3, eyeY, 3, 3);
      p.rect(screenX + this.width * 0.5, eyeY, 3, 3);
    }
    
    // Draw arms
    p.fill(255, 200, 150);
    const armOffset = Math.sin(this.animFrame) * 5;
    p.rect(screenX - 5, screenY + 10 + armOffset, 5, this.height * 0.4);
    p.rect(screenX + this.width, screenY + 10 - armOffset, 5, this.height * 0.4);
    
    // Draw weapon if has one
    if (this.hasWeapon) {
      p.fill(139, 69, 19);
      const weaponX = this.facingRight ? screenX + this.width : screenX - 8;
      p.rect(weaponX, screenY + 15, 8, 20);
      p.fill(192);
      p.triangle(
        weaponX + (this.facingRight ? 0 : 8), screenY + 15,
        weaponX + (this.facingRight ? 8 : 0), screenY + 15,
        weaponX + 4, screenY + 5
      );
    }
    
    // Draw health bar
    p.fill(50);
    p.rect(screenX, screenY - 10, this.width, 4);
    p.fill(255, 0, 0);
    p.rect(screenX, screenY - 10, this.width * (this.health / this.maxHealth), 4);
    
    p.pop();
  }
}