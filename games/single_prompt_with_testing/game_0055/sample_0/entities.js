// entities.js - Entity classes for player, enemies, and power-ups

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_CONSTANTS } from './globals.js';
import { createParticleBurst, createBloodSplatter, SlashEffect } from './particles.js';

// Player class
export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 24;
    this.height = 24;
    this.radius = 12;
    
    // Physics
    this.vx = 0;
    this.vy = 0;
    this.speed = GAME_CONSTANTS.PLAYER_SPEED;
    
    // Combat
    this.health = GAME_CONSTANTS.PLAYER_MAX_HEALTH;
    this.maxHealth = GAME_CONSTANTS.PLAYER_MAX_HEALTH;
    this.swordActive = false;
    this.swordCooldown = 0;
    this.swordAngle = 0;
    this.damageFlash = 0;
    this.invulnerable = false;
    this.invulnerabilityTimer = 0;
    
    // Abilities
    this.isDashing = false;
    this.dashTimer = 0;
    this.dashCooldown = 0;
    this.dashDirection = { x: 0, y: 0 };
    
    // Animation
    this.facing = 1; // 1 = right, -1 = left
    this.walkCycle = 0;
    
    gameState.player = this;
    gameState.entities.push(this);
  }
  
  update(p) {
    // Update timers
    if (this.swordCooldown > 0) this.swordCooldown--;
    if (this.dashCooldown > 0) this.dashCooldown--;
    if (this.damageFlash > 0) this.damageFlash--;
    
    // Handle invulnerability
    if (this.invulnerable) {
      this.invulnerabilityTimer--;
      if (this.invulnerabilityTimer <= 0) {
        this.invulnerable = false;
      }
    }
    
    // Handle dash
    if (this.isDashing) {
      this.dashTimer--;
      this.vx = this.dashDirection.x * GAME_CONSTANTS.PLAYER_DASH_SPEED;
      this.vy = this.dashDirection.y * GAME_CONSTANTS.PLAYER_DASH_SPEED;
      
      if (this.dashTimer <= 0) {
        this.isDashing = false;
        this.vx = 0;
        this.vy = 0;
      }
    }
    
    // Update position
    this.x += this.vx;
    this.y += this.vy;
    
    // Boundary collision
    this.x = p.constrain(this.x, this.radius, CANVAS_WIDTH - this.radius);
    this.y = p.constrain(this.y, this.radius, CANVAS_HEIGHT - this.radius);
    
    // Update walk cycle
    if (Math.abs(this.vx) > 0 || Math.abs(this.vy) > 0) {
      this.walkCycle += 0.2;
    }
    
    // Update facing direction
    if (this.vx > 0) this.facing = 1;
    else if (this.vx < 0) this.facing = -1;
    
    // Update sword angle to face nearest enemy
    this.updateSwordAngle();
  }
  
  updateSwordAngle() {
    let nearestEnemy = null;
    let minDist = Infinity;
    
    for (const enemy of gameState.enemies) {
      const dx = enemy.x - this.x;
      const dy = enemy.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < minDist) {
        minDist = dist;
        nearestEnemy = enemy;
      }
    }
    
    if (nearestEnemy) {
      const dx = nearestEnemy.x - this.x;
      const dy = nearestEnemy.y - this.y;
      this.swordAngle = Math.atan2(dy, dx);
    }
  }
  
  move(dx, dy) {
    if (!this.isDashing) {
      this.vx = dx * this.speed;
      this.vy = dy * this.speed;
    }
  }
  
  dash() {
    if (this.dashCooldown <= 0 && !this.isDashing) {
      // Determine dash direction
      let dx = 0, dy = 0;
      
      if (this.vx !== 0 || this.vy !== 0) {
        const mag = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        dx = this.vx / mag;
        dy = this.vy / mag;
      } else {
        // Dash in facing direction if not moving
        dx = this.facing;
        dy = 0;
      }
      
      this.dashDirection = { x: dx, y: dy };
      this.isDashing = true;
      this.dashTimer = GAME_CONSTANTS.PLAYER_DASH_DURATION;
      this.dashCooldown = GAME_CONSTANTS.PLAYER_DASH_COOLDOWN;
      this.invulnerable = true;
      this.invulnerabilityTimer = GAME_CONSTANTS.PLAYER_DASH_DURATION;
      
      // Create dash particles
      createParticleBurst(this.x, this.y, 8, [100, 200, 255]);
    }
  }
  
  attack(p) {
    if (this.swordCooldown <= 0) {
      this.swordActive = true;
      this.swordCooldown = GAME_CONSTANTS.PLAYER_SWORD_COOLDOWN;
      
      // Create slash effect
      gameState.slashEffects.push(new SlashEffect(
        this.x,
        this.y,
        this.swordAngle,
        GAME_CONSTANTS.PLAYER_SWORD_RANGE
      ));
      
      // Check for hits
      this.checkSwordHits(p);
    }
  }
  
  checkSwordHits(p) {
    for (let i = gameState.enemies.length - 1; i >= 0; i--) {
      const enemy = gameState.enemies[i];
      const dx = enemy.x - this.x;
      const dy = enemy.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < GAME_CONSTANTS.PLAYER_SWORD_RANGE) {
        // Check if enemy is in sword arc
        const angleToEnemy = Math.atan2(dy, dx);
        const angleDiff = Math.abs(angleToEnemy - this.swordAngle);
        
        if (angleDiff < Math.PI / 3) { // 60 degree arc
          enemy.takeDamage(GAME_CONSTANTS.PLAYER_SWORD_DAMAGE);
          gameState.screenShake = 5;
        }
      }
    }
  }
  
  takeDamage(amount) {
    if (!this.invulnerable) {
      this.health = Math.max(0, this.health - amount);
      this.damageFlash = 10;
      gameState.screenShake = 8;
      
      // Create blood particles
      createBloodSplatter(this.x, this.y, 15);
      
      if (this.health <= 0) {
        this.die();
      }
    }
  }
  
  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }
  
  die() {
    createParticleBurst(this.x, this.y, 30, [255, 0, 0]);
    gameState.gamePhase = "GAME_OVER_LOSE";
  }
  
  render(p) {
    p.push();
    p.translate(this.x, this.y);
    
    // Dash trail effect
    if (this.isDashing) {
      p.fill(100, 200, 255, 100);
      p.noStroke();
      p.circle(0, 0, this.radius * 3);
    }
    
    // Invulnerability flash
    if (this.invulnerable && Math.floor(gameState.frameCount / 3) % 2 === 0) {
      p.push();
      p.pop();
      return; // Skip rendering for flash effect
    }
    
    // Damage flash
    if (this.damageFlash > 0) {
      p.fill(255, 100, 100);
    } else {
      p.fill(80, 150, 255);
    }
    
    // Draw body
    p.stroke(255);
    p.strokeWeight(2);
    
    if (this.facing > 0) {
      p.scale(1, 1);
    } else {
      p.scale(-1, 1);
    }
    
    // Body
    p.rectMode(p.CENTER);
    p.rect(0, 0, this.width, this.height, 4);
    
    // Head
    p.fill(220, 180, 140);
    p.circle(0, -8, 14);
    
    // Eyes
    p.fill(0);
    p.circle(-3, -9, 3);
    p.circle(3, -9, 3);
    
    // Arms with walk animation
    const armOffset = Math.sin(this.walkCycle) * 3;
    p.stroke(255);
    p.strokeWeight(3);
    p.line(-8, 2, -12, 8 + armOffset);
    p.line(8, 2, 12, 8 - armOffset);
    
    // Legs with walk animation
    const legOffset = Math.sin(this.walkCycle + Math.PI) * 4;
    p.line(-4, 10, -6, 18 + legOffset);
    p.line(4, 10, 6, 18 - legOffset);
    
    p.pop();
    
    // Draw sword
    if (this.swordCooldown > 0) {
      this.renderSword(p);
    }
  }
  
  renderSword(p) {
    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.swordAngle);
    
    const swingProgress = 1 - (this.swordCooldown / GAME_CONSTANTS.PLAYER_SWORD_COOLDOWN);
    const swingAngle = swingProgress * Math.PI / 2 - Math.PI / 4;
    p.rotate(swingAngle);
    
    // Sword blade
    p.stroke(200, 200, 255);
    p.strokeWeight(4);
    p.line(10, 0, 30, 0);
    
    // Sword tip
    p.stroke(255, 255, 255);
    p.strokeWeight(2);
    p.line(30, 0, 35, 0);
    
    p.pop();
  }
}

// Enemy class
export class Enemy {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 15;
    
    // Physics
    this.vx = 0;
    this.vy = 0;
    this.speed = GAME_CONSTANTS.ENEMY_BASE_SPEED * gameState.difficultyMultiplier;
    
    // Combat
    this.health = GAME_CONSTANTS.ENEMY_HEALTH;
    this.maxHealth = GAME_CONSTANTS.ENEMY_HEALTH;
    this.damage = GAME_CONSTANTS.ENEMY_DAMAGE;
    this.touchCooldown = 0;
    
    // Visuals
    this.damageFlash = 0;
    this.type = Math.floor(Math.random() * 3); // Different enemy types
    this.walkCycle = Math.random() * Math.PI * 2;
    
    gameState.enemies.push(this);
    gameState.entities.push(this);
  }
  
  update(p) {
    if (!gameState.player) return;
    
    // Update timers
    if (this.touchCooldown > 0) this.touchCooldown--;
    if (this.damageFlash > 0) this.damageFlash--;
    
    // Move towards player
    const dx = gameState.player.x - this.x;
    const dy = gameState.player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 0) {
      this.vx = (dx / dist) * this.speed;
      this.vy = (dy / dist) * this.speed;
    }
    
    this.x += this.vx;
    this.y += this.vy;
    
    // Update walk cycle
    this.walkCycle += 0.15;
    
    // Check collision with player
    if (this.touchCooldown <= 0) {
      const playerDist = Math.sqrt(
        Math.pow(this.x - gameState.player.x, 2) +
        Math.pow(this.y - gameState.player.y, 2)
      );
      
      if (playerDist < this.radius + gameState.player.radius) {
        gameState.player.takeDamage(this.damage);
        this.touchCooldown = GAME_CONSTANTS.ENEMY_TOUCH_COOLDOWN;
      }
    }
  }
  
  takeDamage(amount) {
    this.health -= amount;
    this.damageFlash = 5;
    
    if (this.health <= 0) {
      this.die();
    }
  }
  
  die() {
    // Award points
    gameState.score += 3;
    gameState.enemiesDefeated++;
    
    // Create particles
    createBloodSplatter(this.x, this.y, 20);
    
    // Remove from arrays
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
    
    // Damage flash
    if (this.damageFlash > 0) {
      p.fill(255, 150, 150);
    } else {
      // Different colors for types
      if (this.type === 0) {
        p.fill(255, 50, 50);
      } else if (this.type === 1) {
        p.fill(200, 50, 100);
      } else {
        p.fill(150, 50, 150);
      }
    }
    
    // Body
    p.stroke(0);
    p.strokeWeight(2);
    p.rectMode(p.CENTER);
    p.rect(0, 0, this.radius * 1.8, this.radius * 2, 3);
    
    // Head
    p.fill(180, 140, 100);
    p.circle(0, -this.radius * 0.8, this.radius);
    
    // Eyes (menacing)
    p.fill(255, 0, 0);
    p.circle(-4, -this.radius * 0.8, 4);
    p.circle(4, -this.radius * 0.8, 4);
    
    // Arms
    const armSwing = Math.sin(this.walkCycle) * 5;
    p.stroke(0);
    p.strokeWeight(3);
    p.line(-this.radius * 0.9, 2, -this.radius * 1.3, 8 + armSwing);
    p.line(this.radius * 0.9, 2, this.radius * 1.3, 8 - armSwing);
    
    // Health bar
    if (this.health < this.maxHealth) {
      const barWidth = this.radius * 2;
      const barHeight = 3;
      const healthPercent = this.health / this.maxHealth;
      
      p.fill(100, 0, 0);
      p.noStroke();
      p.rect(0, -this.radius * 1.5, barWidth, barHeight);
      
      p.fill(255, 0, 0);
      p.rect(0, -this.radius * 1.5, barWidth * healthPercent, barHeight);
    }
    
    p.pop();
  }
}

// Power-up class
export class PowerUp {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 12;
    this.type = Math.floor(Math.random() * 3); // 0: health, 1: damage boost, 2: speed boost
    this.lifetime = GAME_CONSTANTS.POWERUP_DURATION;
    this.age = 0;
    this.bobOffset = 0;
    this.rotation = 0;
    
    gameState.powerups.push(this);
  }
  
  update(p) {
    this.age++;
    this.rotation += 0.05;
    this.bobOffset = Math.sin(this.age * 0.1) * 5;
    
    // Check collection
    if (gameState.player) {
      const dx = gameState.player.x - this.x;
      const dy = gameState.player.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < this.radius + gameState.player.radius) {
        this.collect();
        return;
      }
    }
    
    // Remove if expired
    if (this.age > this.lifetime) {
      this.remove();
    }
  }
  
  collect() {
    if (!gameState.player) return;
    
    switch (this.type) {
      case 0: // Health
        gameState.player.heal(30);
        createParticleBurst(this.x, this.y, 10, [0, 255, 0]);
        break;
      case 1: // Damage boost (temporary)
        GAME_CONSTANTS.PLAYER_SWORD_DAMAGE += 25;
        setTimeout(() => {
          GAME_CONSTANTS.PLAYER_SWORD_DAMAGE -= 25;
        }, 5000);
        createParticleBurst(this.x, this.y, 10, [255, 150, 0]);
        break;
      case 2: // Speed boost (temporary)
        gameState.player.speed += 2;
        setTimeout(() => {
          gameState.player.speed -= 2;
        }, 5000);
        createParticleBurst(this.x, this.y, 10, [100, 200, 255]);
        break;
    }
    
    this.remove();
  }
  
  remove() {
    const index = gameState.powerups.indexOf(this);
    if (index > -1) {
      gameState.powerups.splice(index, 1);
    }
  }
  
  render(p) {
    p.push();
    p.translate(this.x, this.y + this.bobOffset);
    p.rotate(this.rotation);
    
    // Glow effect
    p.noStroke();
    p.fill(255, 255, 255, 50);
    p.circle(0, 0, this.radius * 3);
    
    // Main shape
    p.strokeWeight(2);
    p.stroke(255);
    
    if (this.type === 0) { // Health
      p.fill(0, 255, 0);
      p.rectMode(p.CENTER);
      p.rect(0, 0, this.radius * 1.5, this.radius * 1.5);
      p.fill(255);
      p.rect(0, 0, this.radius * 0.5, this.radius * 1.5);
      p.rect(0, 0, this.radius * 1.5, this.radius * 0.5);
    } else if (this.type === 1) { // Damage
      p.fill(255, 150, 0);
      p.star(0, 0, this.radius * 0.8, this.radius * 1.5, 5);
    } else { // Speed
      p.fill(100, 200, 255);
      p.triangle(
        -this.radius, this.radius,
        -this.radius, -this.radius,
        this.radius, 0
      );
    }
    
    p.pop();
  }
}

// Helper function for drawing star
p5.prototype.star = function(x, y, radius1, radius2, npoints) {
  const angle = (Math.PI * 2) / npoints;
  const halfAngle = angle / 2.0;
  
  this.beginShape();
  for (let a = -Math.PI / 2; a < Math.PI * 2 - Math.PI / 2; a += angle) {
    let sx = x + Math.cos(a) * radius2;
    let sy = y + Math.sin(a) * radius2;
    this.vertex(sx, sy);
    sx = x + Math.cos(a + halfAngle) * radius1;
    sy = y + Math.sin(a + halfAngle) * radius1;
    this.vertex(sx, sy);
  }
  this.endShape(this.CLOSE);
};