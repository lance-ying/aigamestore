// entities.js - Entity classes for all game objects

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_CONFIG } from './globals.js';
import { createExplosion, createSmokeTrail } from './particles.js';

// Player aircraft class
export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 40;
    this.height = 30;
    this.vx = 0;
    this.vy = 0;
    this.angle = 0;
    this.targetAngle = 0;
    
    // Combat stats
    this.health = GAME_CONFIG.playerMaxHealth;
    this.maxHealth = GAME_CONFIG.playerMaxHealth;
    this.shield = GAME_CONFIG.playerMaxShield;
    this.maxShield = GAME_CONFIG.playerMaxShield;
    this.missiles = GAME_CONFIG.missileMaxCount;
    this.maxMissiles = GAME_CONFIG.missileMaxCount;
    
    // State
    this.isAfterburning = false;
    this.fireTimer = 0;
    this.fireRate = 8; // Frames between shots
    this.invulnerableTimer = 0;
    
    // Animation
    this.thrustOffset = 0;
    this.lastPosition = { x: x, y: y };
    
    gameState.player = this;
  }
  
  update(p) {
    // Shield regeneration
    if (this.shield < this.maxShield) {
      this.shield = Math.min(this.maxShield, this.shield + GAME_CONFIG.shieldRegenRate);
    }
    
    // Invulnerability frames
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer--;
    }
    
    // Update position
    this.x += this.vx;
    this.y += this.vy;
    
    // Apply drag
    this.vx *= 0.95;
    this.vy *= 0.95;
    
    // Clamp to screen bounds
    this.x = p.constrain(this.x, this.width / 2, CANVAS_WIDTH - this.width / 2);
    this.y = p.constrain(this.y, this.height / 2, CANVAS_HEIGHT - this.height / 2);
    
    // Smooth angle rotation
    this.angle += (this.targetAngle - this.angle) * 0.15;
    
    // Thrust animation
    this.thrustOffset = (this.thrustOffset + 0.3) % (p.TWO_PI);
    
    // Fire rate timer
    if (this.fireTimer > 0) {
      this.fireTimer--;
    }
    
    // Log position changes
    if (Math.abs(this.x - this.lastPosition.x) > 1 || 
        Math.abs(this.y - this.lastPosition.y) > 1) {
      this.logPosition(p);
      this.lastPosition.x = this.x;
      this.lastPosition.y = this.y;
    }
  }
  
  move(dx, dy) {
    const speed = this.isAfterburning ? GAME_CONFIG.playerAfterburnerSpeed : GAME_CONFIG.playerSpeed;
    this.vx += dx * speed * 0.2;
    this.vy += dy * speed * 0.2;
    
    // Update target angle based on movement
    if (dx !== 0 || dy !== 0) {
      this.targetAngle = Math.atan2(dy, dx);
    }
  }
  
  setAfterburner(active) {
    this.isAfterburning = active;
  }
  
  fireBullet(p) {
    if (this.fireTimer > 0) return;
    
    const bullet = new Bullet(
      this.x + Math.cos(this.angle) * 20,
      this.y + Math.sin(this.angle) * 20,
      this.angle,
      true
    );
    gameState.bullets.push(bullet);
    gameState.entities.push(bullet);
    
    this.fireTimer = this.fireRate;
  }
  
  fireMissile(p) {
    if (this.missiles <= 0) return;
    if (!gameState.lockedTarget) return;
    
    const missile = new Missile(
      this.x,
      this.y,
      gameState.lockedTarget,
      true
    );
    gameState.missiles.push(missile);
    gameState.entities.push(missile);
    
    this.missiles--;
    gameState.lockedTarget = null;
    gameState.lockProgress = 0;
  }
  
  takeDamage(amount) {
    if (this.invulnerableTimer > 0) return;
    
    // Shield absorbs damage first
    if (this.shield > 0) {
      const shieldDamage = Math.min(this.shield, amount);
      this.shield -= shieldDamage;
      amount -= shieldDamage;
    }
    
    // Remaining damage to health
    if (amount > 0) {
      this.health -= amount;
      this.invulnerableTimer = 30; // Brief invulnerability
    }
    
    if (this.health <= 0) {
      this.die(p);
    }
  }
  
  die(p) {
    createExplosion(p, this.x, this.y, 40, [255, 100, 0]);
    gameState.gamePhase = "GAME_OVER_LOSE";
  }
  
  logPosition(p) {
    if (p.logs && p.logs.player_info) {
      p.logs.player_info.push({
        screen_x: this.x,
        screen_y: this.y,
        game_x: this.x,
        game_y: this.y,
        health: this.health,
        shield: this.shield,
        framecount: gameState.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  render(p) {
    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.angle);
    
    // Afterburner effect
    if (this.isAfterburning) {
      const flameLength = 25 + Math.sin(this.thrustOffset) * 5;
      p.fill(255, 150, 0, 200);
      p.noStroke();
      p.triangle(-20, 0, -20 - flameLength, -8, -20 - flameLength, 8);
      p.fill(255, 255, 100, 150);
      p.triangle(-20, 0, -20 - flameLength * 0.7, -5, -20 - flameLength * 0.7, 5);
    }
    
    // Aircraft body (F-16 inspired)
    p.fill(100, 120, 140);
    p.stroke(80, 100, 120);
    p.strokeWeight(1);
    
    // Main fuselage
    p.beginShape();
    p.vertex(20, 0);
    p.vertex(10, -8);
    p.vertex(-15, -8);
    p.vertex(-20, -4);
    p.vertex(-20, 4);
    p.vertex(-15, 8);
    p.vertex(10, 8);
    p.endShape(p.CLOSE);
    
    // Wings
    p.fill(120, 140, 160);
    p.triangle(5, 0, -5, -15, -5, 15);
    p.triangle(-8, 0, -12, -10, -12, 10);
    
    // Cockpit
    p.fill(50, 100, 150, 180);
    p.ellipse(8, 0, 10, 8);
    
    // Weapon hardpoints
    p.fill(80, 80, 80);
    p.rect(-2, -12, 4, 3);
    p.rect(-2, 9, 4, 3);
    
    // Invulnerability flash
    if (this.invulnerableTimer > 0 && this.invulnerableTimer % 6 < 3) {
      p.noFill();
      p.stroke(255, 255, 255, 200);
      p.strokeWeight(2);
      p.ellipse(0, 0, this.width + 5, this.height + 5);
    }
    
    p.pop();
    
    // Target lock indicator
    if (gameState.lockedTarget && gameState.lockProgress >= 1) {
      const target = gameState.lockedTarget;
      p.push();
      p.noFill();
      p.stroke(255, 0, 0);
      p.strokeWeight(2);
      p.drawingContext.setLineDash([5, 5]);
      p.line(this.x, this.y, target.x, target.y);
      p.drawingContext.setLineDash([]);
      p.pop();
    }
  }
}

// Enemy aircraft class
export class Enemy {
  constructor(x, y, type = 'fighter') {
    this.x = x;
    this.y = y;
    this.width = 35;
    this.height = 25;
    this.type = type; // 'fighter', 'bomber', 'interceptor'
    this.angle = Math.PI; // Start facing left
    this.vx = 0;
    this.vy = 0;
    
    // Type-specific properties
    switch (type) {
      case 'bomber':
        this.health = 60;
        this.speed = 1.5;
        this.damage = 20;
        this.scoreValue = 150;
        this.color = [140, 100, 60];
        break;
      case 'interceptor':
        this.health = 30;
        this.speed = 3;
        this.damage = 10;
        this.scoreValue = 100;
        this.color = [100, 100, 140];
        break;
      default: // fighter
        this.health = 40;
        this.speed = 2;
        this.damage = 15;
        this.scoreValue = 75;
        this.color = [140, 60, 60];
    }
    
    this.maxHealth = this.health;
    this.fireTimer = 0;
    this.fireRate = 60 + Math.random() * 60;
    this.aiTimer = 0;
    this.aiPattern = Math.floor(Math.random() * 3);
    
    gameState.enemies.push(this);
    gameState.entities.push(this);
  }
  
  update(p) {
    if (!gameState.player) return;
    
    // AI behavior
    this.aiTimer++;
    
    const dx = gameState.player.x - this.x;
    const dy = gameState.player.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Update angle to face player
    this.angle = Math.atan2(dy, dx);
    
    // Different AI patterns
    switch (this.aiPattern) {
      case 0: // Direct approach
        this.vx = Math.cos(this.angle) * this.speed;
        this.vy = Math.sin(this.angle) * this.speed;
        break;
      case 1: // Circling
        const circleAngle = this.angle + Math.PI / 2;
        this.vx = Math.cos(circleAngle) * this.speed * 0.7;
        this.vy = Math.sin(circleAngle) * this.speed * 0.7;
        break;
      case 2: // Weaving
        const waveOffset = Math.sin(this.aiTimer * 0.05) * 2;
        this.vx = Math.cos(this.angle) * this.speed;
        this.vy = Math.sin(this.angle) * this.speed + waveOffset;
        break;
    }
    
    this.x += this.vx;
    this.y += this.vy;
    
    // Fire at player
    this.fireTimer++;
    if (this.fireTimer >= this.fireRate && distance < 300) {
      this.fireBullet(p);
      this.fireTimer = 0;
    }
    
    // Remove if off screen (left side)
    if (this.x < -50) {
      this.remove();
    }
    
    // Smoke trail when damaged
    if (this.health < this.maxHealth * 0.5 && gameState.frameCount % 3 === 0) {
      createSmokeTrail(p, this.x, this.y);
    }
  }
  
  fireBullet(p) {
    const bullet = new Bullet(
      this.x + Math.cos(this.angle) * 15,
      this.y + Math.sin(this.angle) * 15,
      this.angle,
      false
    );
    gameState.enemyBullets.push(bullet);
    gameState.entities.push(bullet);
  }
  
  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.die();
    }
  }
  
  die() {
    createExplosion(window.gameInstance, this.x, this.y, 30, this.color);
    gameState.score += this.scoreValue;
    gameState.enemiesDestroyed++;
    gameState.missionProgress += 10;
    this.remove();
  }
  
  remove() {
    const enemyIndex = gameState.enemies.indexOf(this);
    if (enemyIndex > -1) {
      gameState.enemies.splice(enemyIndex, 1);
    }
    const entityIndex = gameState.entities.indexOf(this);
    if (entityIndex > -1) {
      gameState.entities.splice(entityIndex, 1);
    }
  }
  
  render(p) {
    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.angle);
    
    // Aircraft body
    p.fill(...this.color);
    p.stroke(this.color[0] - 20, this.color[1] - 20, this.color[2] - 20);
    p.strokeWeight(1);
    
    // Main fuselage
    p.beginShape();
    p.vertex(15, 0);
    p.vertex(8, -6);
    p.vertex(-12, -6);
    p.vertex(-15, -3);
    p.vertex(-15, 3);
    p.vertex(-12, 6);
    p.vertex(8, 6);
    p.endShape(p.CLOSE);
    
    // Wings
    p.fill(this.color[0] + 20, this.color[1] + 20, this.color[2] + 20);
    p.triangle(3, 0, -3, -12, -3, 12);
    
    // Health bar
    if (this.health < this.maxHealth) {
      const barWidth = 30;
      const barHeight = 3;
      const healthRatio = this.health / this.maxHealth;
      
      p.translate(0, -15);
      p.fill(60, 0, 0);
      p.noStroke();
      p.rect(-barWidth / 2, 0, barWidth, barHeight);
      p.fill(255, 0, 0);
      p.rect(-barWidth / 2, 0, barWidth * healthRatio, barHeight);
    }
    
    p.pop();
  }
}

// Ground target class
export class GroundTarget {
  constructor(x, y, type = 'tank') {
    this.x = x;
    this.y = y;
    this.width = 30;
    this.height = 20;
    this.type = type; // 'tank', 'turret', 'installation'
    
    switch (type) {
      case 'turret':
        this.health = 50;
        this.scoreValue = 100;
        this.canFire = true;
        this.fireRate = 120;
        break;
      case 'installation':
        this.health = 100;
        this.scoreValue = 200;
        this.canFire = false;
        this.width = 40;
        this.height = 30;
        break;
      default: // tank
        this.health = 40;
        this.scoreValue = 50;
        this.canFire = false;
    }
    
    this.maxHealth = this.health;
    this.fireTimer = 0;
    this.turretAngle = -Math.PI / 2; // Point up
    
    gameState.groundTargets.push(this);
    gameState.entities.push(this);
  }
  
  update(p) {
    if (this.canFire && gameState.player) {
      // Aim at player
      const dx = gameState.player.x - this.x;
      const dy = gameState.player.y - this.y;
      this.turretAngle = Math.atan2(dy, dx);
      
      // Fire at player
      this.fireTimer++;
      if (this.fireTimer >= this.fireRate) {
        this.fireBullet(p);
        this.fireTimer = 0;
      }
    }
  }
  
  fireBullet(p) {
    const bullet = new Bullet(
      this.x + Math.cos(this.turretAngle) * 15,
      this.y + Math.sin(this.turretAngle) * 15,
      this.turretAngle,
      false
    );
    gameState.enemyBullets.push(bullet);
    gameState.entities.push(bullet);
  }
  
  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.die();
    }
  }
  
  die() {
    createExplosion(window.gameInstance, this.x, this.y, 35, [200, 100, 0]);
    gameState.score += this.scoreValue;
    gameState.groundTargetsDestroyed++;
    gameState.missionProgress += 15;
    this.remove();
  }
  
  remove() {
    const index = gameState.groundTargets.indexOf(this);
    if (index > -1) {
      gameState.groundTargets.splice(index, 1);
    }
    const entityIndex = gameState.entities.indexOf(this);
    if (entityIndex > -1) {
      gameState.entities.splice(entityIndex, 1);
    }
  }
  
  render(p) {
    p.push();
    p.translate(this.x, this.y);
    
    if (this.type === 'turret') {
      // Base
      p.fill(80, 80, 60);
      p.stroke(60, 60, 40);
      p.strokeWeight(1);
      p.rect(-15, -10, 30, 20);
      
      // Turret
      p.push();
      p.rotate(this.turretAngle);
      p.fill(100, 100, 80);
      p.rect(0, -4, 18, 8);
      p.pop();
    } else if (this.type === 'installation') {
      // Large structure
      p.fill(70, 70, 70);
      p.stroke(50, 50, 50);
      p.strokeWeight(1);
      p.rect(-20, -15, 40, 30);
      p.fill(90, 90, 90);
      p.rect(-15, -20, 30, 8);
      p.fill(200, 50, 50);
      p.rect(-5, -25, 10, 5);
    } else { // tank
      // Hull
      p.fill(60, 80, 60);
      p.stroke(40, 60, 40);
      p.strokeWeight(1);
      p.rect(-12, -8, 24, 16);
      
      // Turret
      p.fill(80, 100, 80);
      p.ellipse(0, 0, 16, 14);
      p.rect(0, -3, 15, 6);
      
      // Treads
      p.fill(40, 40, 40);
      p.rect(-13, -10, 3, 20);
      p.rect(10, -10, 3, 20);
    }
    
    // Health bar
    if (this.health < this.maxHealth) {
      const barWidth = 30;
      const barHeight = 3;
      const healthRatio = this.health / this.maxHealth;
      
      p.translate(0, -this.height / 2 - 5);
      p.fill(60, 0, 0);
      p.noStroke();
      p.rect(-barWidth / 2, 0, barWidth, barHeight);
      p.fill(255, 0, 0);
      p.rect(-barWidth / 2, 0, barWidth * healthRatio, barHeight);
    }
    
    p.pop();
  }
}

// Bullet class
export class Bullet {
  constructor(x, y, angle, isPlayerBullet) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.speed = GAME_CONFIG.bulletSpeed;
    this.vx = Math.cos(angle) * this.speed;
    this.vy = Math.sin(angle) * this.speed;
    this.radius = 3;
    this.damage = isPlayerBullet ? 10 : 5;
    this.isPlayerBullet = isPlayerBullet;
    this.lifetime = 120;
    this.age = 0;
  }
  
  update(p) {
    this.x += this.vx;
    this.y += this.vy;
    this.age++;
    
    // Remove if off screen or expired
    if (this.x < -10 || this.x > CANVAS_WIDTH + 10 ||
        this.y < -10 || this.y > CANVAS_HEIGHT + 10 ||
        this.age >= this.lifetime) {
      this.remove();
      return;
    }
    
    // Check collisions
    if (this.isPlayerBullet) {
      // Check enemy collisions
      for (const enemy of gameState.enemies) {
        if (this.checkCollision(enemy)) {
          enemy.takeDamage(this.damage);
          this.remove();
          return;
        }
      }
      
      // Check ground target collisions
      for (const target of gameState.groundTargets) {
        if (this.checkCollision(target)) {
          target.takeDamage(this.damage);
          this.remove();
          return;
        }
      }
    } else {
      // Check player collision
      if (gameState.player && this.checkCollision(gameState.player)) {
        gameState.player.takeDamage(this.damage);
        this.remove();
        return;
      }
    }
  }
  
  checkCollision(entity) {
    const dx = entity.x - this.x;
    const dy = entity.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < this.radius + (entity.width / 2);
  }
  
  remove() {
    const bulletArray = this.isPlayerBullet ? gameState.bullets : gameState.enemyBullets;
    const index = bulletArray.indexOf(this);
    if (index > -1) {
      bulletArray.splice(index, 1);
    }
    const entityIndex = gameState.entities.indexOf(this);
    if (entityIndex > -1) {
      gameState.entities.splice(entityIndex, 1);
    }
  }
  
  render(p) {
    p.push();
    p.noStroke();
    if (this.isPlayerBullet) {
      p.fill(255, 255, 100);
    } else {
      p.fill(255, 100, 100);
    }
    
    // Draw bullet with motion trail
    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.angle);
    p.ellipse(0, 0, this.radius * 2, this.radius);
    p.fill(255, 200, 100, 100);
    p.ellipse(-4, 0, this.radius * 3, this.radius * 0.8);
    p.pop();
    
    p.pop();
  }
}

// Missile class
export class Missile {
  constructor(x, y, target, isPlayerMissile) {
    this.x = x;
    this.y = y;
    this.target = target;
    this.isPlayerMissile = isPlayerMissile;
    this.speed = GAME_CONFIG.missileSpeed;
    this.vx = 0;
    this.vy = 0;
    this.angle = 0;
    this.damage = 30;
    this.turnRate = 0.08;
    this.lifetime = 300;
    this.age = 0;
    this.radius = 5;
    this.trailTimer = 0;
  }
  
  update(p) {
    this.age++;
    
    // Remove if expired
    if (this.age >= this.lifetime) {
      this.remove();
      return;
    }
    
    // Track target
    if (this.target && gameState.entities.includes(this.target)) {
      const dx = this.target.x - this.x;
      const dy = this.target.y - this.y;
      const targetAngle = Math.atan2(dy, dx);
      
      // Smooth turning
      let angleDiff = targetAngle - this.angle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      this.angle += angleDiff * this.turnRate;
    }
    
    // Update velocity
    this.vx = Math.cos(this.angle) * this.speed;
    this.vy = Math.sin(this.angle) * this.speed;
    this.x += this.vx;
    this.y += this.vy;
    
    // Smoke trail
    this.trailTimer++;
    if (this.trailTimer >= 2) {
      createSmokeTrail(p, this.x, this.y);
      this.trailTimer = 0;
    }
    
    // Remove if off screen
    if (this.x < -50 || this.x > CANVAS_WIDTH + 50 ||
        this.y < -50 || this.y > CANVAS_HEIGHT + 50) {
      this.remove();
      return;
    }
    
    // Check collision with target
    if (this.target && this.checkCollision(this.target)) {
      this.target.takeDamage(this.damage);
      createExplosion(p, this.x, this.y, 25, [255, 200, 0]);
      this.remove();
    }
  }
  
  checkCollision(entity) {
    const dx = entity.x - this.x;
    const dy = entity.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < this.radius + (entity.width / 2);
  }
  
  remove() {
    const index = gameState.missiles.indexOf(this);
    if (index > -1) {
      gameState.missiles.splice(index, 1);
    }
    const entityIndex = gameState.entities.indexOf(this);
    if (entityIndex > -1) {
      gameState.entities.splice(entityIndex, 1);
    }
  }
  
  render(p) {
    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.angle);
    
    // Exhaust
    p.fill(255, 150, 0);
    p.noStroke();
    p.triangle(-8, 0, -12, -3, -12, 3);
    
    // Body
    p.fill(180, 180, 180);
    p.stroke(120, 120, 120);
    p.strokeWeight(1);
    p.beginShape();
    p.vertex(8, 0);
    p.vertex(4, -3);
    p.vertex(-8, -3);
    p.vertex(-8, 3);
    p.vertex(4, 3);
    p.endShape(p.CLOSE);
    
    // Fins
    p.fill(200, 200, 200);
    p.triangle(-4, -3, -6, -6, -2, -3);
    p.triangle(-4, 3, -6, 6, -2, 3);
    
    p.pop();
  }
}

// Power-up class
export class PowerUp {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type; // 'health', 'shield', 'missiles', 'score'
    this.radius = 12;
    this.rotation = 0;
    this.bobOffset = 0;
    this.bobSpeed = 0.1;
    this.initialY = y;
    this.vx = -1; // Scroll left
    
    gameState.powerUps.push(this);
    gameState.entities.push(this);
  }
  
  update(p) {
    this.x += this.vx;
    this.rotation += 0.05;
    this.bobOffset = Math.sin(gameState.frameCount * this.bobSpeed) * 5;
    this.y = this.initialY + this.bobOffset;
    
    // Remove if off screen
    if (this.x < -30) {
      this.remove();
      return;
    }
    
    // Check collision with player
    if (gameState.player) {
      const dx = gameState.player.x - this.x;
      const dy = gameState.player.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < this.radius + gameState.player.width / 2) {
        this.collect();
      }
    }
  }
  
  collect() {
    const player = gameState.player;
    if (!player) return;
    
    switch (this.type) {
      case 'health':
        player.health = Math.min(player.maxHealth, player.health + 30);
        break;
      case 'shield':
        player.shield = Math.min(player.maxShield, player.shield + 25);
        break;
      case 'missiles':
        player.missiles = Math.min(player.maxMissiles, player.missiles + 3);
        break;
      case 'score':
        gameState.score += 100;
        break;
    }
    
    this.remove();
  }
  
  remove() {
    const index = gameState.powerUps.indexOf(this);
    if (index > -1) {
      gameState.powerUps.splice(index, 1);
    }
    const entityIndex = gameState.entities.indexOf(this);
    if (entityIndex > -1) {
      gameState.entities.splice(entityIndex, 1);
    }
  }
  
  render(p) {
    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.rotation);
    
    // Outer glow
    p.noFill();
    p.stroke(this.getColor(p)[0], this.getColor(p)[1], this.getColor(p)[2], 100);
    p.strokeWeight(3);
    p.circle(0, 0, this.radius * 2 + 5);
    
    // Main shape
    p.fill(...this.getColor(p));
    p.stroke(255);
    p.strokeWeight(2);
    
    if (this.type === 'missiles') {
      this.drawStar(p, 0, 0, this.radius, this.radius * 0.5, 5);
    } else {
      p.circle(0, 0, this.radius * 2);
    }
    
    // Icon
    p.noStroke();
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(12);
    const icon = this.getIcon();
    p.text(icon, 0, 0);
    
    p.pop();
  }
  
  getColor(p) {
    switch (this.type) {
      case 'health': return [0, 255, 0];
      case 'shield': return [0, 150, 255];
      case 'missiles': return [255, 100, 0];
      case 'score': return [255, 255, 0];
      default: return [255, 255, 255];
    }
  }
  
  getIcon() {
    switch (this.type) {
      case 'health': return '+';
      case 'shield': return 'S';
      case 'missiles': return 'M';
      case 'score': return '$';
      default: return '?';
    }
  }
  
  drawStar(p, x, y, radius1, radius2, npoints) {
    const angle = p.TWO_PI / npoints;
    const halfAngle = angle / 2.0;
    p.beginShape();
    for (let a = -p.PI / 2; a < p.TWO_PI - p.PI / 2; a += angle) {
      let sx = x + Math.cos(a) * radius1;
      let sy = y + Math.sin(a) * radius1;
      p.vertex(sx, sy);
      sx = x + Math.cos(a + halfAngle) * radius2;
      sy = y + Math.sin(a + halfAngle) * radius2;
      p.vertex(sx, sy);
    }
    p.endShape(p.CLOSE);
  }
}