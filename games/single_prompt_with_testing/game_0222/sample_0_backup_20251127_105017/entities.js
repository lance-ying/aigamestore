// entities.js - Entity classes for the game

import { 
  gameState, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT,
  PLAYER_SPEED,
  PLAYER_JUMP_POWER,
  PLAYER_DASH_POWER,
  PLAYER_DASH_COOLDOWN,
  WALL_RUN_DURATION,
  CHAINSAW_SLIDE_SPEED,
  ENEMY_SPEED,
  ENEMY_HEALTH,
  ENEMY_DAMAGE,
  BOSS_HEALTH,
  BOSS_SPEED,
  ROCKET_SPEED,
  ROCKET_DAMAGE,
  ROCKET_COOLDOWN,
  ROCKET_LIFETIME,
  CASH_PER_KILL,
  NEON_PINK,
  NEON_CYAN,
  NEON_PURPLE,
  NEON_GREEN,
  NEON_ORANGE
} from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 30;
    this.height = 40;
    this.vx = 0;
    this.vy = 0;
    
    // Player stats
    this.health = 100;
    this.maxHealth = 100;
    
    // State
    this.onGround = false;
    this.facing = 1; // 1 = right, -1 = left
    this.isSliding = false;
    this.isDashing = false;
    this.isWallRunning = false;
    this.wallRunTimer = 0;
    this.dashCooldown = 0;
    this.rocketCooldown = 0;
    
    // Wall running
    this.wallSide = 0; // -1 = left wall, 1 = right wall
    
    // Animation
    this.animFrame = 0;
    this.animTimer = 0;
    
    // Effects
    this.invulnerable = 0; // invulnerability frames
    
    gameState.player = this;
    gameState.entities.push(this);
  }
  
  update(p) {
    // Update cooldowns
    if (this.dashCooldown > 0) this.dashCooldown--;
    if (this.rocketCooldown > 0) this.rocketCooldown--;
    if (this.invulnerable > 0) this.invulnerable--;
    
    // Apply gravity
    if (!this.onGround && !this.isWallRunning) {
      this.vy += gameState.gravity;
    }
    
    // Wall running physics
    if (this.isWallRunning) {
      this.wallRunTimer--;
      this.vy = -2; // Slow fall while wall running
      
      if (this.wallRunTimer <= 0) {
        this.isWallRunning = false;
      }
    }
    
    // Apply friction
    if (this.onGround && !this.isSliding && !this.isDashing) {
      this.vx *= gameState.friction;
    }
    
    // Dash physics
    if (this.isDashing) {
      this.dashCooldown = PLAYER_DASH_COOLDOWN;
      this.isDashing = false;
    }
    
    // Sliding physics
    if (this.isSliding) {
      this.vx = this.facing * CHAINSAW_SLIDE_SPEED;
      // Create slide particles
      if (p.frameCount % 3 === 0) {
        this.createSlideParticles();
      }
    }
    
    // Update position
    this.x += this.vx;
    this.y += this.vy;
    
    // Check collisions
    this.checkGroundCollision();
    this.checkWallCollision();
    
    // Animation
    this.animTimer++;
    if (this.animTimer >= 8) {
      this.animFrame = (this.animFrame + 1) % 4;
      this.animTimer = 0;
    }
    
    // Clamp to bounds
    this.y = Math.min(this.y, CANVAS_HEIGHT - 30);
  }
  
  checkGroundCollision() {
    const groundY = CANVAS_HEIGHT - 50;
    if (this.y + this.height / 2 >= groundY) {
      this.y = groundY - this.height / 2;
      this.vy = 0;
      this.onGround = true;
      this.isWallRunning = false;
    } else {
      this.onGround = false;
    }
  }
  
  checkWallCollision() {
    const margin = 10;
    
    // Left wall
    if (this.x - this.width / 2 < margin) {
      this.x = this.width / 2 + margin;
      if (!this.onGround && this.vy > 0 && Math.abs(this.vx) > 1) {
        this.startWallRun(-1);
      }
    }
    
    // Right wall
    if (this.x + this.width / 2 > CANVAS_WIDTH - margin) {
      this.x = CANVAS_WIDTH - this.width / 2 - margin;
      if (!this.onGround && this.vy > 0 && Math.abs(this.vx) > 1) {
        this.startWallRun(1);
      }
    }
  }
  
  startWallRun(side) {
    this.isWallRunning = true;
    this.wallSide = side;
    this.wallRunTimer = WALL_RUN_DURATION;
    this.vy = -2;
  }
  
  moveLeft() {
    if (!this.isSliding && !this.isDashing) {
      this.vx = -PLAYER_SPEED;
      this.facing = -1;
    }
  }
  
  moveRight() {
    if (!this.isSliding && !this.isDashing) {
      this.vx = PLAYER_SPEED;
      this.facing = 1;
    }
  }
  
  jump() {
    if (this.onGround) {
      this.vy = PLAYER_JUMP_POWER;
      this.onGround = false;
      this.isSliding = false;
    } else if (this.isWallRunning) {
      // Wall jump
      this.vy = PLAYER_JUMP_POWER * 0.8;
      this.vx = -this.wallSide * PLAYER_SPEED * 1.5;
      this.isWallRunning = false;
    }
  }
  
  dash() {
    if (this.dashCooldown <= 0) {
      this.vx = this.facing * PLAYER_DASH_POWER;
      this.isDashing = true;
      this.isSliding = false;
      this.createDashParticles();
    }
  }
  
  startSlide() {
    if (this.onGround) {
      this.isSliding = true;
      this.height = 20; // Crouch
    }
  }
  
  stopSlide() {
    this.isSliding = false;
    this.height = 40;
  }
  
  fireRocket() {
    if (this.rocketCooldown <= 0) {
      const offsetX = this.facing * 20;
      const rocket = new Rocket(this.x + offsetX, this.y, this.facing);
      this.rocketCooldown = ROCKET_COOLDOWN;
      gameState.cameraShake = 5;
    }
  }
  
  takeDamage(amount) {
    if (this.invulnerable > 0) return;
    
    this.health -= amount;
    this.invulnerable = 60; // 1 second of invulnerability
    gameState.cameraShake = 10;
    
    if (this.health <= 0) {
      this.health = 0;
      this.die();
    }
  }
  
  die() {
    gameState.gamePhase = "GAME_OVER_LOSE";
    this.createDeathParticles();
  }
  
  createSlideParticles() {
    for (let i = 0; i < 3; i++) {
      const particle = new Particle(
        this.x - this.facing * 10,
        this.y + 10,
        -this.facing * (Math.random() * 2 + 1),
        Math.random() * 2 - 4,
        NEON_CYAN,
        20
      );
      gameState.particles.push(particle);
    }
  }
  
  createDashParticles() {
    for (let i = 0; i < 5; i++) {
      const particle = new Particle(
        this.x - this.facing * 10,
        this.y,
        -this.facing * (Math.random() * 3 + 2),
        Math.random() * 4 - 2,
        NEON_PURPLE,
        15
      );
      gameState.particles.push(particle);
    }
  }
  
  createDeathParticles() {
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 3;
      const particle = new Particle(
        this.x,
        this.y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        NEON_PINK,
        40
      );
      gameState.particles.push(particle);
    }
  }
  
  render(p) {
    p.push();
    p.translate(this.x, this.y);
    
    // Flip if facing left
    if (this.facing < 0) {
      p.scale(-1, 1);
    }
    
    // Invulnerability flash
    if (this.invulnerable > 0 && p.frameCount % 6 < 3) {
      p.tint(255, 100);
    }
    
    // Body - cybernetic half
    p.fill(...NEON_CYAN);
    p.noStroke();
    p.rectMode(p.CENTER);
    p.rect(0, 0, this.width, this.height, 5);
    
    // Metallic details
    p.fill(150, 150, 200);
    p.rect(-5, -5, 8, 15);
    p.rect(5, -5, 8, 15);
    
    // Chainsaw leg indicator
    if (this.isSliding) {
      p.push();
      p.fill(...NEON_PINK);
      p.stroke(...NEON_PINK);
      p.strokeWeight(2);
      // Spinning chainsaw blade
      p.rotate(p.frameCount * 0.5);
      for (let i = 0; i < 6; i++) {
        p.rotate(Math.PI / 3);
        p.line(0, this.height / 2, 0, this.height / 2 + 10);
      }
      p.pop();
    }
    
    // Eyes - glowing
    p.fill(...NEON_GREEN);
    p.circle(-6, -8, 4);
    p.circle(6, -8, 4);
    
    // Arm rocket indicator
    p.fill(...NEON_ORANGE);
    p.rect(8, 5, 5, 3);
    
    // Wall run effect
    if (this.isWallRunning) {
      p.stroke(...NEON_PURPLE);
      p.strokeWeight(2);
      p.noFill();
      p.circle(0, 0, this.width + 10 + Math.sin(p.frameCount * 0.3) * 5);
    }
    
    p.pop();
  }
}

export class Enemy {
  constructor(x, y, isBoss = false) {
    this.x = x;
    this.y = y;
    this.isBoss = isBoss;
    
    if (isBoss) {
      this.width = 60;
      this.height = 80;
      this.health = BOSS_HEALTH;
      this.maxHealth = BOSS_HEALTH;
      this.speed = BOSS_SPEED;
      this.damage = 20;
      this.cashValue = 100;
    } else {
      this.width = 25;
      this.height = 35;
      this.health = ENEMY_HEALTH;
      this.maxHealth = ENEMY_HEALTH;
      this.speed = ENEMY_SPEED;
      this.damage = ENEMY_DAMAGE;
      this.cashValue = CASH_PER_KILL;
    }
    
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
    this.facing = 1;
    this.attackCooldown = 0;
    this.hitFlash = 0;
    this.aiState = "CHASE"; // CHASE, ATTACK
    
    gameState.enemies.push(this);
    gameState.entities.push(this);
    
    if (isBoss) {
      gameState.boss = this;
    }
  }
  
  update(p) {
    if (!gameState.player) return;
    
    // Update cooldowns
    if (this.attackCooldown > 0) this.attackCooldown--;
    if (this.hitFlash > 0) this.hitFlash--;
    
    // AI behavior
    const dx = gameState.player.x - this.x;
    const dy = gameState.player.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Move towards player
    if (distance > 40) {
      this.aiState = "CHASE";
      const angle = Math.atan2(dy, dx);
      this.vx = Math.cos(angle) * this.speed;
      this.facing = this.vx > 0 ? 1 : -1;
    } else {
      this.aiState = "ATTACK";
      this.vx *= 0.8; // Slow down when attacking
      
      if (this.attackCooldown <= 0) {
        this.attack();
        this.attackCooldown = 60;
      }
    }
    
    // Apply gravity
    if (!this.onGround) {
      this.vy += gameState.gravity;
    }
    
    // Update position
    this.x += this.vx;
    this.y += this.vy;
    
    // Ground collision
    this.checkGroundCollision();
    
    // Boss special behavior
    if (this.isBoss && p.frameCount % 120 === 0) {
      this.spawnMinion();
    }
  }
  
  checkGroundCollision() {
    const groundY = CANVAS_HEIGHT - 50;
    if (this.y + this.height / 2 >= groundY) {
      this.y = groundY - this.height / 2;
      this.vy = 0;
      this.onGround = true;
    } else {
      this.onGround = false;
    }
  }
  
  attack() {
    if (gameState.player) {
      const dx = gameState.player.x - this.x;
      const dy = gameState.player.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 50) {
        gameState.player.takeDamage(this.damage);
      }
    }
  }
  
  spawnMinion() {
    if (gameState.enemies.length < 8) {
      const side = Math.random() < 0.5 ? -1 : 1;
      new Enemy(this.x + side * 50, this.y - 50, false);
    }
  }
  
  takeDamage(amount) {
    this.health -= amount;
    this.hitFlash = 10;
    
    if (this.health <= 0) {
      this.die();
    }
  }
  
  die() {
    gameState.cash += this.cashValue;
    gameState.score += this.cashValue;
    gameState.kills++;
    gameState.enemiesKilledThisWave++;
    
    // Remove from arrays
    const enemyIndex = gameState.enemies.indexOf(this);
    if (enemyIndex > -1) {
      gameState.enemies.splice(enemyIndex, 1);
    }
    
    const entityIndex = gameState.entities.indexOf(this);
    if (entityIndex > -1) {
      gameState.entities.splice(entityIndex, 1);
    }
    
    if (this.isBoss) {
      gameState.boss = null;
      gameState.gamePhase = "GAME_OVER_WIN";
    }
    
    // Create death particles
    this.createDeathParticles();
  }
  
  createDeathParticles() {
    const count = this.isBoss ? 30 : 15;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 2;
      const particle = new Particle(
        this.x,
        this.y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        this.isBoss ? NEON_ORANGE : NEON_PINK,
        30
      );
      gameState.particles.push(particle);
    }
  }
  
  render(p) {
    p.push();
    p.translate(this.x, this.y);
    
    if (this.facing < 0) {
      p.scale(-1, 1);
    }
    
    // Hit flash effect
    if (this.hitFlash > 0) {
      p.fill(255, 255, 255);
    } else if (this.isBoss) {
      p.fill(...NEON_ORANGE);
    } else {
      p.fill(...NEON_PINK);
    }
    
    p.noStroke();
    p.rectMode(p.CENTER);
    p.rect(0, 0, this.width, this.height, 3);
    
    // Corrupted AI details
    p.fill(0);
    p.rect(-5, -8, 6, 6);
    p.rect(5, -8, 6, 6);
    
    // Glitchy effect
    if (p.frameCount % 10 < 5) {
      p.fill(...NEON_CYAN, 100);
      p.rect(Math.random() * 10 - 5, Math.random() * 10 - 5, 15, 3);
    }
    
    // Boss crown
    if (this.isBoss) {
      p.fill(...NEON_ORANGE);
      p.triangle(-10, -this.height/2 - 5, 0, -this.height/2 - 15, 10, -this.height/2 - 5);
    }
    
    // Health bar
    if (this.health < this.maxHealth) {
      const barWidth = this.width;
      const barHeight = 4;
      const healthRatio = this.health / this.maxHealth;
      
      p.fill(100, 0, 0);
      p.rectMode(p.CENTER);
      p.rect(0, -this.height/2 - 10, barWidth, barHeight);
      
      p.fill(0, 255, 0);
      p.rectMode(p.CORNER);
      p.rect(-barWidth/2, -this.height/2 - 10 - barHeight/2, barWidth * healthRatio, barHeight);
    }
    
    p.pop();
  }
}

export class Rocket {
  constructor(x, y, direction) {
    this.x = x;
    this.y = y;
    this.vx = direction * ROCKET_SPEED;
    this.vy = 0;
    this.width = 15;
    this.height = 6;
    this.damage = ROCKET_DAMAGE;
    this.lifetime = ROCKET_LIFETIME;
    this.age = 0;
    this.direction = direction;
    this.trailParticles = [];
    
    gameState.projectiles.push(this);
    gameState.entities.push(this);
  }
  
  update(p) {
    this.age++;
    
    // Update position
    this.x += this.vx;
    this.y += this.vy;
    
    // Create trail
    if (p.frameCount % 2 === 0) {
      const particle = new Particle(
        this.x - this.vx,
        this.y,
        0,
        0,
        NEON_ORANGE,
        10
      );
      gameState.particles.push(particle);
    }
    
    // Check bounds
    if (this.x < -20 || this.x > CANVAS_WIDTH + 20 || this.age >= this.lifetime) {
      this.destroy();
      return;
    }
    
    // Check collisions with enemies
    for (const enemy of gameState.enemies) {
      const dx = enemy.x - this.x;
      const dy = enemy.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < enemy.width / 2 + this.width / 2) {
        enemy.takeDamage(this.damage);
        this.explode();
        return;
      }
    }
  }
  
  explode() {
    // Create explosion particles
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 2;
      const particle = new Particle(
        this.x,
        this.y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        NEON_ORANGE,
        20
      );
      gameState.particles.push(particle);
    }
    
    gameState.cameraShake = 8;
    this.destroy();
  }
  
  destroy() {
    const projIndex = gameState.projectiles.indexOf(this);
    if (projIndex > -1) {
      gameState.projectiles.splice(projIndex, 1);
    }
    
    const entityIndex = gameState.entities.indexOf(this);
    if (entityIndex > -1) {
      gameState.entities.splice(entityIndex, 1);
    }
  }
  
  render(p) {
    p.push();
    p.translate(this.x, this.y);
    
    // Rocket body
    p.fill(...NEON_ORANGE);
    p.noStroke();
    p.rectMode(p.CENTER);
    p.rect(0, 0, this.width, this.height, 2);
    
    // Rocket tip
    p.fill(255, 255, 0);
    p.triangle(
      this.direction * this.width/2, 0,
      this.direction * (this.width/2 + 5), -3,
      this.direction * (this.width/2 + 5), 3
    );
    
    // Glow effect
    p.fill(...NEON_ORANGE, 50);
    p.circle(0, 0, this.width + 10);
    
    p.pop();
  }
}

export class Particle {
  constructor(x, y, vx, vy, color, lifetime) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.lifetime = lifetime;
    this.age = 0;
    this.size = Math.random() * 4 + 2;
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.2; // Gravity
    this.age++;
  }
  
  isDead() {
    return this.age >= this.lifetime;
  }
  
  render(p) {
    const alpha = (1 - this.age / this.lifetime) * 255;
    p.fill(...this.color, alpha);
    p.noStroke();
    p.circle(this.x, this.y, this.size);
  }
}

export class BackgroundBuilding {
  constructor(x, y, width, height, depth) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.depth = depth; // 0-1, closer to 0 is further away
    this.windows = [];
    this.neonColor = Math.random() < 0.5 ? NEON_CYAN : NEON_PINK;
    
    // Generate windows
    const rows = Math.floor(height / 20);
    const cols = Math.floor(width / 15);
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        if (Math.random() < 0.7) {
          this.windows.push({
            x: j * 15 + 5,
            y: i * 20 + 5,
            lit: Math.random() < 0.8
          });
        }
      }
    }
  }
  
  render(p) {
    p.push();
    
    // Building silhouette
    const brightness = 20 + this.depth * 30;
    p.fill(brightness);
    p.noStroke();
    p.rect(this.x, this.y, this.width, this.height);
    
    // Windows
    for (const window of this.windows) {
      if (window.lit) {
        p.fill(...this.neonColor, 150 + this.depth * 100);
      } else {
        p.fill(brightness + 10);
      }
      p.rect(this.x + window.x, this.y + window.y, 8, 12);
    }
    
    // Neon edge glow
    p.stroke(...this.neonColor, 100);
    p.strokeWeight(2);
    p.noFill();
    p.rect(this.x, this.y, this.width, this.height);
    
    p.pop();
  }
}