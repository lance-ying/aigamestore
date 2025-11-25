// entities.js - Game entity classes

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './globals.js';
import { applyGravity, applyFriction, checkPlatformCollision, checkCircleCollision } from './physics.js';
import { createSoulParticles, createDeathParticles, createSlashParticles, createDashParticles } from './particles.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 20;
    this.height = 28;
    this.radius = 14;
    
    // Physics
    this.vx = 0;
    this.vy = 0;
    this.speed = 3.5;
    this.jumpPower = -10;
    this.onGround = false;
    this.canDoubleJump = false;
    this.hasDoubleJumped = false;
    
    // Combat
    this.health = 5;
    this.maxHealth = 5;
    this.isAttacking = false;
    this.attackTimer = 0;
    this.attackDuration = 15;
    this.attackRange = 35;
    this.attackDamage = 1;
    this.isInvulnerable = false;
    this.invulnerabilityTimer = 0;
    this.invulnerabilityDuration = 60;
    
    // Dash
    this.canDash = true;
    this.isDashing = false;
    this.dashTimer = 0;
    this.dashDuration = 12;
    this.dashCooldown = 0;
    this.dashCooldownDuration = 30;
    this.dashSpeed = 12;
    
    // Special attacks
    this.isDownSlashing = false;
    this.downSlashVelocity = 15;
    
    // State
    this.facing = 1; // 1 = right, -1 = left
    this.animFrame = 0;
    this.animTimer = 0;
    this.lastPosition = { x: x, y: y };
  }
  
  update(p) {
    // Update timers
    if (this.attackTimer > 0) {
      this.attackTimer--;
      if (this.attackTimer === 0) {
        this.isAttacking = false;
      }
    }
    
    if (this.invulnerabilityTimer > 0) {
      this.invulnerabilityTimer--;
      if (this.invulnerabilityTimer === 0) {
        this.isInvulnerable = false;
      }
    }
    
    if (this.dashCooldown > 0) {
      this.dashCooldown--;
      if (this.dashCooldown === 0) {
        this.canDash = true;
      }
    }
    
    if (this.isDashing) {
      this.dashTimer--;
      if (this.dashTimer <= 0) {
        this.isDashing = false;
        this.vx *= 0.3;
      }
      // Dash particles
      if (gameState.frameCount % 2 === 0) {
        const dashParticles = createDashParticles(this.x - this.facing * 10, this.y);
        gameState.particles.push(...dashParticles);
      }
    }
    
    // Apply physics
    if (!this.isDashing) {
      applyGravity(this);
      applyFriction(this);
    }
    
    // Update position
    this.x += this.vx;
    this.y += this.vy;
    
    // Ground collision
    this.checkGroundCollision();
    
    // Platform collision
    this.checkPlatformCollisions();
    
    // World bounds
    this.checkWorldBounds();
    
    // Update animation
    this.updateAnimation();
    
    // Check death
    if (this.health <= 0) {
      this.die(p);
    }
    
    // Log position changes
    if (Math.abs(this.x - this.lastPosition.x) > 2 || 
        Math.abs(this.y - this.lastPosition.y) > 2) {
      this.logPosition(p);
      this.lastPosition.x = this.x;
      this.lastPosition.y = this.y;
    }
  }
  
  checkGroundCollision() {
    const groundY = gameState.worldHeight - 30;
    if (this.y + this.height / 2 >= groundY) {
      this.y = groundY - this.height / 2;
      this.vy = 0;
      this.onGround = true;
      this.canDoubleJump = true;
      this.hasDoubleJumped = false;
      this.isDownSlashing = false;
    } else {
      this.onGround = false;
    }
  }
  
  checkPlatformCollisions() {
    for (const platform of gameState.platforms) {
      if (checkPlatformCollision(this, platform)) {
        this.y = platform.y - this.height / 2;
        this.vy = 0;
        this.onGround = true;
        this.canDoubleJump = true;
        this.hasDoubleJumped = false;
        this.isDownSlashing = false;
        break;
      }
    }
  }
  
  checkWorldBounds() {
    if (this.x - this.width / 2 < 0) {
      this.x = this.width / 2;
      this.vx = 0;
    }
    if (this.x + this.width / 2 > gameState.worldWidth) {
      this.x = gameState.worldWidth - this.width / 2;
      this.vx = 0;
    }
    
    // Fall death
    if (this.y > gameState.worldHeight + 100) {
      this.health = 0;
    }
  }
  
  updateAnimation() {
    this.animTimer++;
    if (this.animTimer >= 8) {
      this.animFrame = (this.animFrame + 1) % 4;
      this.animTimer = 0;
    }
  }
  
  moveLeft() {
    if (!this.isDashing && !this.isAttacking) {
      this.vx = -this.speed;
      this.facing = -1;
    }
  }
  
  moveRight() {
    if (!this.isDashing && !this.isAttacking) {
      this.vx = this.speed;
      this.facing = 1;
    }
  }
  
  jump() {
    if (this.onGround) {
      this.vy = this.jumpPower;
      this.onGround = false;
      this.canDoubleJump = true;
    } else if (this.canDoubleJump && !this.hasDoubleJumped) {
      this.vy = this.jumpPower * 0.9;
      this.hasDoubleJumped = true;
      this.canDoubleJump = false;
      // Double jump particles
      const particles = createDashParticles(this.x, this.y + 10);
      gameState.particles.push(...particles);
    }
  }
  
  attack(isDownAttack = false) {
    if (this.isAttacking || this.isDashing) return;
    
    if (isDownAttack && !this.onGround) {
      this.isDownSlashing = true;
      this.vy = this.downSlashVelocity;
      this.isAttacking = true;
      this.attackTimer = this.attackDuration;
    } else {
      this.isAttacking = true;
      this.attackTimer = this.attackDuration;
      
      // Slash particles
      const slashParticles = createSlashParticles(
        this.x + this.facing * 20,
        this.y,
        this.facing
      );
      gameState.particles.push(...slashParticles);
    }
    
    // Check for enemy hits
    this.checkAttackHits();
  }
  
  checkAttackHits() {
    for (const enemy of gameState.enemies) {
      const dx = enemy.x - this.x;
      const dy = enemy.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < this.attackRange + enemy.radius) {
        // Check if attack is in the right direction
        if ((this.isDownSlashing && dy > 0) || 
            (!this.isDownSlashing && Math.sign(dx) === this.facing)) {
          enemy.takeDamage(this.attackDamage, this);
          
          // Bounce on down slash
          if (this.isDownSlashing) {
            this.vy = -8;
            this.isDownSlashing = false;
          }
        }
      }
    }
  }
  
  dash() {
    if (this.canDash && !this.isDashing && !this.isAttacking) {
      this.isDashing = true;
      this.dashTimer = this.dashDuration;
      this.canDash = false;
      this.dashCooldown = this.dashCooldownDuration;
      this.vx = this.dashSpeed * this.facing;
      this.isInvulnerable = true;
      this.invulnerabilityTimer = this.dashDuration;
    }
  }
  
  takeDamage(amount) {
    if (this.isInvulnerable) return;
    
    this.health -= amount;
    this.isInvulnerable = true;
    this.invulnerabilityTimer = this.invulnerabilityDuration;
    
    // Knockback
    this.vx = -this.facing * 5;
    this.vy = -3;
    
    if (this.health <= 0) {
      this.health = 0;
    }
  }
  
  collectSoul(amount) {
    gameState.soul = Math.min(gameState.maxSoul, gameState.soul + amount);
    gameState.score += amount;
  }
  
  heal() {
    if (gameState.soul >= 33 && this.health < this.maxHealth) {
      this.health = Math.min(this.maxHealth, this.health + 1);
      gameState.soul -= 33;
      // Heal particles
      const healParticles = createSoulParticles(this.x, this.y, 12);
      gameState.particles.push(...healParticles);
    }
  }
  
  die(p) {
    gameState.gamePhase = "GAME_OVER_LOSE";
    const deathParticles = createDeathParticles(this.x, this.y, 20);
    gameState.particles.push(...deathParticles);
    
    p.logs.game_info.push({
      data: { event: "player_death", gamePhase: "GAME_OVER_LOSE" },
      framecount: gameState.frameCount,
      timestamp: Date.now()
    });
  }
  
  logPosition(p) {
    if (p.logs && p.logs.player_info) {
      p.logs.player_info.push({
        screen_x: this.x - gameState.cameraX,
        screen_y: this.y - gameState.cameraY,
        game_x: this.x,
        game_y: this.y,
        health: this.health,
        soul: gameState.soul,
        framecount: gameState.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  render(p) {
    const screenX = this.x - gameState.cameraX;
    const screenY = this.y - gameState.cameraY;
    
    p.push();
    p.translate(screenX, screenY);
    
    // Flip if facing left
    if (this.facing < 0) {
      p.scale(-1, 1);
    }
    
    // Invulnerability flicker
    if (this.isInvulnerable && gameState.frameCount % 6 < 3) {
      p.pop();
      return;
    }
    
    // Body
    p.fill(...COLORS.player);
    p.noStroke();
    
    // Head
    p.circle(0, -8, 16);
    
    // Horns
    p.push();
    p.fill(200, 200, 210);
    p.triangle(-6, -14, -8, -18, -4, -16);
    p.triangle(6, -14, 8, -18, 4, -16);
    p.pop();
    
    // Body
    p.fill(...COLORS.player);
    p.ellipse(0, 4, 14, 18);
    
    // Cloak
    p.fill(40, 40, 60);
    p.arc(0, 4, 18, 20, 0, Math.PI);
    
    // Eyes
    p.fill(20, 20, 30);
    p.circle(-4, -8, 4);
    p.circle(4, -8, 4);
    
    // Attack effect
    if (this.isAttacking) {
      p.push();
      p.stroke(180, 220, 255, 150);
      p.strokeWeight(3);
      p.noFill();
      if (this.isDownSlashing) {
        p.arc(0, 12, 30, 30, 0, Math.PI);
      } else {
        const attackProgress = 1 - (this.attackTimer / this.attackDuration);
        const angle = attackProgress * Math.PI * 0.8 - Math.PI * 0.4;
        p.line(0, 0, Math.cos(angle) * 25, Math.sin(angle) * 25);
      }
      p.pop();
    }
    
    p.pop();
  }
}

export class Enemy {
  constructor(x, y, type = 'crawler') {
    this.x = x;
    this.y = y;
    this.type = type;
    this.width = 24;
    this.height = 24;
    this.radius = 12;
    
    // Physics
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
    
    // Combat
    this.health = 2;
    this.maxHealth = 2;
    this.damage = 1;
    this.attackRange = 25;
    this.detectionRange = 180;
    
    // AI
    this.aiTimer = 0;
    this.aiState = 'patrol';
    this.patrolDirection = Math.random() > 0.5 ? 1 : -1;
    this.speed = 1.5;
    
    // Animation
    this.animFrame = 0;
    this.animTimer = 0;
    
    gameState.enemies.push(this);
    gameState.entities.push(this);
  }
  
  update(p) {
    // Apply physics
    applyGravity(this);
    this.vx *= 0.9;
    
    // Update position
    this.x += this.vx;
    this.y += this.vy;
    
    // Ground collision
    this.checkGroundCollision();
    this.checkPlatformCollisions();
    
    // AI behavior
    this.updateAI();
    
    // Check collision with player
    if (gameState.player && !gameState.player.isInvulnerable) {
      const dx = gameState.player.x - this.x;
      const dy = gameState.player.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < this.radius + gameState.player.radius) {
        gameState.player.takeDamage(this.damage);
      }
    }
    
    // Animation
    this.animTimer++;
    if (this.animTimer >= 10) {
      this.animFrame = (this.animFrame + 1) % 2;
      this.animTimer = 0;
    }
  }
  
  checkGroundCollision() {
    const groundY = gameState.worldHeight - 30;
    if (this.y + this.height / 2 >= groundY) {
      this.y = groundY - this.height / 2;
      this.vy = 0;
      this.onGround = true;
    } else {
      this.onGround = false;
    }
  }
  
  checkPlatformCollisions() {
    for (const platform of gameState.platforms) {
      if (checkPlatformCollision(this, platform)) {
        this.y = platform.y - this.height / 2;
        this.vy = 0;
        this.onGround = true;
        break;
      }
    }
  }
  
  updateAI() {
    if (!gameState.player) return;
    
    const dx = gameState.player.x - this.x;
    const dy = gameState.player.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < this.detectionRange) {
      // Chase player
      this.aiState = 'chase';
      if (Math.abs(dx) > 10) {
        this.vx = Math.sign(dx) * this.speed;
      }
    } else {
      // Patrol
      this.aiState = 'patrol';
      this.vx = this.patrolDirection * this.speed * 0.5;
      
      this.aiTimer++;
      if (this.aiTimer >= 120) {
        this.patrolDirection *= -1;
        this.aiTimer = 0;
      }
    }
  }
  
  takeDamage(amount, attacker) {
    this.health -= amount;
    
    // Knockback
    const dx = this.x - attacker.x;
    const knockback = Math.sign(dx) * 4;
    this.vx = knockback;
    this.vy = -2;
    
    if (this.health <= 0) {
      this.die();
    }
  }
  
  die() {
    // Drop soul
    const soulOrb = new SoulOrb(this.x, this.y, 10);
    gameState.collectibles.push(soulOrb);
    
    // Death particles
    const deathParticles = createDeathParticles(this.x, this.y, 10);
    gameState.particles.push(...deathParticles);
    
    // Remove from arrays
    const enemyIndex = gameState.enemies.indexOf(this);
    if (enemyIndex > -1) {
      gameState.enemies.splice(enemyIndex, 1);
    }
    
    const entityIndex = gameState.entities.indexOf(this);
    if (entityIndex > -1) {
      gameState.entities.splice(entityIndex, 1);
    }
    
    gameState.enemiesDefeated++;
    gameState.score += 50;
  }
  
  render(p) {
    const screenX = this.x - gameState.cameraX;
    const screenY = this.y - gameState.cameraY;
    
    p.push();
    p.translate(screenX, screenY);
    
    // Body
    p.fill(...COLORS.enemy);
    p.noStroke();
    
    if (this.type === 'crawler') {
      // Crawler enemy
      p.ellipse(0, 0, this.width, this.height);
      
      // Eyes
      p.fill(255, 100, 100);
      p.circle(-6, -3, 6);
      p.circle(6, -3, 6);
      
      // Legs (animated)
      p.stroke(...COLORS.enemy);
      p.strokeWeight(2);
      const legOffset = this.animFrame === 0 ? -3 : 3;
      p.line(-8, 8, -8 + legOffset, 14);
      p.line(8, 8, 8 - legOffset, 14);
    }
    
    // Health bar
    if (this.health < this.maxHealth) {
      p.fill(100, 0, 0);
      p.rect(-10, -18, 20, 3);
      p.fill(220, 50, 50);
      p.rect(-10, -18, 20 * (this.health / this.maxHealth), 3);
    }
    
    p.pop();
  }
}

export class Platform {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    
    gameState.platforms.push(this);
  }
  
  render(p) {
    const screenX = this.x - gameState.cameraX;
    const screenY = this.y - gameState.cameraY;
    
    p.push();
    p.fill(...COLORS.platform);
    p.stroke(60, 60, 70);
    p.strokeWeight(2);
    p.rect(screenX, screenY, this.width, this.height);
    
    // Add some texture
    p.noStroke();
    p.fill(50, 50, 60);
    for (let i = 0; i < this.width; i += 20) {
      p.rect(screenX + i, screenY, 2, this.height);
    }
    
    p.pop();
  }
}

export class SoulOrb {
  constructor(x, y, value) {
    this.x = x;
    this.y = y;
    this.radius = 8;
    this.value = value;
    this.rotation = 0;
    this.rotationSpeed = 0.08;
    this.bobOffset = 0;
    this.bobSpeed = 0.05;
    this.initialY = y;
    
    // Movement towards player
    this.attractSpeed = 0.15;
    this.attractRange = 100;
  }
  
  update(p) {
    // Rotation and bobbing
    this.rotation += this.rotationSpeed;
    this.bobOffset = Math.sin(gameState.frameCount * this.bobSpeed) * 3;
    this.y = this.initialY + this.bobOffset;
    
    // Attract to player
    if (gameState.player) {
      const dx = gameState.player.x - this.x;
      const dy = gameState.player.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < this.attractRange) {
        this.x += dx * this.attractSpeed;
        this.y += dy * this.attractSpeed;
      }
      
      // Collect
      if (distance < this.radius + gameState.player.radius) {
        this.collect();
      }
    }
  }
  
  collect() {
    if (gameState.player) {
      gameState.player.collectSoul(this.value);
    }
    
    // Soul particles
    const soulParticles = createSoulParticles(this.x, this.y, 6);
    gameState.particles.push(...soulParticles);
    
    // Remove from array
    const index = gameState.collectibles.indexOf(this);
    if (index > -1) {
      gameState.collectibles.splice(index, 1);
    }
  }
  
  render(p) {
    const screenX = this.x - gameState.cameraX;
    const screenY = this.y - gameState.cameraY;
    
    p.push();
    p.translate(screenX, screenY);
    p.rotate(this.rotation);
    
    // Glow
    p.noStroke();
    p.fill(150, 200, 255, 80);
    p.circle(0, 0, this.radius * 3);
    
    // Core
    p.fill(...COLORS.soul);
    p.circle(0, 0, this.radius * 2);
    
    // Inner glow
    p.fill(200, 230, 255);
    p.circle(0, 0, this.radius);
    
    p.pop();
  }
}

export class AncientRelic {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 40;
    this.height = 50;
    this.rotation = 0;
    this.rotationSpeed = 0.02;
    this.pulsePhase = 0;
    this.collected = false;
    
    gameState.relic = this;
  }
  
  update(p) {
    this.rotation += this.rotationSpeed;
    this.pulsePhase += 0.05;
    
    // Check collection
    if (gameState.player && !this.collected) {
      const dx = gameState.player.x - this.x;
      const dy = gameState.player.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 40) {
        this.collect(p);
      }
    }
  }
  
  collect(p) {
    this.collected = true;
    gameState.relicCollected = true;
    gameState.gamePhase = "GAME_OVER_WIN";
    gameState.score += 1000;
    
    // Victory particles
    for (let i = 0; i < 30; i++) {
      const angle = (Math.PI * 2 * i) / 30;
      const speed = Math.random() * 3 + 2;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      gameState.particles.push(new Particle(
        this.x, this.y, vx, vy,
        [255, 220, 100], 6, 60
      ));
    }
    
    p.logs.game_info.push({
      data: { event: "relic_collected", gamePhase: "GAME_OVER_WIN" },
      framecount: gameState.frameCount,
      timestamp: Date.now()
    });
  }
  
  render(p) {
    if (this.collected) return;
    
    const screenX = this.x - gameState.cameraX;
    const screenY = this.y - gameState.cameraY;
    
    p.push();
    p.translate(screenX, screenY);
    
    // Glow effect
    const pulseSize = Math.sin(this.pulsePhase) * 10 + 60;
    p.noStroke();
    p.fill(255, 220, 100, 30);
    p.circle(0, 0, pulseSize);
    
    p.rotate(this.rotation);
    
    // Relic body
    p.fill(...COLORS.relic);
    p.stroke(200, 160, 60);
    p.strokeWeight(2);
    
    // Diamond shape
    p.beginShape();
    p.vertex(0, -this.height / 2);
    p.vertex(this.width / 2, 0);
    p.vertex(0, this.height / 2);
    p.vertex(-this.width / 2, 0);
    p.endShape(p.CLOSE);
    
    // Inner details
    p.noStroke();
    p.fill(255, 240, 150);
    p.circle(0, 0, 15);
    
    p.stroke(200, 160, 60);
    p.strokeWeight(2);
    p.line(-10, 0, 10, 0);
    p.line(0, -10, 0, 10);
    
    p.pop();
  }
}