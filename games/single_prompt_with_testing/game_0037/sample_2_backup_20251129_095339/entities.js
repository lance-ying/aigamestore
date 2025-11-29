// entities.js - Entity classes for game objects

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, PLAYER_WIDTH, PLAYER_HEIGHT, 
         PLAYER_SPEED, JUMP_POWER, SPIN_DASH_MAX_POWER, SPIN_DASH_CHARGE_RATE,
         PLAYER_ACCELERATION, MAX_VELOCITY_X, INVINCIBILITY_DURATION, LEVEL_WIDTH,
         SPECIAL_STAGE_RING_REQUIREMENT } from './globals.js';
import { isKeyPressed, KEY_LEFT, KEY_RIGHT, KEY_DOWN, KEY_SPACE, KEY_UP, KEY_Z } from './input.js';
import { createParticleBurst, createRingSparkle, createSpinDashSmoke } from './particles.js';

// Player class - Sonic the Hedgehog
export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = PLAYER_WIDTH;
    this.height = PLAYER_HEIGHT;
    
    // Physics
    this.vx = 0;
    this.vy = 0;
    this.ax = 0;
    this.ay = 0;
    this.onGround = false;
    this.canDoubleJump = true;
    
    // State
    this.facing = 1; // 1 = right, -1 = left
    this.isCrouching = false;
    this.isSpinDashing = false;
    this.spinDashPower = 0;
    this.isInvincible = false;
    this.invincibilityTimer = 0;
    this.isDead = false;
    this.inLoop = false;
    
    // Animation
    this.animFrame = 0;
    this.animSpeed = 0.2;
    this.rotation = 0;
    
    // Last position for logging
    this.lastPosition = { x: x, y: y };
    
    gameState.player = this;
    gameState.entities.push(this);
  }
  
  update(p) {
    if (this.isDead) return;
    
    // Update invincibility
    if (this.isInvincible) {
      this.invincibilityTimer--;
      if (this.invincibilityTimer <= 0) {
        this.isInvincible = false;
      }
    }
    
    // Handle input
    this.handleInput(p);
    
    // Apply physics
    this.applyPhysics();
    
    // Update position
    this.x += this.vx;
    this.y += this.vy;
    
    // Check collisions
    this.checkPlatformCollisions();
    this.checkRingCollisions();
    this.checkEnemyCollisions();
    this.checkSpringCollisions();
    this.checkLoopCollisions();
    this.checkGiantRingCollisions();
    this.checkGoalCollision();
    
    // Bounds checking
    this.checkBounds();
    
    // Update animation
    this.updateAnimation();
    
    // Update Super Sonic
    this.updateSuperSonic();
    
    // Log position changes
    if (Math.abs(this.x - this.lastPosition.x) > 2 || 
        Math.abs(this.y - this.lastPosition.y) > 2) {
      this.logPosition(p);
      this.lastPosition.x = this.x;
      this.lastPosition.y = this.y;
    }
  }
  
  handleInput(p) {
    // Crouching / Spin Dash
    if (isKeyPressed(KEY_DOWN) && this.onGround) {
      this.isCrouching = true;
      this.isSpinDashing = true;
      this.spinDashPower = Math.min(this.spinDashPower + SPIN_DASH_CHARGE_RATE, SPIN_DASH_MAX_POWER);
      
      // Create smoke particles
      if (gameState.frameCount % 3 === 0) {
        createSpinDashSmoke(this.x, this.y + this.height / 2);
      }
    } else {
      if (this.isSpinDashing && this.spinDashPower > 0) {
        // Release spin dash
        this.vx = this.spinDashPower * this.facing;
        this.isSpinDashing = false;
        this.spinDashPower = 0;
      }
      this.isCrouching = false;
    }
    
    // Horizontal movement
    if (!this.isCrouching) {
      if (isKeyPressed(KEY_LEFT)) {
        this.ax = -PLAYER_ACCELERATION;
        this.facing = -1;
      } else if (isKeyPressed(KEY_RIGHT)) {
        this.ax = PLAYER_ACCELERATION;
        this.facing = 1;
      } else {
        this.ax = 0;
      }
    }
    
    // Jumping
    if ((isKeyPressed(KEY_SPACE) || isKeyPressed(KEY_UP)) && this.onGround) {
      this.jump();
    }
    
    // Double jump (spin attack in air)
    if ((isKeyPressed(KEY_SPACE) || isKeyPressed(KEY_UP)) && !this.onGround && this.canDoubleJump) {
      this.doubleJump();
    }
    
    // Super Sonic transformation
    if (isKeyPressed(KEY_Z) && gameState.chaosEmeralds >= 7 && gameState.ringCount >= 50 && !gameState.isSuperSonic) {
      this.transformToSuperSonic();
    }
  }
  
  applyPhysics() {
    // Apply acceleration
    this.vx += this.ax;
    
    // Apply gravity
    if (!this.onGround && !this.inLoop) {
      this.vy += gameState.gravity;
    }
    
    // Apply friction
    if (this.onGround && !this.isSpinDashing) {
      this.vx *= gameState.friction;
    } else if (!this.onGround) {
      this.vx *= gameState.airResistance;
    }
    
    // Clamp velocity
    this.vx = Math.max(-MAX_VELOCITY_X, Math.min(MAX_VELOCITY_X, this.vx));
    this.vy = Math.max(-16, Math.min(16, this.vy));
    
    // Reset acceleration
    this.ax = 0;
    this.ay = 0;
  }
  
  jump() {
    if (this.onGround) {
      this.vy = JUMP_POWER;
      this.onGround = false;
      this.canDoubleJump = true;
    }
  }
  
  doubleJump() {
    this.vy = JUMP_POWER * 0.8;
    this.canDoubleJump = false;
    createParticleBurst(this.x, this.y, 5, [100, 200, 255]);
  }
  
  checkPlatformCollisions() {
    this.onGround = false;
    
    for (const platform of gameState.platforms) {
      if (this.collidesWithPlatform(platform)) {
        // Top collision
        if (this.vy > 0 && this.y + this.height / 2 - this.vy <= platform.y) {
          this.y = platform.y - this.height / 2;
          this.vy = 0;
          this.onGround = true;
          this.inLoop = false;
        }
        // Bottom collision
        else if (this.vy < 0 && this.y - this.height / 2 - this.vy >= platform.y + platform.height) {
          this.y = platform.y + platform.height + this.height / 2;
          this.vy = 0;
        }
        // Side collisions
        else if (this.vx > 0 && this.x + this.width / 2 - this.vx <= platform.x) {
          this.x = platform.x - this.width / 2;
          this.vx = 0;
        } else if (this.vx < 0 && this.x - this.width / 2 - this.vx >= platform.x + platform.width) {
          this.x = platform.x + platform.width + this.width / 2;
          this.vx = 0;
        }
      }
    }
  }
  
  collidesWithPlatform(platform) {
    return (
      this.x + this.width / 2 > platform.x &&
      this.x - this.width / 2 < platform.x + platform.width &&
      this.y + this.height / 2 > platform.y &&
      this.y - this.height / 2 < platform.y + platform.height
    );
  }
  
  checkRingCollisions() {
    for (let i = gameState.rings.length - 1; i >= 0; i--) {
      const ring = gameState.rings[i];
      const dx = ring.x - this.x;
      const dy = ring.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < this.width / 2 + ring.radius) {
        ring.collect();
      }
    }
    
    // Check scattered rings
    for (let i = gameState.scatteredRings.length - 1; i >= 0; i--) {
      const ring = gameState.scatteredRings[i];
      const dx = ring.x - this.x;
      const dy = ring.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < this.width / 2 + ring.radius && ring.age > 10) {
        ring.collect();
      }
    }
  }
  
  checkEnemyCollisions() {
    if (this.isInvincible) return;
    
    for (const enemy of gameState.enemies) {
      if (enemy.isDead) continue;
      
      const dx = enemy.x - this.x;
      const dy = enemy.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < this.width / 2 + enemy.width / 2) {
        // Check if attacking from above
        if (this.vy > 0 && this.y < enemy.y) {
          enemy.takeDamage(1);
          this.vy = JUMP_POWER * 0.5; // Bounce
          gameState.score += 100;
        } else {
          this.takeDamage();
        }
      }
    }
  }
  
  checkSpringCollisions() {
    for (const spring of gameState.springs) {
      const dx = spring.x - this.x;
      const dy = spring.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < this.width / 2 + spring.width / 2) {
        spring.activate(this);
      }
    }
  }
  
  checkLoopCollisions() {
    for (const loop of gameState.loops) {
      if (loop.contains(this.x, this.y)) {
        this.inLoop = true;
        loop.applyPhysics(this);
        return;
      }
    }
    this.inLoop = false;
  }
  
  checkGiantRingCollisions() {
    for (const giantRing of gameState.giantRings) {
      const dx = giantRing.x - this.x;
      const dy = giantRing.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < this.width / 2 + giantRing.radius) {
        giantRing.activate();
      }
    }
  }
  
  checkGoalCollision() {
    // Check if reached goal post
    if (this.x >= gameState.platforms[gameState.platforms.length - 1].x) {
      if (!gameState.levelComplete) {
        gameState.levelComplete = true;
        gameState.completionTimer = 120;
        gameState.score += 1000;
      }
    }
  }
  
  checkBounds() {
    // Left bound
    if (this.x - this.width / 2 < 0) {
      this.x = this.width / 2;
      this.vx = 0;
    }
    
    // Right bound
    if (this.x + this.width / 2 > LEVEL_WIDTH) {
      this.x = LEVEL_WIDTH - this.width / 2;
      this.vx = 0;
    }
    
    // Death pit
    if (this.y > CANVAS_HEIGHT + 100) {
      this.die();
    }
  }
  
  takeDamage() {
    if (this.isInvincible) return;
    
    if (gameState.ringCount > 0) {
      // Scatter rings
      this.scatterRings();
      gameState.ringCount = 0;
      this.isInvincible = true;
      this.invincibilityTimer = INVINCIBILITY_DURATION;
    } else {
      // Die
      this.die();
    }
  }
  
  scatterRings() {
    const ringsToScatter = Math.min(gameState.ringCount, 32);
    for (let i = 0; i < ringsToScatter; i++) {
      const angle = (Math.PI * 2 * i) / ringsToScatter;
      const speed = 5 + Math.random() * 3;
      gameState.scatteredRings.push(new ScatteredRing(this.x, this.y, angle, speed));
    }
  }
  
  die() {
    this.isDead = true;
    gameState.lives--;
    
    // Create death particle effect
    createParticleBurst(this.x, this.y, 20, [255, 0, 0]);
    
    if (gameState.lives <= 0) {
      gameState.gamePhase = "GAME_OVER_LOSE";
    } else {
      // Respawn after delay
      setTimeout(() => {
        this.respawn();
      }, 2000);
    }
  }
  
  respawn() {
    this.x = 100;
    this.y = 200;
    this.vx = 0;
    this.vy = 0;
    this.isDead = false;
    this.isInvincible = true;
    this.invincibilityTimer = INVINCIBILITY_DURATION * 2;
  }
  
  transformToSuperSonic() {
    gameState.isSuperSonic = true;
    gameState.superSonicTimer = 1800; // 30 seconds at 60 FPS
    createParticleBurst(this.x, this.y, 30, [255, 255, 0]);
  }
  
  updateSuperSonic() {
    if (gameState.isSuperSonic) {
      gameState.superSonicTimer--;
      
      // Drain rings
      if (gameState.frameCount % 60 === 0) {
        gameState.ringCount--;
        if (gameState.ringCount <= 0) {
          gameState.isSuperSonic = false;
        }
      }
      
      if (gameState.superSonicTimer <= 0) {
        gameState.isSuperSonic = false;
      }
      
      // Super Sonic effects
      if (gameState.frameCount % 3 === 0) {
        createParticleBurst(this.x, this.y, 1, [255, 255, 100]);
      }
    }
  }
  
  updateAnimation() {
    if (Math.abs(this.vx) > 0.1) {
      this.animFrame += Math.abs(this.vx) * this.animSpeed;
    }
    
    // Rotation for loops and spin dash
    if (this.inLoop || this.isSpinDashing) {
      this.rotation += 0.3;
    } else {
      this.rotation = 0;
    }
  }
  
  logPosition(p) {
    if (p.logs && p.logs.player_info) {
      p.logs.player_info.push({
        screen_x: this.x - gameState.cameraX,
        screen_y: this.y - gameState.cameraY,
        game_x: this.x,
        game_y: this.y,
        framecount: gameState.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  render(p) {
    if (this.isDead) return;
    
    const screenX = this.x - gameState.cameraX;
    const screenY = this.y - gameState.cameraY;
    
    p.push();
    p.translate(screenX, screenY);
    
    // Flashing when invincible
    if (this.isInvincible && gameState.frameCount % 6 < 3) {
      p.pop();
      return;
    }
    
    // Flip sprite
    if (this.facing < 0) {
      p.scale(-1, 1);
    }
    
    // Rotate for spin
    if (this.rotation !== 0) {
      p.rotate(this.rotation);
    }
    
    // Color based on state
    let bodyColor = gameState.isSuperSonic ? [255, 255, 0] : [30, 100, 255];
    
    // Body
    p.fill(...bodyColor);
    p.noStroke();
    p.ellipse(0, 0, this.width, this.height);
    
    // Spikes (quills)
    p.fill(...(gameState.isSuperSonic ? [255, 220, 0] : [0, 50, 200]));
    for (let i = 0; i < 3; i++) {
      const angle = -Math.PI / 4 + (i * Math.PI / 6);
      const spikeX = Math.cos(angle) * this.width / 2;
      const spikeY = Math.sin(angle) * this.height / 2 - 5;
      p.triangle(
        spikeX, spikeY,
        spikeX - 5, spikeY - 8,
        spikeX + 5, spikeY - 8
      );
    }
    
    // Eyes (only if not spinning)
    if (this.rotation === 0) {
      p.fill(255);
      p.ellipse(-5, -3, 8, 10);
      p.ellipse(5, -3, 8, 10);
      
      // Pupils
      p.fill(0);
      p.ellipse(-4, -2, 4, 6);
      p.ellipse(6, -2, 4, 6);
    }
    
    // Sneakers
    p.fill(255, 0, 0);
    p.ellipse(-3, this.height / 2 - 2, 8, 6);
    p.ellipse(3, this.height / 2 - 2, 8, 6);
    
    p.pop();
    
    // Spin dash charge indicator
    if (this.isSpinDashing && this.spinDashPower > 0) {
      p.push();
      p.fill(255, 255, 0, 150);
      p.noStroke();
      p.arc(screenX, screenY, 40, 40, 0, (this.spinDashPower / SPIN_DASH_MAX_POWER) * Math.PI * 2);
      p.pop();
    }
  }
}

// Ring class
export class Ring {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 8;
    this.rotation = 0;
    this.rotationSpeed = 0.1;
    this.bobOffset = 0;
    this.bobSpeed = 0.08;
    this.initialY = y;
    this.collected = false;
    
    gameState.rings.push(this);
    gameState.entities.push(this);
  }
  
  update(p) {
    if (this.collected) return;
    
    this.rotation += this.rotationSpeed;
    this.bobOffset = Math.sin(gameState.frameCount * this.bobSpeed) * 3;
    this.y = this.initialY + this.bobOffset;
  }
  
  collect() {
    if (this.collected) return;
    
    this.collected = true;
    gameState.ringCount++;
    gameState.score += 10;
    
    // Check for extra life
    if (gameState.ringCount % 100 === 0) {
      gameState.lives++;
    }
    
    createRingSparkle(this.x, this.y);
    
    // Remove from arrays
    const index = gameState.rings.indexOf(this);
    if (index > -1) gameState.rings.splice(index, 1);
    
    const entityIndex = gameState.entities.indexOf(this);
    if (entityIndex > -1) gameState.entities.splice(entityIndex, 1);
    
    // Spawn giant ring if conditions met
    if (gameState.ringCount === SPECIAL_STAGE_RING_REQUIREMENT && gameState.giantRings.length === 0) {
      spawnGiantRing();
    }
  }
  
  render(p) {
    if (this.collected) return;
    
    const screenX = this.x - gameState.cameraX;
    const screenY = this.y - gameState.cameraY;
    
    p.push();
    p.translate(screenX, screenY);
    p.rotate(this.rotation);
    
    // Outer ring
    p.fill(255, 215, 0);
    p.stroke(255, 180, 0);
    p.strokeWeight(2);
    p.ellipse(0, 0, this.radius * 2, this.radius * 2);
    
    // Inner ring
    p.fill(255, 255, 150);
    p.noStroke();
    p.ellipse(0, 0, this.radius, this.radius);
    
    p.pop();
  }
}

// Scattered ring (from taking damage)
export class ScatteredRing {
  constructor(x, y, angle, speed) {
    this.x = x;
    this.y = y;
    this.radius = 8;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed - 3;
    this.age = 0;
    this.lifetime = 120;
    this.onGround = false;
    
    gameState.scatteredRings.push(this);
  }
  
  update() {
    this.age++;
    
    if (this.age >= this.lifetime) {
      this.remove();
      return;
    }
    
    // Physics
    this.vy += gameState.gravity * 0.8;
    this.x += this.vx;
    this.y += this.vy;
    
    // Bounce on ground
    if (this.y >= CANVAS_HEIGHT - 50) {
      this.y = CANVAS_HEIGHT - 50;
      this.vy = -Math.abs(this.vy) * 0.6;
      this.vx *= 0.8;
      this.onGround = true;
    }
    
    // Friction
    if (this.onGround) {
      this.vx *= 0.9;
    }
  }
  
  collect() {
    gameState.ringCount++;
    gameState.score += 10;
    createRingSparkle(this.x, this.y);
    this.remove();
  }
  
  remove() {
    const index = gameState.scatteredRings.indexOf(this);
    if (index > -1) gameState.scatteredRings.splice(index, 1);
  }
  
  render(p) {
    const screenX = this.x - gameState.cameraX;
    const screenY = this.y - gameState.cameraY;
    
    const alpha = 255 * (1 - this.age / this.lifetime);
    
    p.push();
    p.fill(255, 215, 0, alpha);
    p.stroke(255, 180, 0, alpha);
    p.strokeWeight(2);
    p.ellipse(screenX, screenY, this.radius * 2, this.radius * 2);
    p.pop();
  }
}

// Enemy class
export class Enemy {
  constructor(x, y, type = 'basic') {
    this.x = x;
    this.y = y;
    this.width = 25;
    this.height = 25;
    this.type = type;
    this.vx = 1.5;
    this.vy = 0;
    this.health = 1;
    this.isDead = false;
    this.animFrame = 0;
    
    gameState.enemies.push(this);
    gameState.entities.push(this);
  }
  
  update() {
    if (this.isDead) return;
    
    // Basic patrol movement
    this.x += this.vx;
    this.vy += gameState.gravity;
    this.y += this.vy;
    
    // Ground collision
    if (this.y >= CANVAS_HEIGHT - 50) {
      this.y = CANVAS_HEIGHT - 50;
      this.vy = 0;
    }
    
    // Platform collision
    for (const platform of gameState.platforms) {
      if (this.collidesWithPlatform(platform)) {
        if (this.vy > 0) {
          this.y = platform.y - this.height / 2;
          this.vy = 0;
        }
      }
    }
    
    // Turn around at edges
    if (this.x < 0 || this.x > LEVEL_WIDTH) {
      this.vx *= -1;
    }
    
    this.animFrame += 0.1;
  }
  
  collidesWithPlatform(platform) {
    return (
      this.x + this.width / 2 > platform.x &&
      this.x - this.width / 2 < platform.x + platform.width &&
      this.y + this.height / 2 > platform.y &&
      this.y - this.height / 2 < platform.y + platform.height
    );
  }
  
  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.die();
    }
  }
  
  die() {
    this.isDead = true;
    createParticleBurst(this.x, this.y, 10, [200, 0, 0]);
    
    const index = gameState.enemies.indexOf(this);
    if (index > -1) gameState.enemies.splice(index, 1);
    
    const entityIndex = gameState.entities.indexOf(this);
    if (entityIndex > -1) gameState.entities.splice(entityIndex, 1);
  }
  
  render(p) {
    if (this.isDead) return;
    
    const screenX = this.x - gameState.cameraX;
    const screenY = this.y - gameState.cameraY;
    
    p.push();
    p.translate(screenX, screenY);
    
    // Body
    p.fill(150, 0, 0);
    p.noStroke();
    p.ellipse(0, 0, this.width, this.height);
    
    // Spikes
    p.fill(100, 0, 0);
    const spikeCount = 6;
    for (let i = 0; i < spikeCount; i++) {
      const angle = (Math.PI * 2 * i) / spikeCount + this.animFrame;
      const spikeX = Math.cos(angle) * this.width / 2;
      const spikeY = Math.sin(angle) * this.height / 2;
      p.triangle(
        spikeX, spikeY,
        spikeX * 0.7, spikeY * 0.7,
        spikeX * 1.3, spikeY * 1.3
      );
    }
    
    // Eyes
    p.fill(255, 0, 0);
    p.ellipse(-5, -3, 6, 6);
    p.ellipse(5, -3, 6, 6);
    
    p.pop();
  }
}

// Spring class
export class Spring {
  constructor(x, y, type = 'yellow') {
    this.x = x;
    this.y = y;
    this.width = 30;
    this.height = 15;
    this.type = type; // yellow, red
    this.compressed = false;
    this.compressionTimer = 0;
    
    gameState.springs.push(this);
    gameState.entities.push(this);
  }
  
  update() {
    if (this.compressed) {
      this.compressionTimer--;
      if (this.compressionTimer <= 0) {
        this.compressed = false;
      }
    }
  }
  
  activate(player) {
    if (this.compressed) return;
    
    this.compressed = true;
    this.compressionTimer = 10;
    
    const power = this.type === 'red' ? -16 : -12;
    player.vy = power;
    player.onGround = false;
    
    createParticleBurst(this.x, this.y, 5, [255, 255, 0]);
  }
  
  render(p) {
    const screenX = this.x - gameState.cameraX;
    const screenY = this.y - gameState.cameraY;
    
    const color = this.type === 'red' ? [255, 0, 0] : [255, 255, 0];
    const height = this.compressed ? this.height * 0.5 : this.height;
    
    p.push();
    p.fill(...color);
    p.stroke(200, 200, 0);
    p.strokeWeight(2);
    p.rect(screenX - this.width / 2, screenY - height / 2, this.width, height);
    p.pop();
  }
}

// Platform class
export class Platform {
  constructor(x, y, width, height, type = 'normal') {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = type;
    
    gameState.platforms.push(this);
  }
  
  render(p) {
    const screenX = this.x - gameState.cameraX;
    const screenY = this.y - gameState.cameraY;
    
    // Different colors for different types
    const colors = {
      normal: [100, 200, 100],
      grass: [50, 150, 50],
      stone: [120, 120, 120],
      goal: [255, 215, 0]
    };
    
    const color = colors[this.type] || colors.normal;
    
    p.push();
    p.fill(...color);
    p.stroke(color[0] - 30, color[1] - 30, color[2] - 30);
    p.strokeWeight(2);
    p.rect(screenX, screenY, this.width, this.height);
    
    // Texture pattern
    p.noStroke();
    p.fill(color[0] + 20, color[1] + 20, color[2] + 20);
    for (let i = 0; i < this.width; i += 20) {
      for (let j = 0; j < this.height; j += 20) {
        if ((i + j) % 40 === 0) {
          p.rect(screenX + i, screenY + j, 10, 10);
        }
      }
    }
    
    p.pop();
  }
}

// Loop class (circular track)
export class Loop {
  constructor(x, y, radius) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    
    gameState.loops.push(this);
  }
  
  contains(px, py) {
    const dx = px - this.x;
    const dy = py - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < this.radius + 20 && distance > this.radius - 20;
  }
  
  applyPhysics(player) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Push player to the loop path
    const targetDistance = this.radius;
    const diff = distance - targetDistance;
    
    const normalX = dx / distance;
    const normalY = dy / distance;
    
    player.x -= normalX * diff;
    player.y -= normalY * diff;
    
    // Apply centripetal force
    const speed = Math.sqrt(player.vx * player.vx + player.vy * player.vy);
    if (speed < 3) {
      // Too slow, fall off
      player.inLoop = false;
      player.vy = 2;
    }
  }
  
  render(p) {
    const screenX = this.x - gameState.cameraX;
    const screenY = this.y - gameState.cameraY;
    
    p.push();
    p.noFill();
    p.stroke(100, 200, 255);
    p.strokeWeight(20);
    p.ellipse(screenX, screenY, this.radius * 2, this.radius * 2);
    
    // Inner track
    p.stroke(50, 150, 200);
    p.strokeWeight(2);
    p.ellipse(screenX, screenY, this.radius * 2, this.radius * 2);
    
    p.pop();
  }
}

// Giant ring for special stage access
export class GiantRing {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 40;
    this.rotation = 0;
    this.activated = false;
    
    gameState.giantRings.push(this);
  }
  
  update() {
    this.rotation += 0.05;
  }
  
  activate() {
    if (this.activated) return;
    
    this.activated = true;
    gameState.specialStageActive = true;
    
    // Remove from array
    const index = gameState.giantRings.indexOf(this);
    if (index > -1) gameState.giantRings.splice(index, 1);
  }
  
  render(p) {
    const screenX = this.x - gameState.cameraX;
    const screenY = this.y - gameState.cameraY;
    
    p.push();
    p.translate(screenX, screenY);
    p.rotate(this.rotation);
    
    // Outer glow
    p.fill(255, 255, 0, 50);
    p.noStroke();
    p.ellipse(0, 0, this.radius * 3, this.radius * 3);
    
    // Main ring
    p.fill(255, 215, 0);
    p.stroke(255, 180, 0);
    p.strokeWeight(4);
    p.ellipse(0, 0, this.radius * 2, this.radius * 2);
    
    // Inner ring
    p.fill(50, 50, 150);
    p.ellipse(0, 0, this.radius, this.radius);
    
    p.pop();
  }
}

// Special Stage ring (collectible in special stage)
export class SpecialStageRing {
  constructor(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z; // Depth for 3D effect
    this.radius = 20;
    this.collected = false;
    
    gameState.specialStageRings.push(this);
  }
  
  update() {
    this.z -= 5; // Move toward player
    
    if (this.z < 0) {
      this.remove();
    }
  }
  
  collect() {
    if (this.collected) return;
    
    this.collected = true;
    gameState.score += 50;
    
    // Check if this completes the special stage
    const remaining = gameState.specialStageRings.filter(r => !r.collected).length;
    if (remaining === 0) {
      completeSpecialStage();
    }
    
    this.remove();
  }
  
  remove() {
    const index = gameState.specialStageRings.indexOf(this);
    if (index > -1) gameState.specialStageRings.splice(index, 1);
  }
  
  render(p) {
    const scale = 500 / (this.z + 500);
    const screenX = CANVAS_WIDTH / 2 + (this.x - CANVAS_WIDTH / 2) * scale;
    const screenY = CANVAS_HEIGHT / 2 + (this.y - CANVAS_HEIGHT / 2) * scale;
    const size = this.radius * scale;
    
    p.push();
    p.fill(255, 215, 0, 200);
    p.stroke(255, 180, 0);
    p.strokeWeight(2);
    p.ellipse(screenX, screenY, size * 2, size * 2);
    p.pop();
  }
}

// Helper function to spawn giant ring
function spawnGiantRing() {
  const x = gameState.player.x + 100;
  const y = gameState.player.y - 50;
  new GiantRing(x, y);
}

// Helper function to complete special stage
function completeSpecialStage() {
  gameState.specialStageComplete = true;
  gameState.chaosEmeralds++;
  gameState.score += 5000;
  
  // Exit special stage after delay
  setTimeout(() => {
    gameState.specialStageActive = false;
    gameState.specialStageComplete = false;
  }, 2000);
}