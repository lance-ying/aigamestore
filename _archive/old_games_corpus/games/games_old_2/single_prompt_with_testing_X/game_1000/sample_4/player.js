// player.js - Player character class
import { TILE_SIZE, GRAVITY, MAX_FALL_SPEED, BLOCK_TYPES, ITEM_TYPES } from './globals.js';

export class Player {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.width = 16;
    this.height = 30;
    this.grounded = false;
    this.health = 100;
    this.maxHealth = 100;
    this.miningPower = 1;
    this.attackDamage = 5;
    this.miningProgress = 0;
    this.targetBlock = null;
    this.facingRight = true;
    this.attackCharge = 0;
    this.maxAttackCharge = 30;
    this.inventory = {};
    this.equippedPickaxe = null;
    this.equippedSword = null;
    
    // Start with basic items
    this.addItem(ITEM_TYPES.WOOD_PICKAXE, 1);
    this.addItem(ITEM_TYPES.WOOD_SWORD, 1);
    this.equippedPickaxe = ITEM_TYPES.WOOD_PICKAXE;
    this.equippedSword = ITEM_TYPES.WOOD_SWORD;
  }

  addItem(item, count = 1) {
    if (!this.inventory[item]) {
      this.inventory[item] = 0;
    }
    this.inventory[item] += count;
  }

  removeItem(item, count = 1) {
    if (this.inventory[item] && this.inventory[item] >= count) {
      this.inventory[item] -= count;
      if (this.inventory[item] === 0) {
        delete this.inventory[item];
      }
      return true;
    }
    return false;
  }

  hasItem(item, count = 1) {
    return this.inventory[item] && this.inventory[item] >= count;
  }

  update(world, keys) {
    // Horizontal movement
    if (keys.left) {
      this.vx = -3;
      this.facingRight = false;
    } else if (keys.right) {
      this.vx = 3;
      this.facingRight = true;
    } else {
      this.vx *= 0.8;
    }

    // Jump
    if (keys.up && this.grounded) {
      this.vy = -10;
      this.grounded = false;
    }

    // Apply gravity
    if (!this.grounded) {
      this.vy += GRAVITY;
      if (this.vy > MAX_FALL_SPEED) {
        this.vy = MAX_FALL_SPEED;
      }
    }

    // Move horizontally with collision
    this.x += this.vx;
    this.resolveCollisionX(world);

    // Move vertically with collision
    this.y += this.vy;
    this.resolveCollisionY(world);

    // Mining/attacking
    if (keys.attack) {
      this.attackCharge = Math.min(this.attackCharge + 1, this.maxAttackCharge);
    } else if (this.attackCharge > 0) {
      // Release attack
      this.performAttack();
      this.attackCharge = 0;
    }

    // Clamp position to world bounds
    this.x = Math.max(this.width / 2, Math.min(this.x, TILE_SIZE * 200 - this.width / 2));
  }

  performAttack() {
    const range = 60;
    const dir = this.facingRight ? 1 : -1;
    const targetX = this.x + dir * range;
    const targetY = this.y;

    // Try to mine block
    const tileX = Math.floor(targetX / TILE_SIZE);
    const tileY = Math.floor(targetY / TILE_SIZE);

    return { x: targetX, y: targetY, tileX, tileY, charge: this.attackCharge };
  }

  resolveCollisionX(world) {
    const left = Math.floor((this.x - this.width / 2) / TILE_SIZE);
    const right = Math.floor((this.x + this.width / 2) / TILE_SIZE);
    const top = Math.floor((this.y - this.height / 2) / TILE_SIZE);
    const bottom = Math.floor((this.y + this.height / 2) / TILE_SIZE);

    for (let y = top; y <= bottom; y++) {
      if (world.isBlockSolid(left, y)) {
        this.x = (left + 1) * TILE_SIZE + this.width / 2;
        this.vx = 0;
      }
      if (world.isBlockSolid(right, y)) {
        this.x = right * TILE_SIZE - this.width / 2;
        this.vx = 0;
      }
    }
  }

  resolveCollisionY(world) {
    const left = Math.floor((this.x - this.width / 2) / TILE_SIZE);
    const right = Math.floor((this.x + this.width / 2) / TILE_SIZE);
    const top = Math.floor((this.y - this.height / 2) / TILE_SIZE);
    const bottom = Math.floor((this.y + this.height / 2) / TILE_SIZE);

    this.grounded = false;

    for (let x = left; x <= right; x++) {
      if (world.isBlockSolid(x, top)) {
        this.y = (top + 1) * TILE_SIZE + this.height / 2;
        this.vy = 0;
      }
      if (world.isBlockSolid(x, bottom)) {
        this.y = bottom * TILE_SIZE - this.height / 2;
        this.vy = 0;
        this.grounded = true;
      }
    }
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health < 0) this.health = 0;
  }

  heal(amount) {
    this.health += amount;
    if (this.health > this.maxHealth) this.health = this.maxHealth;
  }

  render(p, camera) {
    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;

    p.push();
    p.translate(screenX, screenY);
    
    // Draw player body
    p.fill(100, 150, 255);
    p.rect(-this.width / 2, -this.height / 2, this.width, this.height);
    
    // Draw head
    p.fill(255, 220, 180);
    p.ellipse(0, -this.height / 2 - 5, 12, 12);
    
    // Draw eyes
    p.fill(0);
    const eyeOffset = this.facingRight ? 2 : -2;
    p.ellipse(eyeOffset, -this.height / 2 - 6, 2, 2);
    
    // Draw arm (shows tool)
    p.stroke(255, 220, 180);
    p.strokeWeight(3);
    const armX = this.facingRight ? 8 : -8;
    const armY = -5;
    p.line(0, armY, armX, armY + 5);
    
    // Draw tool
    if (this.attackCharge > 0) {
      const angle = -this.attackCharge * 0.1;
      p.translate(armX, armY + 5);
      p.rotate(angle);
      p.stroke(139, 90, 43);
      p.strokeWeight(2);
      p.line(0, 0, 10, 0);
      p.fill(128);
      p.noStroke();
      p.rect(8, -2, 6, 4);
    }
    
    p.pop();
    
    // Draw health bar
    p.push();
    p.fill(255, 0, 0);
    p.rect(screenX - 15, screenY - this.height / 2 - 15, 30, 4);
    p.fill(0, 255, 0);
    p.rect(screenX - 15, screenY - this.height / 2 - 15, 30 * (this.health / this.maxHealth), 4);
    p.pop();

    // Draw charge bar
    if (this.attackCharge > 0) {
      p.push();
      p.fill(255, 255, 0, 150);
      p.rect(screenX - 15, screenY + this.height / 2 + 5, 30 * (this.attackCharge / this.maxAttackCharge), 3);
      p.pop();
    }
  }
}