// entities.js
import { CANVAS_WIDTH, CANVAS_HEIGHT, PLAYER_BASE_SPEED, PLAYER_BASE_HEALTH, 
         PLAYER_BASE_DAMAGE, PLAYER_ATTACK_RANGE, PLAYER_ATTACK_COOLDOWN,
         ENEMY_BASE_SPEED, ENEMY_BASE_HEALTH, ENEMY_BASE_DAMAGE,
         BOSS_HEALTH_MULTIPLIER, BOSS_DAMAGE_MULTIPLIER } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.maxHealth = PLAYER_BASE_HEALTH;
    this.health = this.maxHealth;
    this.speed = PLAYER_BASE_SPEED;
    this.damage = PLAYER_BASE_DAMAGE;
    this.attackRange = PLAYER_ATTACK_RANGE;
    this.attackCooldown = 0;
    this.maxAttackCooldown = PLAYER_ATTACK_COOLDOWN;
    this.radius = 12;
    this.invulnerable = 0;
    this.abilities = [];
    this.specialCooldown = 0;
    this.maxSpecialCooldown = 300; // 5 seconds
  }

  update(inputs) {
    // Movement
    if (inputs.up) this.y -= this.speed;
    if (inputs.down) this.y += this.speed;
    if (inputs.left) this.x -= this.speed;
    if (inputs.right) this.x += this.speed;

    // Boundary check
    this.x = Math.max(this.radius, Math.min(CANVAS_WIDTH - this.radius, this.x));
    this.y = Math.max(this.radius, Math.min(CANVAS_HEIGHT - this.radius, this.y));

    // Cooldowns
    if (this.attackCooldown > 0) this.attackCooldown--;
    if (this.invulnerable > 0) this.invulnerable--;
    if (this.specialCooldown > 0) this.specialCooldown--;
  }

  takeDamage(amount) {
    if (this.invulnerable > 0) return false;
    this.health -= amount;
    this.invulnerable = 30; // 0.5 second invulnerability
    return true;
  }

  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  canAttack() {
    return this.attackCooldown === 0;
  }

  attack() {
    this.attackCooldown = this.maxAttackCooldown;
  }

  canUseSpecial() {
    return this.specialCooldown === 0 && this.abilities.length > 0;
  }

  useSpecial() {
    this.specialCooldown = this.maxSpecialCooldown;
  }
}

export class Enemy {
  constructor(x, y, type = 'normal') {
    this.x = x;
    this.y = y;
    this.type = type;
    this.isBoss = type === 'boss';
    
    const multiplier = this.isBoss ? BOSS_HEALTH_MULTIPLIER : 1;
    this.maxHealth = ENEMY_BASE_HEALTH * multiplier;
    this.health = this.maxHealth;
    this.speed = ENEMY_BASE_SPEED * (this.isBoss ? 0.7 : 1);
    this.damage = ENEMY_BASE_DAMAGE * (this.isBoss ? BOSS_DAMAGE_MULTIPLIER : 1);
    this.radius = this.isBoss ? 25 : 10;
    this.attackCooldown = 0;
    this.maxAttackCooldown = 60;
    this.isDead = false;
    this.xpValue = this.isBoss ? 50 : 5;
    this.goldValue = this.isBoss ? 25 : 5;
  }

  update(targetX, targetY) {
    if (this.isDead) return;

    // Move toward target
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > this.radius) {
      this.x += (dx / dist) * this.speed;
      this.y += (dy / dist) * this.speed;
    }

    if (this.attackCooldown > 0) this.attackCooldown--;
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.isDead = true;
      return true;
    }
    return false;
  }

  canAttack() {
    return this.attackCooldown === 0;
  }

  attack() {
    this.attackCooldown = this.maxAttackCooldown;
  }
}

export class Projectile {
  constructor(x, y, vx, vy, damage, owner = 'player') {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.damage = damage;
    this.owner = owner;
    this.radius = 4;
    this.lifetime = 120; // 2 seconds
    this.isDead = false;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.lifetime--;

    if (this.lifetime <= 0 || 
        this.x < 0 || this.x > CANVAS_WIDTH ||
        this.y < 0 || this.y > CANVAS_HEIGHT) {
      this.isDead = true;
    }
  }
}

export class XPOrb {
  constructor(x, y, value) {
    this.x = x;
    this.y = y;
    this.value = value;
    this.radius = 6;
    this.collected = false;
    this.magnetSpeed = 0;
    this.lifetime = 600; // 10 seconds before disappearing
  }

  update(playerX, playerY, magnetRange = 80) {
    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < magnetRange) {
      this.magnetSpeed = Math.min(8, this.magnetSpeed + 0.3);
      this.x += (dx / dist) * this.magnetSpeed;
      this.y += (dy / dist) * this.magnetSpeed;
    }

    this.lifetime--;
    if (this.lifetime <= 0) {
      this.collected = true;
    }
  }
}

export class Item {
  constructor(x, y, itemData) {
    this.x = x;
    this.y = y;
    this.itemData = itemData;
    this.radius = 8;
    this.collected = false;
    this.bobOffset = Math.random() * Math.PI * 2;
  }

  update(time) {
    // Bobbing animation
    this.displayY = this.y + Math.sin(time * 0.05 + this.bobOffset) * 3;
  }
}

export class Particle {
  constructor(x, y, vx, vy, color, lifetime = 30) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.lifetime = lifetime;
    this.maxLifetime = lifetime;
    this.isDead = false;
    this.radius = 3;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.95;
    this.vy *= 0.95;
    this.lifetime--;
    if (this.lifetime <= 0) {
      this.isDead = true;
    }
  }

  getAlpha() {
    return this.lifetime / this.maxLifetime;
  }
}