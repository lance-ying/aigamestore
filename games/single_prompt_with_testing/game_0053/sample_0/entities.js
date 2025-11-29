// Entity classes for the game
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Particle, createExplosion, createSparkle } from './particles.js';

// Player class - the magical girl
export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 20;
    this.height = 20;
    this.hitboxRadius = 3; // Small hitbox for bullet hell
    
    // Movement
    this.vx = 0;
    this.vy = 0;
    this.speed = 4;
    this.focusSpeed = 2; // Slower when holding shift
    
    // Combat
    this.health = 100;
    this.maxHealth = 100;
    this.shootCooldown = 0;
    this.shootDelay = 8;
    this.damage = 10;
    
    // Special abilities
    this.shieldActive = false;
    this.shieldDuration = 0;
    this.maxShieldDuration = 120; // 2 seconds
    this.shieldCooldown = 0;
    this.shieldCooldownTime = 300; // 5 seconds
    
    this.chargeLevel = 0;
    this.maxCharge = 100;
    this.chargeRate = 0.3;
    this.chargeCooldown = 0;
    
    // Visual
    this.color = [255, 100, 200]; // Pink
    this.facing = 0;
    this.animFrame = 0;
    this.invulnerable = 0;
    
    // State tracking
    this.lastPosition = { x: x, y: y };
    
    gameState.player = this;
    gameState.entities.push(this);
  }
  
  update(p) {
    // Update cooldowns
    if (this.shootCooldown > 0) this.shootCooldown--;
    if (this.shieldCooldown > 0) this.shieldCooldown--;
    if (this.chargeCooldown > 0) this.chargeCooldown--;
    if (this.invulnerable > 0) this.invulnerable--;
    
    // Shield duration
    if (this.shieldActive) {
      this.shieldDuration--;
      if (this.shieldDuration <= 0) {
        this.shieldActive = false;
        this.shieldCooldown = this.shieldCooldownTime;
      }
    }
    
    // Charge meter builds over time
    if (this.chargeCooldown === 0 && this.chargeLevel < this.maxCharge) {
      this.chargeLevel = Math.min(this.maxCharge, this.chargeLevel + this.chargeRate);
    }
    
    // Apply velocity
    this.x += this.vx;
    this.y += this.vy;
    
    // Apply friction
    this.vx *= 0.85;
    this.vy *= 0.85;
    
    // Keep in bounds
    this.x = p.constrain(this.x, 15, CANVAS_WIDTH - 15);
    this.y = p.constrain(this.y, 15, CANVAS_HEIGHT - 15);
    
    // Animation
    this.animFrame += 0.2;
    
    // Log position if moved significantly
    if (Math.abs(this.x - this.lastPosition.x) > 2 || 
        Math.abs(this.y - this.lastPosition.y) > 2) {
      this.logPosition(p);
      this.lastPosition.x = this.x;
      this.lastPosition.y = this.y;
    }
  }
  
  move(dx, dy, focused) {
    const speed = focused ? this.focusSpeed : this.speed;
    this.vx += dx * speed * 0.3;
    this.vy += dy * speed * 0.3;
    
    if (dx !== 0 || dy !== 0) {
      this.facing = Math.atan2(dy, dx);
    }
  }
  
  shoot() {
    if (this.shootCooldown > 0) return;
    
    const projectile = new Projectile(
      this.x,
      this.y,
      0,
      -10,
      this.damage,
      true,
      this.color
    );
    gameState.projectiles.push(projectile);
    this.shootCooldown = this.shootDelay;
    
    // Create sparkle effect
    createSparkle(this.x, this.y, this.color);
  }
  
  activateShield() {
    if (this.shieldCooldown > 0 || this.shieldActive) return;
    
    this.shieldActive = true;
    this.shieldDuration = this.maxShieldDuration;
    
    // Visual effect
    for (let i = 0; i < 10; i++) {
      const angle = (Math.PI * 2 / 10) * i;
      const particle = new Particle(
        this.x + Math.cos(angle) * 30,
        this.y + Math.sin(angle) * 30,
        Math.cos(angle) * 2,
        Math.sin(angle) * 2,
        [150, 200, 255]
      );
      gameState.particles.push(particle);
    }
  }
  
  useChargedSpell() {
    if (this.chargeLevel < this.maxCharge || this.chargeCooldown > 0) return;
    
    this.chargeLevel = 0;
    this.chargeCooldown = 180; // 3 seconds
    
    // Create powerful spell - multiple projectiles in a spread
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 / 12) * i;
      const projectile = new Projectile(
        this.x,
        this.y,
        Math.cos(angle) * 8,
        Math.sin(angle) * 8,
        this.damage * 3,
        true,
        [255, 255, 100],
        15
      );
      gameState.projectiles.push(projectile);
    }
    
    // Screen flash effect
    gameState.flashAlpha = 150;
    
    // Big explosion effect
    createExplosion(this.x, this.y, [255, 255, 150], 20);
  }
  
  takeDamage(amount) {
    if (this.invulnerable > 0 || this.shieldActive) return;
    
    this.health -= amount;
    this.invulnerable = 30; // Half second invulnerability
    
    // Screen shake
    gameState.screenShake = 10;
    
    // Damage particle effect
    createExplosion(this.x, this.y, [255, 0, 0], 8);
    
    if (this.health <= 0) {
      this.die();
    }
  }
  
  die() {
    gameState.gamePhase = "GAME_OVER_LOSE";
    createExplosion(this.x, this.y, this.color, 30);
  }
  
  logPosition(p) {
    if (p.logs && p.logs.player_info) {
      p.logs.player_info.push({
        screen_x: this.x,
        screen_y: this.y,
        game_x: this.x,
        game_y: this.y,
        health: this.health,
        charge: this.chargeLevel,
        framecount: gameState.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  render(p) {
    p.push();
    p.translate(this.x, this.y);
    
    // Shield visual
    if (this.shieldActive) {
      const pulseSize = 40 + Math.sin(gameState.frameCount * 0.3) * 5;
      p.noFill();
      p.stroke(150, 200, 255, 150);
      p.strokeWeight(3);
      p.circle(0, 0, pulseSize);
    }
    
    // Invulnerability flashing
    if (this.invulnerable > 0 && Math.floor(gameState.frameCount / 5) % 2 === 0) {
      p.pop();
      return;
    }
    
    // Draw player body
    p.fill(...this.color);
    p.stroke(255);
    p.strokeWeight(2);
    
    // Dress/body
    p.beginShape();
    p.vertex(0, -this.height / 2);
    p.vertex(-this.width / 2, this.height / 4);
    p.vertex(-this.width / 3, this.height / 2);
    p.vertex(this.width / 3, this.height / 2);
    p.vertex(this.width / 2, this.height / 4);
    p.endShape(p.CLOSE);
    
    // Head
    p.fill(255, 220, 200);
    p.circle(0, -this.height / 2.5, 12);
    
    // Hair
    p.fill(...this.color);
    p.circle(-4, -this.height / 2.5 - 3, 8);
    p.circle(4, -this.height / 2.5 - 3, 8);
    
    // Eyes
    p.fill(0);
    p.circle(-2, -this.height / 2.5, 2);
    p.circle(2, -this.height / 2.5, 2);
    
    // Hitbox (visual debug - small red dot)
    p.fill(255, 0, 0);
    p.noStroke();
    p.circle(0, 0, this.hitboxRadius * 2);
    
    // Charge indicator
    if (this.chargeLevel >= this.maxCharge && Math.floor(gameState.frameCount / 10) % 2 === 0) {
      p.noFill();
      p.stroke(255, 255, 100);
      p.strokeWeight(2);
      p.circle(0, 0, 35);
    }
    
    p.pop();
  }
}

// Projectile class
export class Projectile {
  constructor(x, y, vx, vy, damage, isPlayerProjectile, color, size = 8) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.damage = damage;
    this.isPlayerProjectile = isPlayerProjectile;
    this.color = color;
    this.size = size;
    this.lifetime = 300;
    this.age = 0;
    this.trail = [];
    
    gameState.entities.push(this);
  }
  
  update(p) {
    this.x += this.vx;
    this.y += this.vy;
    this.age++;
    
    // Add trail position
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 5) {
      this.trail.shift();
    }
    
    // Check bounds
    if (this.x < -20 || this.x > CANVAS_WIDTH + 20 ||
        this.y < -20 || this.y > CANVAS_HEIGHT + 20 ||
        this.age >= this.lifetime) {
      this.destroy();
      return;
    }
    
    // Check collisions
    if (this.isPlayerProjectile) {
      // Check enemy collisions
      for (const enemy of gameState.enemies) {
        const dx = enemy.x - this.x;
        const dy = enemy.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < this.size / 2 + enemy.size / 2) {
          enemy.takeDamage(this.damage);
          createSparkle(this.x, this.y, this.color);
          this.destroy();
          return;
        }
      }
    } else {
      // Check player collision
      if (gameState.player) {
        const dx = gameState.player.x - this.x;
        const dy = gameState.player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < this.size / 2 + gameState.player.hitboxRadius) {
          gameState.player.takeDamage(this.damage);
          this.destroy();
          return;
        }
      }
    }
  }
  
  destroy() {
    const index = gameState.entities.indexOf(this);
    if (index > -1) {
      gameState.entities.splice(index, 1);
    }
    
    if (this.isPlayerProjectile) {
      const projIndex = gameState.projectiles.indexOf(this);
      if (projIndex > -1) {
        gameState.projectiles.splice(projIndex, 1);
      }
    } else {
      const projIndex = gameState.enemyProjectiles.indexOf(this);
      if (projIndex > -1) {
        gameState.enemyProjectiles.splice(projIndex, 1);
      }
    }
  }
  
  render(p) {
    // Draw trail
    for (let i = 0; i < this.trail.length; i++) {
      const alpha = (i / this.trail.length) * 100;
      p.fill(...this.color, alpha);
      p.noStroke();
      const trailSize = this.size * (i / this.trail.length);
      p.circle(this.trail[i].x, this.trail[i].y, trailSize);
    }
    
    // Draw projectile
    p.fill(...this.color);
    p.stroke(255);
    p.strokeWeight(1);
    p.circle(this.x, this.y, this.size);
    
    // Inner glow
    p.fill(255, 255, 255, 150);
    p.noStroke();
    p.circle(this.x, this.y, this.size * 0.5);
  }
}

// Enemy class
export class Enemy {
  constructor(x, y, type = 'basic') {
    this.x = x;
    this.y = y;
    this.type = type;
    this.size = type === 'boss' ? 50 : 25;
    
    // Stats based on type
    if (type === 'boss') {
      this.health = 500;
      this.maxHealth = 500;
      this.damage = 20;
      this.speed = 1;
      this.scoreValue = 1000;
      this.color = [180, 50, 255];
    } else if (type === 'fast') {
      this.health = 30;
      this.maxHealth = 30;
      this.damage = 5;
      this.speed = 2;
      this.scoreValue = 50;
      this.color = [50, 255, 150];
    } else if (type === 'tank') {
      this.health = 80;
      this.maxHealth = 80;
      this.damage = 15;
      this.speed = 0.8;
      this.scoreValue = 75;
      this.color = [255, 150, 50];
    } else { // basic
      this.health = 50;
      this.maxHealth = 50;
      this.damage = 10;
      this.speed = 1.5;
      this.scoreValue = 30;
      this.color = [100, 150, 255];
    }
    
    // Movement
    this.vx = 0;
    this.vy = 0;
    this.targetX = x;
    this.targetY = y;
    
    // Combat
    this.shootCooldown = 0;
    this.shootDelay = type === 'boss' ? 15 : 45;
    this.patternPhase = 0;
    
    // Visual
    this.animFrame = 0;
    this.flash = 0;
    
    gameState.enemies.push(this);
    gameState.entities.push(this);
  }
  
  update(p) {
    if (!gameState.player) return;
    
    // Update cooldowns
    if (this.shootCooldown > 0) this.shootCooldown--;
    if (this.flash > 0) this.flash--;
    
    // AI behavior based on type
    if (this.type === 'boss') {
      this.updateBossAI(p);
    } else {
      this.updateBasicAI(p);
    }
    
    // Apply movement
    this.x += this.vx;
    this.y += this.vy;
    
    // Friction
    this.vx *= 0.95;
    this.vy *= 0.95;
    
    // Keep in bounds
    this.x = p.constrain(this.x, this.size, CANVAS_WIDTH - this.size);
    this.y = p.constrain(this.y, this.size, CANVAS_HEIGHT / 2 - this.size);
    
    // Shoot patterns
    if (this.shootCooldown === 0) {
      this.shootPattern(p);
      this.shootCooldown = this.shootDelay;
    }
    
    // Animation
    this.animFrame += 0.1;
    this.patternPhase += 0.05;
  }
  
  updateBasicAI(p) {
    // Move in circular patterns around a target point
    const centerX = CANVAS_WIDTH / 2;
    const centerY = CANVAS_HEIGHT / 4;
    const radius = 80;
    
    this.targetX = centerX + Math.cos(this.patternPhase) * radius;
    this.targetY = centerY + Math.sin(this.patternPhase) * radius;
    
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    
    this.vx += dx * 0.02 * this.speed;
    this.vy += dy * 0.02 * this.speed;
  }
  
  updateBossAI(p) {
    // Boss moves in figure-eight pattern
    const centerX = CANVAS_WIDTH / 2;
    const centerY = 80;
    
    this.targetX = centerX + Math.sin(this.patternPhase) * 150;
    this.targetY = centerY + Math.sin(this.patternPhase * 2) * 40;
    
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    
    this.vx += dx * 0.015;
    this.vy += dy * 0.015;
  }
  
  shootPattern(p) {
    if (this.type === 'boss') {
      this.shootBossPattern(p);
    } else if (this.type === 'fast') {
      this.shootFastPattern(p);
    } else if (this.type === 'tank') {
      this.shootTankPattern(p);
    } else {
      this.shootBasicPattern(p);
    }
  }
  
  shootBasicPattern(p) {
    // Shoot 3 projectiles in a spread towards player
    const angle = Math.atan2(gameState.player.y - this.y, gameState.player.x - this.x);
    
    for (let i = -1; i <= 1; i++) {
      const spreadAngle = angle + i * 0.3;
      const speed = 4;
      const projectile = new Projectile(
        this.x,
        this.y,
        Math.cos(spreadAngle) * speed,
        Math.sin(spreadAngle) * speed,
        this.damage,
        false,
        this.color
      );
      gameState.enemyProjectiles.push(projectile);
    }
  }
  
  shootFastPattern(p) {
    // Shoot single fast projectile
    const angle = Math.atan2(gameState.player.y - this.y, gameState.player.x - this.x);
    const speed = 6;
    const projectile = new Projectile(
      this.x,
      this.y,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
      this.damage,
      false,
      this.color,
      6
    );
    gameState.enemyProjectiles.push(projectile);
  }
  
  shootTankPattern(p) {
    // Shoot ring of projectiles
    const numProjectiles = 8;
    for (let i = 0; i < numProjectiles; i++) {
      const angle = (Math.PI * 2 / numProjectiles) * i + this.patternPhase;
      const speed = 3;
      const projectile = new Projectile(
        this.x,
        this.y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        this.damage,
        false,
        this.color
      );
      gameState.enemyProjectiles.push(projectile);
    }
  }
  
  shootBossPattern(p) {
    // Boss shoots complex spiral pattern
    const numProjectiles = 12;
    for (let i = 0; i < numProjectiles; i++) {
      const angle = (Math.PI * 2 / numProjectiles) * i + this.patternPhase * 3;
      const speed = 3.5;
      const projectile = new Projectile(
        this.x,
        this.y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        this.damage,
        false,
        this.color,
        10
      );
      gameState.enemyProjectiles.push(projectile);
    }
    
    // Also shoot aimed shots
    if (Math.floor(this.patternPhase * 10) % 3 === 0) {
      const angle = Math.atan2(gameState.player.y - this.y, gameState.player.x - this.x);
      const speed = 5;
      const projectile = new Projectile(
        this.x,
        this.y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        this.damage,
        false,
        [255, 100, 255],
        12
      );
      gameState.enemyProjectiles.push(projectile);
    }
  }
  
  takeDamage(amount) {
    this.health -= amount;
    this.flash = 10;
    
    if (this.health <= 0) {
      this.die();
    }
  }
  
  die() {
    // Add to score
    gameState.score += this.scoreValue;
    gameState.enemiesDefeated++;
    
    // Boss defeated?
    if (this.type === 'boss') {
      gameState.bossDefeated = true;
      gameState.bossActive = false;
      gameState.gamePhase = "GAME_OVER_WIN";
      
      // Massive explosion
      createExplosion(this.x, this.y, this.color, 50);
    } else {
      // Normal explosion
      createExplosion(this.x, this.y, this.color, 15);
      
      // Chance to drop power-up
      if (Math.random() < 0.3) {
        const powerUp = new PowerUp(this.x, this.y);
        gameState.powerUps.push(powerUp);
      }
    }
    
    // Remove from arrays
    const index = gameState.enemies.indexOf(this);
    if (index > -1) {
      gameState.enemies.splice(index, 1);
    }
    
    const entityIndex = gameState.entities.indexOf(this);
    if (entityIndex > -1) {
      gameState.entities.splice(entityIndex, 1);
    }
  }
  
  render(p) {
    p.push();
    p.translate(this.x, this.y);
    
    // Flash when hit
    if (this.flash > 0) {
      p.fill(255);
    } else {
      p.fill(...this.color);
    }
    
    p.stroke(255);
    p.strokeWeight(2);
    
    if (this.type === 'boss') {
      // Boss appearance - ornate design
      p.push();
      p.rotate(this.animFrame);
      
      // Outer ring
      p.noFill();
      p.stroke(...this.color);
      p.strokeWeight(3);
      p.circle(0, 0, this.size * 1.2);
      
      // Inner body
      p.fill(...this.color);
      p.stroke(255);
      p.strokeWeight(2);
      p.star(0, 0, this.size * 0.4, this.size * 0.6, 6);
      
      // Crown
      p.fill(255, 215, 0);
      for (let i = 0; i < 5; i++) {
        const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
        const x = Math.cos(angle) * this.size * 0.35;
        const y = Math.sin(angle) * this.size * 0.35 - 5;
        p.triangle(x, y, x - 3, y + 8, x + 3, y + 8);
      }
      
      p.pop();
      
      // Health bar
      const barWidth = this.size * 1.5;
      const barHeight = 5;
      const healthRatio = this.health / this.maxHealth;
      
      p.fill(100, 0, 0);
      p.rect(-barWidth / 2, this.size * 0.7, barWidth, barHeight);
      p.fill(255, 0, 0);
      p.rect(-barWidth / 2, this.size * 0.7, barWidth * healthRatio, barHeight);
      
    } else {
      // Regular enemy
      p.push();
      p.rotate(this.animFrame * 2);
      
      // Body shape based on type
      if (this.type === 'fast') {
        // Diamond shape
        p.beginShape();
        p.vertex(0, -this.size / 2);
        p.vertex(this.size / 2, 0);
        p.vertex(0, this.size / 2);
        p.vertex(-this.size / 2, 0);
        p.endShape(p.CLOSE);
      } else if (this.type === 'tank') {
        // Square
        p.rectMode(p.CENTER);
        p.rect(0, 0, this.size, this.size);
      } else {
        // Circle
        p.circle(0, 0, this.size);
      }
      
      // Eye
      p.fill(255, 0, 0);
      p.circle(0, 0, this.size * 0.3);
      
      p.pop();
    }
    
    p.pop();
  }
}

// Power-up class
export class PowerUp {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 15;
    this.vx = 0;
    this.vy = 2; // Falls down
    this.rotation = 0;
    this.lifetime = 300;
    this.age = 0;
    this.color = [255, 255, 100];
    
    gameState.entities.push(this);
  }
  
  update(p) {
    this.x += this.vx;
    this.y += this.vy;
    this.rotation += 0.1;
    this.age++;
    
    // Expire
    if (this.age >= this.lifetime || this.y > CANVAS_HEIGHT + 20) {
      this.destroy();
      return;
    }
    
    // Check collection by player
    if (gameState.player) {
      const dx = gameState.player.x - this.x;
      const dy = gameState.player.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < this.size + 10) {
        this.collect();
      }
    }
  }
  
  collect() {
    if (gameState.player) {
      // Restore health
      gameState.player.health = Math.min(
        gameState.player.maxHealth,
        gameState.player.health + 20
      );
      
      // Add score
      gameState.score += 10;
      
      // Visual effect
      createSparkle(this.x, this.y, this.color);
    }
    
    this.destroy();
  }
  
  destroy() {
    const index = gameState.entities.indexOf(this);
    if (index > -1) {
      gameState.entities.splice(index, 1);
    }
    
    const powerUpIndex = gameState.powerUps.indexOf(this);
    if (powerUpIndex > -1) {
      gameState.powerUps.splice(powerUpIndex, 1);
    }
  }
  
  render(p) {
    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.rotation);
    
    // Outer glow
    p.noStroke();
    p.fill(...this.color, 100);
    p.star(0, 0, this.size * 1.3, this.size * 0.8, 4);
    
    // Main star
    p.fill(...this.color);
    p.stroke(255);
    p.strokeWeight(2);
    p.star(0, 0, this.size, this.size * 0.6, 4);
    
    // Inner sparkle
    p.fill(255);
    p.noStroke();
    p.circle(0, 0, 5);
    
    p.pop();
  }
}

// Helper function to draw star
if (typeof window !== 'undefined' && window.p5) {
  window.p5.prototype.star = function(x, y, radius1, radius2, npoints) {
    let angle = this.TWO_PI / npoints;
    let halfAngle = angle / 2.0;
    this.beginShape();
    for (let a = -this.PI / 2; a < this.TWO_PI - this.PI / 2; a += angle) {
      let sx = x + this.cos(a) * radius2;
      let sy = y + this.sin(a) * radius2;
      this.vertex(sx, sy);
      sx = x + this.cos(a + halfAngle) * radius1;
      sy = y + this.sin(a + halfAngle) * radius1;
      this.vertex(sx, sy);
    }
    this.endShape(this.CLOSE);
  };
}