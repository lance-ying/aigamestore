// entities.js - Entity classes for player, enemies, items, etc.

import { 
  gameState, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  GROUND_Y,
  COLORS,
  PHASE_GAME_OVER_LOSE,
  ITEM_TYPES,
  getStatMultiplier
} from './globals.js';
import { createParticles } from './particles.js';

// Base entity class
export class Entity {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
    this.active = true;
  }
  
  applyGravity() {
    if (!this.onGround) {
      this.vy += gameState.gravity;
    }
  }
  
  updatePosition() {
    this.x += this.vx;
    this.y += this.vy;
  }
  
  checkGroundCollision() {
    if (this.y + this.height / 2 >= GROUND_Y) {
      this.y = GROUND_Y - this.height / 2;
      this.vy = 0;
      this.onGround = true;
    } else {
      this.onGround = false;
    }
  }
  
  checkPlatformCollision() {
    for (const platform of gameState.platforms) {
      if (this.vy >= 0) { // Only check when falling
        const wasAbove = (this.y + this.height / 2 - this.vy) <= platform.y;
        const isBelow = (this.y + this.height / 2) >= platform.y;
        const withinX = this.x + this.width / 2 > platform.x && 
                       this.x - this.width / 2 < platform.x + platform.width;
        
        if (wasAbove && isBelow && withinX && 
            this.y + this.height / 2 < platform.y + platform.height) {
          this.y = platform.y - this.height / 2;
          this.vy = 0;
          this.onGround = true;
        }
      }
    }
  }
}

// Player class
export class Player extends Entity {
  constructor(x, y) {
    super(x, y, 24, 32);
    
    // Player stats
    this.maxHealth = 100;
    this.health = this.maxHealth;
    this.baseSpeed = 4;
    this.baseJumpPower = -13;
    this.baseDamage = 10;
    this.baseFireRate = 15; // Frames between shots
    
    // Current stats (affected by items)
    this.speed = this.baseSpeed;
    this.jumpPower = this.baseJumpPower;
    this.damage = this.baseDamage;
    this.fireRate = this.baseFireRate;
    
    // State
    this.facing = 1;
    this.shootTimer = 0;
    this.dashTimer = 0;
    this.dashCooldown = 60;
    this.isDashing = false;
    this.dashDuration = 10;
    this.invincibleTimer = 0;
    
    // Animation
    this.animFrame = 0;
    this.lastPosition = { x, y };
    
    gameState.player = this;
    gameState.entities.push(this);
  }
  
  update(p) {
    if (!this.active) return;
    
    // Update stats from items
    this.updateStats();
    
    // Update timers
    if (this.shootTimer > 0) this.shootTimer--;
    if (this.dashTimer > 0) this.dashTimer--;
    if (this.invincibleTimer > 0) this.invincibleTimer--;
    
    // Dash mechanics
    if (this.isDashing) {
      this.dashDuration--;
      if (this.dashDuration <= 0) {
        this.isDashing = false;
        this.vx *= 0.5; // Slow down after dash
      }
    }
    
    // Apply physics
    if (!this.isDashing) {
      this.vx *= 0.85; // Friction
      this.applyGravity();
    }
    
    this.updatePosition();
    this.checkGroundCollision();
    this.checkPlatformCollision();
    
    // Keep in bounds
    if (this.x < this.width / 2) {
      this.x = this.width / 2;
      this.vx = 0;
    }
    if (this.x > CANVAS_WIDTH - this.width / 2) {
      this.x = CANVAS_WIDTH - this.width / 2;
      this.vx = 0;
    }
    
    // Animation
    if (Math.abs(this.vx) > 0.5) {
      this.animFrame += 0.2;
    }
    
    // Log position if moved significantly
    if (Math.abs(this.x - this.lastPosition.x) > 5 || 
        Math.abs(this.y - this.lastPosition.y) > 5) {
      this.logPosition(p);
      this.lastPosition = { x: this.x, y: this.y };
    }
  }
  
  updateStats() {
    const damageMultiplier = getStatMultiplier('DAMAGE');
    const speedMultiplier = getStatMultiplier('SPEED');
    const healthMultiplier = getStatMultiplier('HEALTH');
    const fireRateMultiplier = getStatMultiplier('FIRE_RATE');
    const jumpMultiplier = getStatMultiplier('JUMP');
    
    this.damage = this.baseDamage * damageMultiplier;
    this.speed = this.baseSpeed * speedMultiplier;
    this.maxHealth = Math.floor(100 * healthMultiplier);
    this.fireRate = Math.max(5, Math.floor(this.baseFireRate / fireRateMultiplier));
    this.jumpPower = this.baseJumpPower * jumpMultiplier;
  }
  
  moveLeft() {
    if (!this.isDashing) {
      this.vx = -this.speed;
      this.facing = -1;
    }
  }
  
  moveRight() {
    if (!this.isDashing) {
      this.vx = this.speed;
      this.facing = 1;
    }
  }
  
  jump() {
    if (this.onGround && !this.isDashing) {
      this.vy = this.jumpPower;
      this.onGround = false;
    }
  }
  
  shoot() {
    if (this.shootTimer <= 0) {
      const projectile = new Projectile(
        this.x + (this.facing * 15),
        this.y,
        this.facing * 8,
        0,
        this.damage,
        true
      );
      gameState.projectiles.push(projectile);
      gameState.entities.push(projectile);
      this.shootTimer = this.fireRate;
      
      // Particle effect
      createParticles(this.x + (this.facing * 15), this.y, 3, COLORS.projectile);
    }
  }
  
  dash() {
    if (this.dashTimer <= 0 && !this.isDashing) {
      this.isDashing = true;
      this.dashDuration = 10;
      this.dashTimer = this.dashCooldown;
      this.vx = this.facing * 12;
      this.invincibleTimer = 10;
      
      // Particle trail
      createParticles(this.x, this.y, 8, COLORS.player);
    }
  }
  
  takeDamage(amount) {
    if (this.invincibleTimer > 0) return;
    
    this.health -= amount;
    this.invincibleTimer = 30;
    
    // Knockback
    this.vy = -5;
    
    // Damage particles
    createParticles(this.x, this.y, 10, [255, 100, 100]);
    
    if (this.health <= 0) {
      this.health = 0;
      this.die();
    }
  }
  
  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
    createParticles(this.x, this.y, 8, COLORS.health);
  }
  
  die() {
    this.active = false;
    gameState.gamePhase = PHASE_GAME_OVER_LOSE;
    createParticles(this.x, this.y, 30, COLORS.player);
  }
  
  logPosition(p) {
    if (p.logs && p.logs.player_info) {
      p.logs.player_info.push({
        screen_x: this.x,
        screen_y: this.y,
        game_x: this.x,
        game_y: this.y,
        health: this.health,
        framecount: gameState.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  render(p) {
    if (!this.active) return;
    
    // Flicker when invincible
    if (this.invincibleTimer > 0 && this.invincibleTimer % 6 < 3) {
      return;
    }
    
    p.push();
    p.translate(this.x, this.y);
    
    // Flip if facing left
    if (this.facing < 0) {
      p.scale(-1, 1);
    }
    
    // Body
    p.fill(...COLORS.player);
    p.noStroke();
    p.rectMode(p.CENTER);
    p.rect(0, 0, this.width, this.height, 4);
    
    // Head
    p.circle(0, -this.height / 2 - 6, 12);
    
    // Visor
    p.fill(100, 200, 255);
    p.rect(2, -this.height / 2 - 6, 8, 4);
    
    // Gun
    p.fill(80, 80, 100);
    p.rect(8, 0, 10, 4);
    
    // Legs animation
    const legOffset = Math.sin(this.animFrame) * 3;
    p.fill(...COLORS.player);
    p.rect(-4, this.height / 2 + 4, 6, 8);
    p.rect(4, this.height / 2 + 4 + legOffset, 6, 8);
    
    p.pop();
  }
}

// Enemy class
export class Enemy extends Entity {
  constructor(x, y, type = 'normal') {
    super(x, y, 20, 20);
    
    this.type = type;
    this.maxHealth = 30 * gameState.difficulty;
    this.health = this.maxHealth;
    this.damage = 10 * gameState.difficulty;
    this.speed = 1 + (gameState.difficulty * 0.3);
    this.attackCooldown = 60;
    this.attackTimer = 0;
    this.detectionRange = 300;
    this.attackRange = 30;
    
    gameState.enemies.push(this);
    gameState.entities.push(this);
  }
  
  update(p) {
    if (!this.active || !gameState.player) return;
    
    // Update timer
    if (this.attackTimer > 0) this.attackTimer--;
    
    // Calculate distance to player
    const dx = gameState.player.x - this.x;
    const dy = gameState.player.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // AI behavior
    if (distance < this.detectionRange) {
      // Move towards player
      const moveX = dx > 0 ? this.speed : -this.speed;
      this.vx = moveX;
      
      // Jump if player is above
      if (dy < -50 && this.onGround && Math.abs(dx) < 50) {
        this.vy = -10;
      }
      
      // Attack if in range
      if (distance < this.attackRange && this.attackTimer <= 0) {
        this.attack();
      }
    } else {
      this.vx *= 0.9;
    }
    
    // Apply physics
    this.applyGravity();
    this.updatePosition();
    this.checkGroundCollision();
    this.checkPlatformCollision();
    
    // Keep in bounds
    if (this.x < 0) this.x = 0;
    if (this.x > CANVAS_WIDTH) this.x = CANVAS_WIDTH;
  }
  
  attack() {
    if (gameState.player) {
      gameState.player.takeDamage(this.damage);
      this.attackTimer = this.attackCooldown;
    }
  }
  
  takeDamage(amount) {
    this.health -= amount;
    createParticles(this.x, this.y, 5, COLORS.enemy);
    
    if (this.health <= 0) {
      this.die();
    }
  }
  
  die() {
    this.active = false;
    gameState.score += Math.floor(10 * gameState.difficulty);
    
    // Remove from arrays
    const enemyIndex = gameState.enemies.indexOf(this);
    if (enemyIndex > -1) gameState.enemies.splice(enemyIndex, 1);
    
    const entityIndex = gameState.entities.indexOf(this);
    if (entityIndex > -1) gameState.entities.splice(entityIndex, 1);
    
    // Death particles
    createParticles(this.x, this.y, 15, COLORS.enemy);
  }
  
  render(p) {
    if (!this.active) return;
    
    p.push();
    p.translate(this.x, this.y);
    
    // Body
    p.fill(...COLORS.enemy);
    p.noStroke();
    p.rectMode(p.CENTER);
    p.rect(0, 0, this.width, this.height, 3);
    
    // Eyes
    p.fill(255, 200, 50);
    p.circle(-5, -3, 6);
    p.circle(5, -3, 6);
    p.fill(0);
    p.circle(-5, -3, 3);
    p.circle(5, -3, 3);
    
    // Health bar
    const barWidth = this.width + 4;
    const barHeight = 3;
    const healthRatio = this.health / this.maxHealth;
    
    p.fill(...COLORS.healthBg);
    p.rect(0, -this.height / 2 - 8, barWidth, barHeight);
    
    p.fill(...COLORS.health);
    p.rect(-barWidth / 2 + (barWidth * healthRatio) / 2, -this.height / 2 - 8, 
           barWidth * healthRatio, barHeight);
    
    p.pop();
  }
}

// Boss class
export class Boss extends Entity {
  constructor(x, y) {
    super(x, y, 60, 80);
    
    this.maxHealth = 500 * gameState.difficulty;
    this.health = this.maxHealth;
    this.damage = 20 * gameState.difficulty;
    this.speed = 2;
    this.attackCooldown = 90;
    this.attackTimer = 0;
    this.specialAttackTimer = 180;
    this.phase = 1;
    
    gameState.boss = this;
    gameState.entities.push(this);
  }
  
  update(p) {
    if (!this.active || !gameState.player) return;
    
    // Update timers
    if (this.attackTimer > 0) this.attackTimer--;
    if (this.specialAttackTimer > 0) this.specialAttackTimer--;
    
    // Phase transition
    if (this.health < this.maxHealth * 0.5 && this.phase === 1) {
      this.phase = 2;
      this.speed = 3;
      this.attackCooldown = 60;
      createParticles(this.x, this.y, 30, COLORS.boss);
    }
    
    // Calculate distance to player
    const dx = gameState.player.x - this.x;
    const dy = gameState.player.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // AI behavior
    const moveX = dx > 0 ? this.speed : -this.speed;
    this.vx = moveX;
    
    // Jump occasionally
    if (this.onGround && Math.random() < 0.02) {
      this.vy = -12;
    }
    
    // Basic attack
    if (this.attackTimer <= 0 && distance < 100) {
      this.basicAttack();
    }
    
    // Special attack (projectile burst)
    if (this.specialAttackTimer <= 0) {
      this.specialAttack();
    }
    
    // Apply physics
    this.applyGravity();
    this.updatePosition();
    this.checkGroundCollision();
    this.checkPlatformCollision();
    
    // Keep in bounds
    if (this.x < this.width / 2) {
      this.x = this.width / 2;
      this.vx = 0;
    }
    if (this.x > CANVAS_WIDTH - this.width / 2) {
      this.x = CANVAS_WIDTH - this.width / 2;
      this.vx = 0;
    }
  }
  
  basicAttack() {
    if (gameState.player) {
      const dx = gameState.player.x - this.x;
      const dy = gameState.player.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 80) {
        gameState.player.takeDamage(this.damage);
      }
      
      this.attackTimer = this.attackCooldown;
      createParticles(this.x, this.y - 20, 10, COLORS.boss);
    }
  }
  
  specialAttack() {
    // Fire projectiles in multiple directions
    const angles = this.phase === 1 ? 4 : 8;
    for (let i = 0; i < angles; i++) {
      const angle = (Math.PI * 2 * i) / angles;
      const vx = Math.cos(angle) * 5;
      const vy = Math.sin(angle) * 5;
      
      const projectile = new Projectile(
        this.x,
        this.y,
        vx,
        vy,
        this.damage * 0.5,
        false,
        true
      );
      gameState.projectiles.push(projectile);
      gameState.entities.push(projectile);
    }
    
    this.specialAttackTimer = this.phase === 1 ? 180 : 120;
    createParticles(this.x, this.y, 20, COLORS.boss);
  }
  
  takeDamage(amount) {
    this.health -= amount;
    createParticles(this.x, this.y, 8, COLORS.boss);
    
    if (this.health <= 0) {
      this.die();
    }
  }
  
  die() {
    this.active = false;
    gameState.score += 1000;
    gameState.boss = null;
    gameState.gamePhase = "GAME_OVER_WIN";
    
    const entityIndex = gameState.entities.indexOf(this);
    if (entityIndex > -1) gameState.entities.splice(entityIndex, 1);
    
    // Epic death particles
    createParticles(this.x, this.y, 50, COLORS.boss);
  }
  
  render(p) {
    if (!this.active) return;
    
    p.push();
    p.translate(this.x, this.y);
    
    // Pulsing effect
    const pulse = 1 + Math.sin(gameState.frameCount * 0.1) * 0.1;
    p.scale(pulse);
    
    // Body
    p.fill(...COLORS.boss);
    p.noStroke();
    p.rectMode(p.CENTER);
    p.rect(0, 0, this.width, this.height, 8);
    
    // Horns
    p.triangle(-this.width / 2, -this.height / 2, -this.width / 2 - 10, -this.height / 2 - 20, -this.width / 2 + 5, -this.height / 2);
    p.triangle(this.width / 2, -this.height / 2, this.width / 2 + 10, -this.height / 2 - 20, this.width / 2 - 5, -this.height / 2);
    
    // Eyes
    p.fill(255, 255, 100);
    p.circle(-15, -15, 12);
    p.circle(15, -15, 12);
    p.fill(255, 0, 0);
    p.circle(-15, -15, 6);
    p.circle(15, -15, 6);
    
    // Phase indicator
    if (this.phase === 2) {
      p.fill(255, 100, 255);
      p.circle(0, 10, 8);
    }
    
    p.pop();
    
    // Health bar above boss
    const barWidth = 100;
    const barHeight = 8;
    const healthRatio = this.health / this.maxHealth;
    
    p.fill(...COLORS.healthBg);
    p.rectMode(p.CENTER);
    p.rect(this.x, this.y - this.height / 2 - 20, barWidth, barHeight);
    
    p.fill(...COLORS.boss);
    p.rect(this.x - barWidth / 2 + (barWidth * healthRatio) / 2, 
           this.y - this.height / 2 - 20, 
           barWidth * healthRatio, barHeight);
    
    // Boss name
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(10);
    p.text('BOSS', this.x, this.y - this.height / 2 - 32);
  }
}

// Projectile class
export class Projectile extends Entity {
  constructor(x, y, vxOrSpeed, vyOrAngle, damage = 10, isPlayerProjectile = true, useVelocity = false) {
    super(x, y, 8, 8);
    
    if (useVelocity) {
      this.vx = vxOrSpeed;
      this.vy = vyOrAngle;
    } else {
      this.vx = vxOrSpeed;
      this.vy = vyOrAngle;
    }
    
    this.damage = damage;
    this.isPlayerProjectile = isPlayerProjectile;
    this.lifetime = 180;
    this.age = 0;
    this.gravity = false; // Projectiles don't fall
  }
  
  update(p) {
    if (!this.active) return;
    
    this.age++;
    
    // Remove if expired
    if (this.age >= this.lifetime) {
      this.destroy();
      return;
    }
    
    this.updatePosition();
    
    // Check bounds
    if (this.x < 0 || this.x > CANVAS_WIDTH || this.y < 0 || this.y > CANVAS_HEIGHT) {
      this.destroy();
      return;
    }
    
    // Check collisions
    if (this.isPlayerProjectile) {
      // Check enemy collisions
      for (const enemy of gameState.enemies) {
        if (enemy.active && this.checkCollision(enemy)) {
          // Check for critical hit
          const critChance = getStatMultiplier('CRIT');
          const isCrit = Math.random() < critChance;
          const finalDamage = isCrit ? this.damage * 2 : this.damage;
          
          enemy.takeDamage(finalDamage);
          this.destroy();
          return;
        }
      }
      
      // Check boss collision
      if (gameState.boss && gameState.boss.active && this.checkCollision(gameState.boss)) {
        const critChance = getStatMultiplier('CRIT');
        const isCrit = Math.random() < critChance;
        const finalDamage = isCrit ? this.damage * 2 : this.damage;
        
        gameState.boss.takeDamage(finalDamage);
        this.destroy();
        return;
      }
    } else {
      // Check player collision
      if (gameState.player && gameState.player.active && this.checkCollision(gameState.player)) {
        gameState.player.takeDamage(this.damage);
        this.destroy();
        return;
      }
    }
  }
  
  checkCollision(entity) {
    const dx = entity.x - this.x;
    const dy = entity.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < (this.width + entity.width) / 2;
  }
  
  destroy() {
    this.active = false;
    
    const projectileIndex = gameState.projectiles.indexOf(this);
    if (projectileIndex > -1) gameState.projectiles.splice(projectileIndex, 1);
    
    const entityIndex = gameState.entities.indexOf(this);
    if (entityIndex > -1) gameState.entities.splice(entityIndex, 1);
  }
  
  render(p) {
    if (!this.active) return;
    
    const alpha = 1 - (this.age / this.lifetime);
    
    p.push();
    p.fill(...(this.isPlayerProjectile ? COLORS.projectile : COLORS.enemy), alpha * 255);
    p.noStroke();
    p.circle(this.x, this.y, this.width);
    
    // Trail effect
    p.fill(...(this.isPlayerProjectile ? COLORS.projectile : COLORS.enemy), alpha * 100);
    p.circle(this.x - this.vx, this.y - this.vy, this.width * 0.6);
    
    p.pop();
  }
}

// Item class
export class Item extends Entity {
  constructor(x, y, itemType) {
    super(x, y, 20, 20);
    
    this.itemType = itemType;
    this.itemData = ITEM_TYPES[itemType];
    this.rotation = 0;
    this.bobOffset = 0;
    this.bobSpeed = 0.05;
    this.initialY = y;
    this.collected = false;
    
    gameState.items.push(this);
    gameState.entities.push(this);
  }
  
  update(p) {
    if (!this.active || this.collected) return;
    
    // Bob animation
    this.bobOffset = Math.sin(gameState.frameCount * this.bobSpeed) * 5;
    this.y = this.initialY + this.bobOffset;
    this.rotation += 0.03;
    
    // Check collision with player
    if (gameState.player) {
      const dx = gameState.player.x - this.x;
      const dy = gameState.player.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < this.width + gameState.player.width / 2) {
        this.collect();
      }
    }
  }
  
  collect() {
    if (this.collected) return;
    
    this.collected = true;
    this.active = false;
    
    // Add to inventory
    gameState.itemCounts[this.itemType]++;
    
    // Special effects
    if (this.itemType === 'HEALTH') {
      if (gameState.player) {
        gameState.player.heal(50);
      }
    }
    
    // Score bonus
    gameState.score += 50;
    
    // Remove from arrays
    const itemIndex = gameState.items.indexOf(this);
    if (itemIndex > -1) gameState.items.splice(itemIndex, 1);
    
    const entityIndex = gameState.entities.indexOf(this);
    if (entityIndex > -1) gameState.entities.splice(entityIndex, 1);
    
    // Particle effect
    createParticles(this.x, this.y, 15, this.itemData.color);
  }
  
  render(p) {
    if (!this.active || this.collected) return;
    
    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.rotation);
    
    // Outer glow
    p.fill(...this.itemData.color, 100);
    p.noStroke();
    p.circle(0, 0, this.width * 1.5);
    
    // Item body
    p.fill(...this.itemData.color);
    p.rect(-this.width / 2, -this.height / 2, this.width, this.height, 4);
    
    // Symbol (simple geometric shape based on type)
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(12);
    
    const symbol = {
      DAMAGE: '↑',
      SPEED: '»',
      HEALTH: '♥',
      FIRE_RATE: '••',
      CRIT: '★',
      JUMP: '⇧'
    }[this.itemType] || '?';
    
    p.text(symbol, 0, 0);
    
    p.pop();
  }
}

// Teleporter class
export class Teleporter extends Entity {
  constructor(x, y) {
    super(x, y, 40, 60);
    
    this.activated = false;
    this.animFrame = 0;
    
    gameState.teleporter = this;
  }
  
  update(p) {
    if (!this.active) return;
    
    this.animFrame += 0.1;
    
    // Check if player is near
    if (gameState.player && !this.activated) {
      const dx = gameState.player.x - this.x;
      const dy = gameState.player.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 50) {
        this.activate();
      }
    }
  }
  
  activate() {
    if (this.activated) return;
    
    this.activated = true;
    gameState.teleporterActivated = true;
    
    // Spawn boss
    const bossX = CANVAS_WIDTH / 2;
    const bossY = 100;
    const boss = new Boss(bossX, bossY);
    
    // Particle effect
    createParticles(this.x, this.y, 40, COLORS.teleporter);
  }
  
  render(p) {
    if (!this.active) return;
    
    p.push();
    p.translate(this.x, this.y);
    
    // Base
    p.fill(80, 80, 100);
    p.rectMode(p.CENTER);
    p.rect(0, this.height / 2, this.width + 10, 10);
    
    // Pillar
    const pillarColor = this.activated ? COLORS.boss : COLORS.teleporter;
    p.fill(...pillarColor);
    p.rect(0, 0, this.width, this.height, 4);
    
    // Energy rings
    for (let i = 0; i < 3; i++) {
      const offset = ((this.animFrame + i * 0.3) % 1) * this.height;
      const alpha = 1 - ((this.animFrame + i * 0.3) % 1);
      p.noFill();
      p.stroke(...pillarColor, alpha * 200);
      p.strokeWeight(2);
      p.ellipse(0, -this.height / 2 + offset, this.width + 10, 10);
    }
    
    p.pop();
    
    // Draw activation prompt
    if (!this.activated && gameState.player) {
      const dx = gameState.player.x - this.x;
      const dy = gameState.player.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 80) {
        p.fill(255);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(12);
        p.text('Approach to activate', this.x, this.y - this.height / 2 - 20);
      }
    }
  }
}

// Platform class
export class Platform {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    
    gameState.platforms.push(this);
  }
  
  render(p) {
    p.fill(...COLORS.platform);
    p.noStroke();
    p.rect(this.x, this.y, this.width, this.height, 2);
    
    // Top highlight
    p.fill(80, 80, 100);
    p.rect(this.x, this.y, this.width, 3);
  }
}