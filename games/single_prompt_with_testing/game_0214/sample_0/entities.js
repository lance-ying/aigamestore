// entities.js - Entity classes for player, bosses, and projectiles

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, PLAY_AREA, PLAYER_CONSTANTS, BOSS_CONSTANTS } from './globals.js';
import { createParticle } from './particles.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    
    // Use stats from gameState
    this.stats = gameState.playerStats;
    
    // Visual
    this.visualRadius = PLAYER_CONSTANTS.visualRadius;
    this.hitboxRadius = PLAYER_CONSTANTS.hitboxRadius;
    
    // State
    this.isFocused = false;
    this.fireTimer = 0;
    this.invulnerable = false;
    this.invulnerableTimer = 0;
    this.specialActive = false;
    this.specialTimer = 0;
    
    // Animation
    this.pulsePhase = 0;
    
    // Tracking
    this.lastPosition = { x: x, y: y };
    
    gameState.player = this;
    gameState.entities.push(this);
  }
  
  update(p) {
    // Update timers
    this.fireTimer = Math.max(0, this.fireTimer - 1);
    this.stats.specialCooldown = Math.max(0, this.stats.specialCooldown - 1);
    
    if (this.invulnerable) {
      this.invulnerableTimer--;
      if (this.invulnerableTimer <= 0) {
        this.invulnerable = false;
      }
    }
    
    if (this.specialActive) {
      this.specialTimer--;
      if (this.specialTimer <= 0) {
        this.specialActive = false;
      }
    }
    
    // Apply velocity
    this.x += this.vx;
    this.y += this.vy;
    
    // Constrain to play area
    this.x = p.constrain(this.x, PLAY_AREA.x + 10, PLAY_AREA.x + PLAY_AREA.width - 10);
    this.y = p.constrain(this.y, PLAY_AREA.y + 10, PLAY_AREA.y + PLAY_AREA.height - 10);
    
    // Reset velocity
    this.vx = 0;
    this.vy = 0;
    
    // Animation
    this.pulsePhase += 0.1;
    
    // Log position if changed significantly
    if (Math.abs(this.x - this.lastPosition.x) > 5 || 
        Math.abs(this.y - this.lastPosition.y) > 5) {
      this.logPosition(p);
      this.lastPosition.x = this.x;
      this.lastPosition.y = this.y;
    }
  }
  
  moveLeft() {
    const speed = this.isFocused ? this.stats.focusSpeed : this.stats.speed;
    this.vx = -speed;
  }
  
  moveRight() {
    const speed = this.isFocused ? this.stats.focusSpeed : this.stats.speed;
    this.vx = speed;
  }
  
  moveUp() {
    const speed = this.isFocused ? this.stats.focusSpeed : this.stats.speed;
    this.vy = -speed;
  }
  
  moveDown() {
    const speed = this.isFocused ? this.stats.focusSpeed : this.stats.speed;
    this.vy = speed;
  }
  
  setFocus(focused) {
    this.isFocused = focused;
  }
  
  fire() {
    if (this.fireTimer > 0) return;
    
    this.fireTimer = this.stats.fireRate;
    
    if (this.stats.doubleShot) {
      gameState.playerProjectiles.push(
        new PlayerProjectile(this.x - 5, this.y - 10, 0, -this.stats.projectileSpeed)
      );
      gameState.playerProjectiles.push(
        new PlayerProjectile(this.x + 5, this.y - 10, 0, -this.stats.projectileSpeed)
      );
    } else {
      gameState.playerProjectiles.push(
        new PlayerProjectile(this.x, this.y - 10, 0, -this.stats.projectileSpeed)
      );
    }
  }
  
  useSpecial() {
    if (!this.stats.hasSpecialAbility) return;
    if (this.stats.specialCooldown > 0) return;
    
    this.specialActive = true;
    this.specialTimer = 120; // 2 seconds
    this.stats.specialCooldown = this.stats.maxSpecialCooldown;
    
    // Create particle burst
    for (let i = 0; i < 20; i++) {
      const angle = (Math.PI * 2 * i) / 20;
      createParticle(this.x, this.y, Math.cos(angle) * 5, Math.sin(angle) * 5, [255, 255, 100], 30);
    }
  }
  
  takeDamage(amount) {
    if (this.invulnerable || this.specialActive) return;
    
    this.stats.health -= amount;
    this.invulnerable = true;
    this.invulnerableTimer = 60; // 1 second
    gameState.screenShake = 10;
    gameState.flashIntensity = 150;
    
    // Create damage particles
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      createParticle(this.x, this.y, Math.cos(angle) * 3, Math.sin(angle) * 3, [255, 100, 100], 20);
    }
    
    if (this.stats.health <= 0) {
      this.die();
    }
  }
  
  die() {
    gameState.gamePhase = "GAME_OVER_LOSE";
    
    // Create death particles
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 2;
      createParticle(this.x, this.y, Math.cos(angle) * speed, Math.sin(angle) * speed, [255, 50, 50], 60);
    }
  }
  
  logPosition(p) {
    if (p.logs && p.logs.player_info) {
      p.logs.player_info.push({
        screen_x: this.x,
        screen_y: this.y,
        game_x: this.x,
        game_y: this.y,
        health: this.stats.health,
        framecount: gameState.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  render(p) {
    p.push();
    
    // Invulnerability flashing
    if (this.invulnerable && Math.floor(gameState.frameCount / 5) % 2 === 0) {
      p.pop();
      return;
    }
    
    // Special ability glow
    if (this.specialActive) {
      p.fill(255, 255, 100, 100);
      p.noStroke();
      p.circle(this.x, this.y, this.visualRadius * 3);
    }
    
    // Main heart shape
    p.fill(255, 100, 150);
    p.stroke(255, 50, 100);
    p.strokeWeight(2);
    
    // Draw heart
    p.beginShape();
    for (let a = 0; a < Math.PI * 2; a += 0.1) {
      const x = 16 * Math.pow(Math.sin(a), 3);
      const y = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a));
      const scale = 0.7 + Math.sin(this.pulsePhase) * 0.1;
      p.vertex(this.x + x * scale, this.y + y * scale);
    }
    p.endShape(p.CLOSE);
    
    // Draw hitbox in focus mode
    if (this.isFocused) {
      p.fill(255, 255, 255, 150);
      p.noStroke();
      p.circle(this.x, this.y, this.hitboxRadius * 2);
      
      // Focus indicator lines
      p.stroke(255, 255, 255, 200);
      p.strokeWeight(1);
      p.line(this.x - 20, this.y, this.x - 10, this.y);
      p.line(this.x + 20, this.y, this.x + 10, this.y);
      p.line(this.x, this.y - 20, this.x, this.y - 10);
      p.line(this.x, this.y + 20, this.x, this.y + 10);
    }
    
    p.pop();
  }
}

export class Boss {
  constructor(bossType, stage) {
    this.type = bossType;
    this.name = bossType.name;
    this.color = bossType.color;
    this.size = bossType.size;
    this.pattern = bossType.pattern;
    this.difficulty = bossType.difficulty;
    this.stage = stage;
    
    this.x = BOSS_CONSTANTS.positionX;
    this.y = BOSS_CONSTANTS.positionY;
    
    // Health scales with stage
    this.maxHealth = BOSS_CONSTANTS.baseHealth * Math.pow(BOSS_CONSTANTS.healthScaling, stage - 1);
    this.health = this.maxHealth;
    
    // Attack patterns
    this.attackTimer = 0;
    this.attackCooldown = 60;
    this.patternPhase = 0;
    this.movePhase = 0;
    
    // Visual
    this.hurtFlash = 0;
    this.deathTimer = 0;
    this.dying = false;
    
    gameState.currentBoss = this;
    gameState.entities.push(this);
  }
  
  update(p) {
    if (this.dying) {
      this.deathTimer++;
      if (this.deathTimer > 60) {
        this.onDefeat();
      }
      return;
    }
    
    // Movement pattern
    this.movePhase += 0.02;
    this.x = BOSS_CONSTANTS.positionX + Math.sin(this.movePhase) * 80;
    
    // Attack pattern
    this.attackTimer++;
    this.patternPhase += 0.05;
    
    if (this.attackTimer >= this.attackCooldown) {
      this.executeAttackPattern(p);
      this.attackTimer = 0;
    }
    
    // Reduce hurt flash
    if (this.hurtFlash > 0) {
      this.hurtFlash -= 10;
    }
  }
  
  executeAttackPattern(p) {
    switch (this.pattern) {
      case "spiral":
        this.spiralPattern(p);
        break;
      case "wave":
        this.wavePattern(p);
        break;
      case "spread":
        this.spreadPattern(p);
        break;
      case "aimed":
        this.aimedPattern(p);
        break;
      case "circle":
        this.circlePattern(p);
        break;
      case "cross":
        this.crossPattern(p);
        break;
      case "random":
        this.randomPattern(p);
        break;
      case "void":
        this.voidPattern(p);
        break;
    }
  }
  
  spiralPattern(p) {
    const count = 8 + this.stage * 2;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i / count) + this.patternPhase;
      const speed = 2 + this.stage * 0.3;
      gameState.enemyProjectiles.push(
        new EnemyProjectile(this.x, this.y, Math.cos(angle) * speed, Math.sin(angle) * speed)
      );
    }
  }
  
  wavePattern(p) {
    const count = 10 + this.stage * 2;
    for (let i = 0; i < count; i++) {
      const x = PLAY_AREA.x + (PLAY_AREA.width * i / count);
      const angle = Math.PI / 2 + Math.sin(this.patternPhase + i * 0.5) * 0.5;
      const speed = 2 + this.stage * 0.2;
      gameState.enemyProjectiles.push(
        new EnemyProjectile(x, this.y, Math.cos(angle) * speed, Math.sin(angle) * speed)
      );
    }
  }
  
  spreadPattern(p) {
    const count = 12 + this.stage * 3;
    const spreadAngle = Math.PI / 3;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI / 2) - (spreadAngle / 2) + (spreadAngle * i / (count - 1));
      const speed = 3 + this.stage * 0.3;
      gameState.enemyProjectiles.push(
        new EnemyProjectile(this.x, this.y, Math.cos(angle) * speed, Math.sin(angle) * speed)
      );
    }
  }
  
  aimedPattern(p) {
    if (!gameState.player) return;
    
    const count = 3 + this.stage;
    for (let i = 0; i < count; i++) {
      const dx = gameState.player.x - this.x;
      const dy = gameState.player.y - this.y;
      const baseAngle = Math.atan2(dy, dx);
      const spread = 0.3;
      const angle = baseAngle + (Math.random() - 0.5) * spread;
      const speed = 3 + this.stage * 0.4;
      
      gameState.enemyProjectiles.push(
        new EnemyProjectile(this.x, this.y, Math.cos(angle) * speed, Math.sin(angle) * speed)
      );
    }
  }
  
  circlePattern(p) {
    const rings = 2 + Math.floor(this.stage / 2);
    for (let r = 0; r < rings; r++) {
      const count = 12 + r * 4;
      const delay = r * 5;
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i / count) + this.patternPhase + (r * 0.5);
        const speed = 1.5 + r * 0.5 + this.stage * 0.2;
        const proj = new EnemyProjectile(this.x, this.y, Math.cos(angle) * speed, Math.sin(angle) * speed);
        proj.delay = delay;
        gameState.enemyProjectiles.push(proj);
      }
    }
  }
  
  crossPattern(p) {
    const count = 8;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI / 4) * i;
      const speed = 2.5 + this.stage * 0.3;
      gameState.enemyProjectiles.push(
        new EnemyProjectile(this.x, this.y, Math.cos(angle) * speed, Math.sin(angle) * speed)
      );
    }
  }
  
  randomPattern(p) {
    const count = 15 + this.stage * 5;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3 + this.stage * 0.2;
      gameState.enemyProjectiles.push(
        new EnemyProjectile(this.x, this.y, Math.cos(angle) * speed, Math.sin(angle) * speed)
      );
    }
  }
  
  voidPattern(p) {
    // Combination of multiple patterns
    this.spiralPattern(p);
    this.circlePattern(p);
    if (Math.random() < 0.5) {
      this.aimedPattern(p);
    }
  }
  
  takeDamage(amount) {
    if (this.dying) return;
    
    this.health -= amount;
    this.hurtFlash = 255;
    gameState.score += Math.floor(amount);
    
    // Create hit particles
    for (let i = 0; i < 3; i++) {
      const angle = Math.random() * Math.PI * 2;
      createParticle(this.x, this.y, Math.cos(angle) * 2, Math.sin(angle) * 2, this.color, 15);
    }
    
    if (this.health <= 0) {
      this.die();
    }
  }
  
  die() {
    this.dying = true;
    this.deathTimer = 0;
    gameState.screenShake = 15;
    
    // Create death particles
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 6 + 2;
      createParticle(this.x, this.y, Math.cos(angle) * speed, Math.sin(angle) * speed, this.color, 60);
    }
  }
  
  onDefeat() {
    gameState.bossesDefeated++;
    gameState.score += 1000 * this.stage;
    
    // Clear all enemy projectiles
    gameState.enemyProjectiles = [];
    
    // Check if this was the final boss
    if (gameState.currentStage >= gameState.maxStage) {
      gameState.gamePhase = "GAME_OVER_WIN";
    } else {
      // Go to power-up selection
      gameState.gamePhase = "POWER_UP";
      gameState.currentStage++;
    }
    
    // Remove boss from entities
    const index = gameState.entities.indexOf(this);
    if (index > -1) {
      gameState.entities.splice(index, 1);
    }
    gameState.currentBoss = null;
  }
  
  render(p) {
    p.push();
    
    // Death animation
    if (this.dying) {
      const alpha = 255 * (1 - this.deathTimer / 60);
      p.fill(this.color[0], this.color[1], this.color[2], alpha);
      p.noStroke();
      const expandSize = this.size * (1 + this.deathTimer / 30);
      p.circle(this.x, this.y, expandSize);
      p.pop();
      return;
    }
    
    // Hurt flash
    if (this.hurtFlash > 0) {
      p.fill(255, 255, 255, this.hurtFlash);
      p.noStroke();
      p.circle(this.x, this.y, this.size * 1.2);
    }
    
    // Boss body
    p.fill(this.color[0], this.color[1], this.color[2]);
    p.stroke(this.color[0] * 0.7, this.color[1] * 0.7, this.color[2] * 0.7);
    p.strokeWeight(3);
    
    // Draw boss shape (varies by type)
    if (this.pattern === "void") {
      // Special shape for final boss
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 * i / 8) + this.patternPhase;
        const radius = this.size + Math.sin(this.patternPhase * 3 + i) * 10;
        const x = this.x + Math.cos(angle) * radius;
        const y = this.y + Math.sin(angle) * radius;
        p.circle(x, y, this.size * 0.3);
      }
    } else {
      // Regular boss
      p.circle(this.x, this.y, this.size);
      
      // Eyes
      p.fill(255, 0, 0);
      const eyeOffset = this.size * 0.25;
      p.circle(this.x - eyeOffset, this.y - eyeOffset, this.size * 0.2);
      p.circle(this.x + eyeOffset, this.y - eyeOffset, this.size * 0.2);
    }
    
    // Health bar
    const barWidth = this.size * 2;
    const barHeight = 6;
    const barX = this.x - barWidth / 2;
    const barY = this.y + this.size + 10;
    const healthRatio = this.health / this.maxHealth;
    
    // Background
    p.fill(50, 0, 0);
    p.noStroke();
    p.rect(barX, barY, barWidth, barHeight);
    
    // Health fill
    p.fill(255, 0, 0);
    p.rect(barX, barY, barWidth * healthRatio, barHeight);
    
    // Border
    p.noFill();
    p.stroke(255);
    p.strokeWeight(1);
    p.rect(barX, barY, barWidth, barHeight);
    
    // Boss name
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER, p.BOTTOM);
    p.textSize(12);
    p.text(this.name, this.x, barY - 2);
    
    p.pop();
  }
}

export class PlayerProjectile {
  constructor(x, y, vx, vy) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = gameState.playerStats.projectileSize;
    this.damage = gameState.playerStats.damage;
    this.piercing = gameState.playerStats.piercing || false;
    this.hasHit = false;
  }
  
  update(p) {
    this.x += this.vx;
    this.y += this.vy;
    
    // Check if out of bounds
    if (this.y < 0 || this.y > CANVAS_HEIGHT || this.x < 0 || this.x > CANVAS_WIDTH) {
      return true; // Mark for removal
    }
    
    // Check collision with boss
    if (gameState.currentBoss && !gameState.currentBoss.dying) {
      const dx = gameState.currentBoss.x - this.x;
      const dy = gameState.currentBoss.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < gameState.currentBoss.size / 2 + this.radius) {
        gameState.currentBoss.takeDamage(this.damage);
        
        if (!this.piercing) {
          return true; // Mark for removal
        }
        this.hasHit = true;
      }
    }
    
    return false;
  }
  
  render(p) {
    p.push();
    p.fill(255, 200, 255);
    p.noStroke();
    
    // Trail effect
    for (let i = 1; i <= 3; i++) {
      const alpha = 255 * (1 - i / 4);
      p.fill(255, 200, 255, alpha);
      p.circle(this.x - this.vx * i, this.y - this.vy * i, this.radius * (1 - i / 6));
    }
    
    // Main projectile
    p.fill(255, 100, 255);
    p.circle(this.x, this.y, this.radius);
    
    p.pop();
  }
}

export class EnemyProjectile {
  constructor(x, y, vx, vy) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = 5;
    this.delay = 0;
    this.age = 0;
  }
  
  update(p) {
    this.age++;
    
    if (this.delay > 0) {
      this.delay--;
      return false;
    }
    
    this.x += this.vx;
    this.y += this.vy;
    
    // Check if out of play area
    if (this.x < PLAY_AREA.x - 20 || this.x > PLAY_AREA.x + PLAY_AREA.width + 20 ||
        this.y < PLAY_AREA.y - 20 || this.y > PLAY_AREA.y + PLAY_AREA.height + 20) {
      return true; // Mark for removal
    }
    
    // Check collision with player
    if (gameState.player && !gameState.player.invulnerable) {
      const dx = gameState.player.x - this.x;
      const dy = gameState.player.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < gameState.player.hitboxRadius + this.radius) {
        gameState.player.takeDamage(10);
        return true; // Mark for removal
      }
    }
    
    return false;
  }
  
  render(p) {
    if (this.delay > 0) {
      // Show spawn indicator
      p.fill(255, 255, 0, 100);
      p.noStroke();
      p.circle(this.x, this.y, this.radius * 2);
      return;
    }
    
    p.push();
    
    // Glow effect
    p.fill(255, 100, 50, 80);
    p.noStroke();
    p.circle(this.x, this.y, this.radius * 2);
    
    // Main projectile
    p.fill(255, 50, 50);
    p.circle(this.x, this.y, this.radius);
    
    p.pop();
  }
}