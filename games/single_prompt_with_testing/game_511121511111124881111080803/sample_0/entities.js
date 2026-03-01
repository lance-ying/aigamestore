// entities.js - Entity classes for player, enemies, projectiles, powerups, and particles

import { 
  gameState, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  GAME_CONSTANTS,
  POWERUP_TYPES,
  ENEMY_TYPES,
  wrapPosition,
  clampPosition,
  distanceBetween,
  angleBetween,
  randomRange,
  randomInt,
  randomChoice,
} from './globals.js';

import { createParticleExplosion } from './particles.js';

// ============================================================================
// PLAYER CLASS
// ============================================================================

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = GAME_CONSTANTS.PLAYER_SIZE;
    
    // Physics
    this.angle = -Math.PI / 2; // Start facing up
    this.speed = GAME_CONSTANTS.PLAYER_MIN_SPEED;
    this.vx = 0;
    this.vy = 0;
    this.targetSpeed = this.speed;
    
    // Combat
    this.health = GAME_CONSTANTS.PLAYER_MAX_HEALTH;
    this.maxHealth = GAME_CONSTANTS.PLAYER_MAX_HEALTH;
    this.fireTimer = 0;
    this.invulnerabilityTimer = 0;
    
    // State
    this.isAlive = true;
    this.isBoosting = false;
    this.isBraking = false;
    this.lastPosition = { x: x, y: y };
    
    // Visual effects
    this.thrustParticleTimer = 0;
    this.hitFlash = 0;
    
    // Add to game state
    gameState.player = this;
    gameState.entities.push(this);
  }
  
  update(p) {
    if (!this.isAlive) return;
    
    // Update invulnerability
    if (this.invulnerabilityTimer > 0) {
      this.invulnerabilityTimer--;
    }
    
    // Update speed smoothly
    this.speed += (this.targetSpeed - this.speed) * 0.1;
    
    // Calculate velocity based on angle and speed
    this.vx = Math.cos(this.angle) * this.speed;
    this.vy = Math.sin(this.angle) * this.speed;
    
    // Update position
    this.x += this.vx;
    this.y += this.vy;
    
    // Wrap around screen edges
    if (GAME_CONSTANTS.WORLD_WRAP) {
      const wrapped = wrapPosition(this.x, this.y);
      this.x = wrapped.x;
      this.y = wrapped.y;
    } else {
      const clamped = clampPosition(this.x, this.y, this.size);
      this.x = clamped.x;
      this.y = clamped.y;
    }
    
    // Update firing
    this.updateFiring(p);
    
    // Create thrust particles
    if (this.speed > GAME_CONSTANTS.PLAYER_MIN_SPEED) {
      this.thrustParticleTimer++;
      if (this.thrustParticleTimer >= 3) {
        this.createThrustParticle();
        this.thrustParticleTimer = 0;
      }
    }
    
    // Decay hit flash
    if (this.hitFlash > 0) {
      this.hitFlash -= 0.1;
    }
    
    // Log position changes
    if (Math.abs(this.x - this.lastPosition.x) > 1 || 
        Math.abs(this.y - this.lastPosition.y) > 1) {
      this.logPosition(p);
      this.lastPosition.x = this.x;
      this.lastPosition.y = this.y;
    }
    
    // Update power-up timers
    for (const key in gameState.activePowerups) {
      if (gameState.activePowerups[key] > 0) {
        gameState.activePowerups[key]--;
      }
    }
    
    // Reset boost/brake flags
    this.isBoosting = false;
    this.isBraking = false;
  }
  
  updateFiring(p) {
    this.fireTimer++;
    
    // Determine fire rate based on power-ups
    let fireRate = GAME_CONSTANTS.PROJECTILE_FIRE_RATE;
    if (gameState.activePowerups.rapidFire > 0) {
      fireRate = Math.floor(fireRate * 0.5);
    }
    
    // Auto-fire
    if (this.fireTimer >= fireRate) {
      this.fire();
      this.fireTimer = 0;
    }
  }
  
  fire() {
    if (!this.isAlive) return;
    
    // Check if spread shot is active
    if (gameState.activePowerups.spreadShot > 0) {
      this.fireSpreadShot();
    } else {
      this.fireSingleShot();
    }
    
    gameState.stats.totalShots++;
  }
  
  fireSingleShot() {
    const projectile = new Projectile(
      this.x + Math.cos(this.angle) * this.size,
      this.y + Math.sin(this.angle) * this.size,
      this.angle,
      this
    );
  }
  
  fireSpreadShot() {
    const angles = [-0.3, 0, 0.3]; // Three directions
    for (const offset of angles) {
      const projectile = new Projectile(
        this.x + Math.cos(this.angle + offset) * this.size,
        this.y + Math.sin(this.angle + offset) * this.size,
        this.angle + offset,
        this
      );
    }
  }
  
  turnLeft() {
    this.angle -= GAME_CONSTANTS.PLAYER_TURN_SPEED;
  }
  
  turnRight() {
    this.angle += GAME_CONSTANTS.PLAYER_TURN_SPEED;
  }
  
  boost() {
    this.targetSpeed = Math.min(
      GAME_CONSTANTS.PLAYER_MAX_SPEED * GAME_CONSTANTS.PLAYER_BOOST_MULTIPLIER,
      this.targetSpeed + GAME_CONSTANTS.PLAYER_ACCELERATION
    );
    this.isBoosting = true;
  }
  
  brake() {
    this.targetSpeed = Math.max(
      GAME_CONSTANTS.PLAYER_MIN_SPEED * GAME_CONSTANTS.PLAYER_BRAKE_MULTIPLIER,
      this.targetSpeed - GAME_CONSTANTS.PLAYER_ACCELERATION
    );
    this.isBraking = true;
  }
  
  useSpecialWeapon() {
    // Use bomb if available
    if (gameState.activePowerups.bomb > 0) {
      this.activateBomb();
      gameState.activePowerups.bomb = 0;
    }
  }
  
  activateBomb() {
    // Destroy all enemies on screen
    const enemiesCopy = [...gameState.enemies];
    for (const enemy of enemiesCopy) {
      enemy.takeDamage(enemy.health);
    }
    
    // Create massive explosion effect
    for (let i = 0; i < 50; i++) {
      createParticleExplosion(
        this.x,
        this.y,
        20,
        [255, 255, 100],
        randomRange(5, 15)
      );
    }
    
    // Screen shake
    gameState.cameraShake = 20;
    gameState.flashIntensity = 1.0;
  }
  
  createThrustParticle() {
    const particle = new Particle(
      this.x - Math.cos(this.angle) * this.size * 0.8,
      this.y - Math.sin(this.angle) * this.size * 0.8,
      -Math.cos(this.angle) * 2,
      -Math.sin(this.angle) * 2,
      15,
      this.isBoosting ? [255, 150, 50] : [100, 150, 255],
      3
    );
  }
  
  takeDamage(amount) {
    if (!this.isAlive || this.invulnerabilityTimer > 0) return;
    
    // Shield absorbs damage
    if (gameState.activePowerups.shield > 0) {
      gameState.activePowerups.shield = 0;
      this.invulnerabilityTimer = 30;
      return;
    }
    
    this.health -= amount;
    this.hitFlash = 1.0;
    this.invulnerabilityTimer = GAME_CONSTANTS.PLAYER_INVULNERABILITY_TIME;
    gameState.stats.damageTaken += amount;
    
    // Camera shake
    gameState.cameraShake = 10;
    
    // Create damage particles
    createParticleExplosion(this.x, this.y, 10, [255, 50, 50]);
    
    if (this.health <= 0) {
      this.die();
    }
  }
  
  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }
  
  die() {
    this.isAlive = false;
    gameState.gamePhase = "GAME_OVER_LOSE";
    
    // Create large explosion
    createParticleExplosion(this.x, this.y, 30, [255, 100, 0], 10);
    gameState.cameraShake = 30;
    gameState.flashIntensity = 1.5;
  }
  
  logPosition(p) {
    if (p.logs && p.logs.player_info) {
      p.logs.player_info.push({
        screen_x: this.x,
        screen_y: this.y,
        game_x: this.x,
        game_y: this.y,
        health: this.health,
        speed: this.speed,
        angle: this.angle,
        framecount: gameState.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  render(p) {
    if (!this.isAlive) return;
    
    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.angle);
    
    // Invulnerability flashing
    if (this.invulnerabilityTimer > 0 && this.invulnerabilityTimer % 4 < 2) {
      p.pop();
      return;
    }
    
    // Hit flash effect
    if (this.hitFlash > 0) {
      p.fill(255, 100, 100, this.hitFlash * 200);
      p.noStroke();
      p.circle(0, 0, this.size * 2.5);
    }
    
    // Shield visual
    if (gameState.activePowerups.shield > 0) {
      p.stroke(100, 200, 255, 150);
      p.strokeWeight(2);
      p.noFill();
      p.circle(0, 0, this.size * 2.5);
    }
    
    // Draw ship body
    p.fill(50, 200, 255);
    p.stroke(150, 230, 255);
    p.strokeWeight(2);
    p.beginShape();
    p.vertex(this.size, 0);
    p.vertex(-this.size * 0.6, this.size * 0.6);
    p.vertex(-this.size * 0.3, 0);
    p.vertex(-this.size * 0.6, -this.size * 0.6);
    p.endShape(p.CLOSE);
    
    // Cockpit
    p.fill(150, 230, 255);
    p.circle(this.size * 0.3, 0, this.size * 0.4);
    
    // Engine glow when boosting
    if (this.isBoosting) {
      p.fill(255, 150, 50, 200);
      p.noStroke();
      p.circle(-this.size * 0.5, 0, this.size * 0.6);
    }
    
    p.pop();
  }
}

// ============================================================================
// PROJECTILE CLASS
// ============================================================================

export class Projectile {
  constructor(x, y, angle, owner) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.owner = owner;
    this.size = GAME_CONSTANTS.PROJECTILE_SIZE;
    
    // Physics
    this.vx = Math.cos(angle) * GAME_CONSTANTS.PROJECTILE_SPEED;
    this.vy = Math.sin(angle) * GAME_CONSTANTS.PROJECTILE_SPEED;
    
    // State
    this.lifetime = GAME_CONSTANTS.PROJECTILE_LIFETIME;
    this.age = 0;
    this.isActive = true;
    this.damage = 20;
    
    // Visual
    this.trailPositions = [];
    
    // Add to game state
    gameState.projectiles.push(this);
    gameState.entities.push(this);
  }
  
  update(p) {
    if (!this.isActive) return;
    
    // Update position
    this.x += this.vx;
    this.y += this.vy;
    
    // Store trail position
    this.trailPositions.push({ x: this.x, y: this.y });
    if (this.trailPositions.length > 5) {
      this.trailPositions.shift();
    }
    
    // Update age
    this.age++;
    
    // Remove if expired
    if (this.age >= this.lifetime) {
      this.destroy();
      return;
    }
    
    // Wrap around screen
    if (GAME_CONSTANTS.WORLD_WRAP) {
      const wrapped = wrapPosition(this.x, this.y);
      this.x = wrapped.x;
      this.y = wrapped.y;
    } else {
      // Check bounds
      if (this.x < 0 || this.x > CANVAS_WIDTH || 
          this.y < 0 || this.y > CANVAS_HEIGHT) {
        this.destroy();
        return;
      }
    }
    
    // Check collision with enemies (if player projectile)
    if (this.owner instanceof Player) {
      for (const enemy of gameState.enemies) {
        if (this.checkCollision(enemy)) {
          enemy.takeDamage(this.damage);
          this.onHit();
          return;
        }
      }
    }
    
    // Check collision with player (if enemy projectile)
    if (this.owner instanceof Enemy && gameState.player) {
      if (this.checkCollision(gameState.player)) {
        gameState.player.takeDamage(this.damage);
        this.onHit();
        return;
      }
    }
  }
  
  checkCollision(entity) {
    const distance = distanceBetween(this.x, this.y, entity.x, entity.y);
    return distance < (this.size + entity.size);
  }
  
  onHit() {
    // Create small impact effect
    createParticleExplosion(this.x, this.y, 3, [255, 255, 100], 3);
    gameState.stats.totalHits++;
    this.destroy();
  }
  
  destroy() {
    this.isActive = false;
    
    const index = gameState.projectiles.indexOf(this);
    if (index > -1) {
      gameState.projectiles.splice(index, 1);
    }
    
    const entityIndex = gameState.entities.indexOf(this);
    if (entityIndex > -1) {
      gameState.entities.splice(entityIndex, 1);
    }
  }
  
  render(p) {
    if (!this.isActive) return;
    
    // Draw trail
    p.noFill();
    p.strokeWeight(2);
    for (let i = 0; i < this.trailPositions.length; i++) {
      const pos = this.trailPositions[i];
      const alpha = (i / this.trailPositions.length) * 255;
      const color = this.owner instanceof Player ? 
        [100, 200, 255, alpha] : [255, 100, 100, alpha];
      p.stroke(...color);
      p.point(pos.x, pos.y);
    }
    
    // Draw projectile
    p.fill(this.owner instanceof Player ? 150 : 255, 
           this.owner instanceof Player ? 230 : 100, 
           this.owner instanceof Player ? 255 : 100);
    p.noStroke();
    p.circle(this.x, this.y, this.size * 2);
    
    // Glow effect
    p.fill(255, 255, 255, 150);
    p.circle(this.x, this.y, this.size);
  }
}

// ============================================================================
// ENEMY CLASS
// ============================================================================

export class Enemy {
  constructor(x, y, type = ENEMY_TYPES.BASIC) {
    this.x = x;
    this.y = y;
    this.type = type;
    
    // Configure based on type
    this.configureType();
    
    // Physics
    this.vx = 0;
    this.vy = 0;
    this.angle = 0;
    
    // State
    this.isActive = true;
    this.aiTimer = 0;
    this.shootTimer = 0;
    
    // Visual
    this.rotationSpeed = randomRange(-0.05, 0.05);
    this.pulsePhase = Math.random() * Math.PI * 2;
    this.hitFlash = 0;
    
    // Add to game state
    gameState.enemies.push(this);
    gameState.entities.push(this);
  }
  
  configureType() {
    switch (this.type) {
      case ENEMY_TYPES.BASIC:
        this.size = GAME_CONSTANTS.ENEMY_BASE_SIZE;
        this.speed = GAME_CONSTANTS.ENEMY_BASE_SPEED * gameState.enemySpeedMultiplier;
        this.health = GAME_CONSTANTS.ENEMY_BASE_HEALTH * gameState.enemyHealthMultiplier;
        this.maxHealth = this.health;
        this.damage = 10;
        this.color = [255, 100, 100];
        this.points = GAME_CONSTANTS.SCORE_PER_ENEMY;
        this.canShoot = false;
        break;
        
      case ENEMY_TYPES.FAST:
        this.size = GAME_CONSTANTS.ENEMY_BASE_SIZE * 0.8;
        this.speed = GAME_CONSTANTS.ENEMY_BASE_SPEED * 2 * gameState.enemySpeedMultiplier;
        this.health = GAME_CONSTANTS.ENEMY_BASE_HEALTH * 0.6 * gameState.enemyHealthMultiplier;
        this.maxHealth = this.health;
        this.damage = 15;
        this.color = [255, 200, 100];
        this.points = GAME_CONSTANTS.SCORE_PER_ENEMY * 1.5;
        this.canShoot = false;
        break;
        
      case ENEMY_TYPES.TANK:
        this.size = GAME_CONSTANTS.ENEMY_BASE_SIZE * 1.5;
        this.speed = GAME_CONSTANTS.ENEMY_BASE_SPEED * 0.6 * gameState.enemySpeedMultiplier;
        this.health = GAME_CONSTANTS.ENEMY_BASE_HEALTH * 2 * gameState.enemyHealthMultiplier;
        this.maxHealth = this.health;
        this.damage = 20;
        this.color = [150, 100, 255];
        this.points = GAME_CONSTANTS.SCORE_PER_ENEMY * 2;
        this.canShoot = false;
        break;
        
      case ENEMY_TYPES.SHOOTER:
        this.size = GAME_CONSTANTS.ENEMY_BASE_SIZE * 1.2;
        this.speed = GAME_CONSTANTS.ENEMY_BASE_SPEED * 0.8 * gameState.enemySpeedMultiplier;
        this.health = GAME_CONSTANTS.ENEMY_BASE_HEALTH * 1.2 * gameState.enemyHealthMultiplier;
        this.maxHealth = this.health;
        this.damage = 5;
        this.color = [100, 255, 100];
        this.points = GAME_CONSTANTS.SCORE_PER_ENEMY * 1.8;
        this.canShoot = true;
        this.shootCooldown = 120; // frames
        break;
    }
  }
  
  update(p) {
    if (!this.isActive) return;
    
    this.aiTimer++;
    
    // AI behavior
    this.updateAI();
    
    // Update position
    this.x += this.vx;
    this.y += this.vy;
    
    // Wrap around screen
    if (GAME_CONSTANTS.WORLD_WRAP) {
      const wrapped = wrapPosition(this.x, this.y);
      this.x = wrapped.x;
      this.y = wrapped.y;
    }
    
    // Update rotation
    this.angle += this.rotationSpeed;
    
    // Decay hit flash
    if (this.hitFlash > 0) {
      this.hitFlash -= 0.1;
    }
    
    // Shooting behavior
    if (this.canShoot && gameState.player) {
      this.shootTimer++;
      if (this.shootTimer >= this.shootCooldown) {
        this.shoot();
        this.shootTimer = 0;
      }
    }
    
    // Check collision with player
    if (gameState.player && this.checkCollisionWithPlayer()) {
      gameState.player.takeDamage(this.damage);
      this.takeDamage(this.health * 0.5); // Self-damage on collision
    }
  }
  
  updateAI() {
    if (!gameState.player) return;
    
    // Calculate direction to player
    const angleToPlayer = angleBetween(this.x, this.y, gameState.player.x, gameState.player.y);
    const distanceToPlayer = distanceBetween(this.x, this.y, gameState.player.x, gameState.player.y);
    
    switch (this.type) {
      case ENEMY_TYPES.BASIC:
        // Simple chase behavior
        this.vx = Math.cos(angleToPlayer) * this.speed;
        this.vy = Math.sin(angleToPlayer) * this.speed;
        break;
        
      case ENEMY_TYPES.FAST:
        // Aggressive chase with evasive maneuvers
        if (this.aiTimer % 60 < 30) {
          this.vx = Math.cos(angleToPlayer) * this.speed;
          this.vy = Math.sin(angleToPlayer) * this.speed;
        } else {
          this.vx = Math.cos(angleToPlayer + Math.PI / 2) * this.speed;
          this.vy = Math.sin(angleToPlayer + Math.PI / 2) * this.speed;
        }
        break;
        
      case ENEMY_TYPES.TANK:
        // Slow but steady approach
        this.vx = Math.cos(angleToPlayer) * this.speed;
        this.vy = Math.sin(angleToPlayer) * this.speed;
        break;
        
      case ENEMY_TYPES.SHOOTER:
        // Keep distance and circle player
        if (distanceToPlayer < 150) {
          // Move away
          this.vx = -Math.cos(angleToPlayer) * this.speed;
          this.vy = -Math.sin(angleToPlayer) * this.speed;
        } else if (distanceToPlayer > 250) {
          // Move closer
          this.vx = Math.cos(angleToPlayer) * this.speed;
          this.vy = Math.sin(angleToPlayer) * this.speed;
        } else {
          // Circle around
          this.vx = Math.cos(angleToPlayer + Math.PI / 2) * this.speed;
          this.vy = Math.sin(angleToPlayer + Math.PI / 2) * this.speed;
        }
        break;
    }
  }
  
  shoot() {
    if (!gameState.player) return;
    
    const angleToPlayer = angleBetween(this.x, this.y, gameState.player.x, gameState.player.y);
    const projectile = new Projectile(
      this.x + Math.cos(angleToPlayer) * this.size,
      this.y + Math.sin(angleToPlayer) * this.size,
      angleToPlayer,
      this
    );
    projectile.damage = 5;
  }
  
  checkCollisionWithPlayer() {
    if (!gameState.player) return false;
    const distance = distanceBetween(this.x, this.y, gameState.player.x, gameState.player.y);
    return distance < (this.size + gameState.player.size);
  }
  
  takeDamage(amount) {
    this.health -= amount;
    this.hitFlash = 1.0;
    
    // Create hit particles
    createParticleExplosion(this.x, this.y, 3, this.color, 3);
    
    if (this.health <= 0) {
      this.die();
    }
  }
  
  die() {
    this.isActive = false;
    
    // Update score
    const scoreGained = Math.floor(this.points * gameState.scoreMultiplier);
    gameState.score += scoreGained;
    gameState.scoreMultiplier += GAME_CONSTANTS.SCORE_MULTIPLIER_INCREMENT;
    gameState.enemiesDestroyed++;
    
    // Update high score
    if (gameState.score > gameState.highScore) {
      gameState.highScore = gameState.score;
    }
    
    // Spawn power-up chance
    if (Math.random() < GAME_CONSTANTS.POWERUP_SPAWN_CHANCE) {
      const type = randomChoice(Object.values(POWERUP_TYPES));
      new Powerup(this.x, this.y, type);
    }
    
    // Create explosion
    createParticleExplosion(this.x, this.y, 15, this.color, 8);
    
    // Remove from arrays
    const index = gameState.enemies.indexOf(this);
    if (index > -1) {
      gameState.enemies.splice(index, 1);
    }
    
    const entityIndex = gameState.entities.indexOf(this);
    if (entityIndex > -1) {
      gameState.entities.splice(entityIndex, 1);
    }
    
    // Small camera shake
    gameState.cameraShake = 3;
  }
  
  render(p) {
    if (!this.isActive) return;
    
    p.push();
    p.translate(this.x, this.y);
    
    // Hit flash
    if (this.hitFlash > 0) {
      p.fill(255, 255, 255, this.hitFlash * 200);
      p.noStroke();
      p.circle(0, 0, this.size * 2.5);
    }
    
    // Draw based on type
    p.rotate(this.angle);
    
    // Pulsing effect
    const pulse = Math.sin(gameState.frameCount * 0.1 + this.pulsePhase) * 0.1 + 1;
    const renderSize = this.size * pulse;
    
    switch (this.type) {
      case ENEMY_TYPES.BASIC:
        this.renderBasic(p, renderSize);
        break;
      case ENEMY_TYPES.FAST:
        this.renderFast(p, renderSize);
        break;
      case ENEMY_TYPES.TANK:
        this.renderTank(p, renderSize);
        break;
      case ENEMY_TYPES.SHOOTER:
        this.renderShooter(p, renderSize);
        break;
    }
    
    // Health bar
    this.renderHealthBar(p);
    
    p.pop();
  }
  
  renderBasic(p, size) {
    p.fill(this.color[0], this.color[1], this.color[2]);
    p.stroke(255, 150, 150);
    p.strokeWeight(2);
    p.beginShape();
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const x = Math.cos(angle) * size;
      const y = Math.sin(angle) * size;
      p.vertex(x, y);
    }
    p.endShape(p.CLOSE);
    
    p.fill(255, 200, 200);
    p.circle(0, 0, size * 0.5);
  }
  
  renderFast(p, size) {
    p.fill(this.color[0], this.color[1], this.color[2]);
    p.stroke(255, 230, 150);
    p.strokeWeight(2);
    p.beginShape();
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2;
      const x = Math.cos(angle) * size;
      const y = Math.sin(angle) * size;
      p.vertex(x, y);
    }
    p.endShape(p.CLOSE);
  }
  
  renderTank(p, size) {
    p.fill(this.color[0], this.color[1], this.color[2]);
    p.stroke(200, 150, 255);
    p.strokeWeight(3);
    p.circle(0, 0, size * 2);
    
    p.fill(150, 100, 255);
    p.circle(0, 0, size * 1.2);
  }
  
  renderShooter(p, size) {
    p.fill(this.color[0], this.color[1], this.color[2]);
    p.stroke(150, 255, 150);
    p.strokeWeight(2);
    p.beginShape();
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const radius = (i % 2 === 0) ? size : size * 0.6;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      p.vertex(x, y);
    }
    p.endShape(p.CLOSE);
  }
  
  renderHealthBar(p) {
    if (this.health >= this.maxHealth) return;
    
    const barWidth = this.size * 2;
    const barHeight = 3;
    const barY = this.size + 8;
    
    p.fill(100, 0, 0);
    p.noStroke();
    p.rect(-barWidth / 2, barY, barWidth, barHeight);
    
    const healthRatio = this.health / this.maxHealth;
    p.fill(0, 255, 0);
    p.rect(-barWidth / 2, barY, barWidth * healthRatio, barHeight);
  }
}

// ============================================================================
// POWERUP CLASS
// ============================================================================

export class Powerup {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.size = GAME_CONSTANTS.POWERUP_SIZE;
    
    // State
    this.isActive = true;
    this.lifetime = GAME_CONSTANTS.POWERUP_LIFETIME;
    this.age = 0;
    
    // Visual
    this.rotation = 0;
    this.rotationSpeed = 0.05;
    this.bobPhase = Math.random() * Math.PI * 2;
    this.initialY = y;
    
    // Configure based on type
    this.configureType();
    
    // Add to game state
    gameState.powerups.push(this);
    gameState.entities.push(this);
  }
  
  configureType() {
    switch (this.type) {
      case POWERUP_TYPES.RAPID_FIRE:
        this.color = [255, 200, 0];
        this.duration = 300; // frames
        this.symbol = 'R';
        break;
      case POWERUP_TYPES.SPREAD_SHOT:
        this.color = [0, 200, 255];
        this.duration = 300;
        this.symbol = 'S';
        break;
      case POWERUP_TYPES.SHIELD:
        this.color = [100, 200, 255];
        this.duration = 300;
        this.symbol = 'D';
        break;
      case POWERUP_TYPES.BOMB:
        this.color = [255, 100, 0];
        this.duration = 0; // Instant use
        this.symbol = 'B';
        break;
      case POWERUP_TYPES.HEALTH:
        this.color = [0, 255, 100];
        this.duration = 0;
        this.symbol = 'H';
        break;
    }
  }
  
  update(p) {
    if (!this.isActive) return;
    
    this.age++;
    
    // Bob up and down
    this.y = this.initialY + Math.sin(gameState.frameCount * 0.05 + this.bobPhase) * 5;
    
    // Rotate
    this.rotation += this.rotationSpeed;
    
    // Fade out near end of lifetime
    if (this.age >= this.lifetime) {
      this.destroy();
      return;
    }
    
    // Check collision with player
    if (gameState.player) {
      const distance = distanceBetween(this.x, this.y, gameState.player.x, gameState.player.y);
      if (distance < (this.size + gameState.player.size)) {
        this.collect();
      }
    }
  }
  
  collect() {
    if (!gameState.player) return;
    
    // Apply power-up effect
    switch (this.type) {
      case POWERUP_TYPES.RAPID_FIRE:
        gameState.activePowerups.rapidFire = this.duration;
        break;
      case POWERUP_TYPES.SPREAD_SHOT:
        gameState.activePowerups.spreadShot = this.duration;
        break;
      case POWERUP_TYPES.SHIELD:
        gameState.activePowerups.shield = this.duration;
        break;
      case POWERUP_TYPES.BOMB:
        gameState.activePowerups.bomb = 1; // Flag to use
        break;
      case POWERUP_TYPES.HEALTH:
        gameState.player.heal(50);
        break;
    }
    
    gameState.stats.powerupsCollected++;
    
    // Visual feedback
    createParticleExplosion(this.x, this.y, 10, this.color, 5);
    
    this.destroy();
  }
  
  destroy() {
    this.isActive = false;
    
    const index = gameState.powerups.indexOf(this);
    if (index > -1) {
      gameState.powerups.splice(index, 1);
    }
    
    const entityIndex = gameState.entities.indexOf(this);
    if (entityIndex > -1) {
      gameState.entities.splice(entityIndex, 1);
    }
  }
  
  render(p) {
    if (!this.isActive) return;
    
    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.rotation);
    
    // Fade out effect
    const fadeStart = this.lifetime - 60;
    let alpha = 255;
    if (this.age > fadeStart) {
      alpha = p.map(this.age, fadeStart, this.lifetime, 255, 0);
    }
    
    // Outer glow
    p.fill(this.color[0], this.color[1], this.color[2], alpha * 0.3);
    p.noStroke();
    p.circle(0, 0, this.size * 3);
    
    // Main shape
    p.fill(this.color[0], this.color[1], this.color[2], alpha);
    p.stroke(255, 255, 255, alpha);
    p.strokeWeight(2);
    p.beginShape();
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const x = Math.cos(angle) * this.size;
      const y = Math.sin(angle) * this.size;
      p.vertex(x, y);
    }
    p.endShape(p.CLOSE);
    
    // Inner circle
    p.fill(255, 255, 255, alpha);
    p.noStroke();
    p.circle(0, 0, this.size * 0.6);
    
    p.pop();
  }
}