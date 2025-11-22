// entities.js - Game entity classes
import { CANVAS_WIDTH, CANVAS_HEIGHT, PLAYER_CONFIG, ENEMY_CONFIG, BOSS_CONFIG } from './globals.js';

export class Player {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.maxHealth = PLAYER_CONFIG.maxHealth;
    this.health = this.maxHealth;
    this.speed = PLAYER_CONFIG.baseSpeed;
    this.damage = PLAYER_CONFIG.baseDamage;
    this.attackRange = PLAYER_CONFIG.attackRange;
    this.attackCooldown = PLAYER_CONFIG.attackCooldown;
    this.attackTimer = 0;
    this.size = PLAYER_CONFIG.size;
    this.experience = 0;
    this.level = 1;
    this.experienceToNextLevel = 100;
    this.upgrades = {
      damageMultiplier: 1,
      speedMultiplier: 1,
      attackSpeedMultiplier: 1,
      rangeMultiplier: 1,
      piercing: false,
      multishot: false
    };
    this.invulnerableFrames = 0;
  }

  update(inputs) {
    // Movement
    let dx = 0;
    let dy = 0;
    
    if (inputs.left) dx -= 1;
    if (inputs.right) dx += 1;
    if (inputs.up) dy -= 1;
    if (inputs.down) dy += 1;
    
    // Normalize diagonal movement
    if (dx !== 0 && dy !== 0) {
      dx *= 0.707;
      dy *= 0.707;
    }
    
    const effectiveSpeed = this.speed * this.upgrades.speedMultiplier;
    this.x += dx * effectiveSpeed;
    this.y += dy * effectiveSpeed;
    
    // Constrain to canvas
    this.x = this.p.constrain(this.x, this.size, CANVAS_WIDTH - this.size);
    this.y = this.p.constrain(this.y, this.size, CANVAS_HEIGHT - this.size);
    
    // Update timers
    if (this.attackTimer > 0) this.attackTimer--;
    if (this.invulnerableFrames > 0) this.invulnerableFrames--;
  }

  takeDamage(amount) {
    if (this.invulnerableFrames > 0) return false;
    this.health -= amount;
    this.invulnerableFrames = 30; // 0.5 second invulnerability
    return true;
  }

  gainExperience(amount) {
    this.experience += amount;
    if (this.experience >= this.experienceToNextLevel) {
      this.levelUp();
    }
  }

  levelUp() {
    this.level++;
    this.experience -= this.experienceToNextLevel;
    this.experienceToNextLevel = Math.floor(this.experienceToNextLevel * 1.5);
    return true; // Signal level up
  }

  canAttack() {
    return this.attackTimer <= 0;
  }

  resetAttackTimer() {
    const cooldown = this.attackCooldown / this.upgrades.attackSpeedMultiplier;
    this.attackTimer = cooldown;
  }

  render() {
    this.p.push();
    
    // Flashing when invulnerable
    if (this.invulnerableFrames > 0 && this.p.frameCount % 6 < 3) {
      this.p.translate(this.x, this.y);
      this.p.pop();
      return;
    }
    
    // Draw hero body
    this.p.fill(180, 140, 100);
    this.p.noStroke();
    this.p.ellipse(this.x, this.y, this.size * 1.5, this.size * 1.8);
    
    // Hat
    this.p.fill(80, 60, 40);
    this.p.ellipse(this.x, this.y - this.size * 0.6, this.size * 1.2, this.size * 0.4);
    this.p.rect(this.x - this.size * 0.5, this.y - this.size * 1.1, this.size, this.size * 0.6);
    
    // Head
    this.p.fill(220, 180, 150);
    this.p.ellipse(this.x, this.y - this.size * 0.2, this.size * 0.9, this.size);
    
    // Star badge
    this.p.fill(255, 215, 0);
    this.p.push();
    this.p.translate(this.x, this.y + this.size * 0.3);
    this.p.rotate(this.p.frameCount * 0.02);
    this.drawStar(0, 0, this.size * 0.15, this.size * 0.3, 5);
    this.p.pop();
    
    this.p.pop();
  }

  drawStar(x, y, radius1, radius2, npoints) {
    const angle = this.p.TWO_PI / npoints;
    const halfAngle = angle / 2;
    this.p.beginShape();
    for (let a = -this.p.HALF_PI; a < this.p.TWO_PI - this.p.HALF_PI; a += angle) {
      let sx = x + this.p.cos(a) * radius2;
      let sy = y + this.p.sin(a) * radius2;
      this.p.vertex(sx, sy);
      sx = x + this.p.cos(a + halfAngle) * radius1;
      sy = y + this.p.sin(a + halfAngle) * radius1;
      this.p.vertex(sx, sy);
    }
    this.p.endShape(this.p.CLOSE);
  }
}

export class Enemy {
  constructor(p, x, y, waveLevel) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.health = ENEMY_CONFIG.baseHealth + (waveLevel - 1) * 10;
    this.maxHealth = this.health;
    this.speed = ENEMY_CONFIG.baseSpeed + (waveLevel - 1) * 0.1;
    this.damage = ENEMY_CONFIG.baseDamage + (waveLevel - 1) * 2;
    this.size = ENEMY_CONFIG.size;
    this.type = 'basic';
    this.isDead = false;
  }

  update(player) {
    // Move towards player
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 0) {
      this.x += (dx / dist) * this.speed;
      this.y += (dy / dist) * this.speed;
    }
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.isDead = true;
      return true;
    }
    return false;
  }

  render() {
    this.p.push();
    
    // Draw bandit
    this.p.fill(60, 40, 30);
    this.p.noStroke();
    this.p.ellipse(this.x, this.y, this.size * 1.3, this.size * 1.6);
    
    // Hat
    this.p.fill(40, 30, 20);
    this.p.ellipse(this.x, this.y - this.size * 0.5, this.size, this.size * 0.3);
    this.p.rect(this.x - this.size * 0.4, this.y - this.size * 0.9, this.size * 0.8, this.size * 0.5);
    
    // Head
    this.p.fill(200, 160, 130);
    this.p.ellipse(this.x, this.y - this.size * 0.2, this.size * 0.8, this.size * 0.9);
    
    // Bandana (red)
    this.p.fill(180, 40, 40);
    this.p.ellipse(this.x, this.y - this.size * 0.3, this.size * 0.9, this.size * 0.3);
    
    // Health bar
    const barWidth = this.size * 1.5;
    const barHeight = 3;
    const healthPercent = this.health / this.maxHealth;
    
    this.p.fill(100, 30, 30);
    this.p.rect(this.x - barWidth / 2, this.y - this.size * 1.2, barWidth, barHeight);
    this.p.fill(180, 50, 50);
    this.p.rect(this.x - barWidth / 2, this.y - this.size * 1.2, barWidth * healthPercent, barHeight);
    
    this.p.pop();
  }
}

export class Boss {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.health = BOSS_CONFIG.health;
    this.maxHealth = this.health;
    this.speed = BOSS_CONFIG.speed;
    this.damage = BOSS_CONFIG.damage;
    this.size = BOSS_CONFIG.size;
    this.attackTimer = 0;
    this.attackCooldown = BOSS_CONFIG.attackCooldown;
    this.isDead = false;
    this.type = 'boss';
    this.phase = 0;
  }

  update(player) {
    // Boss AI: circle around player and shoot
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    const targetDist = 150;
    
    if (dist > targetDist + 20) {
      // Move towards player
      this.x += (dx / dist) * this.speed;
      this.y += (dy / dist) * this.speed;
    } else if (dist < targetDist - 20) {
      // Move away from player
      this.x -= (dx / dist) * this.speed;
      this.y -= (dy / dist) * this.speed;
    } else {
      // Circle around
      const perpX = -dy / dist;
      const perpY = dx / dist;
      this.x += perpX * this.speed;
      this.y += perpY * this.speed;
    }
    
    // Keep in bounds
    this.x = this.p.constrain(this.x, this.size, CANVAS_WIDTH - this.size);
    this.y = this.p.constrain(this.y, this.size, CANVAS_HEIGHT - this.size);
    
    if (this.attackTimer > 0) this.attackTimer--;
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
    return this.attackTimer <= 0;
  }

  resetAttackTimer() {
    this.attackTimer = this.attackCooldown;
  }

  render() {
    this.p.push();
    
    // Draw boss - large intimidating figure
    // Body
    this.p.fill(40, 20, 20);
    this.p.noStroke();
    this.p.ellipse(this.x, this.y, this.size * 1.5, this.size * 2);
    
    // Hat - large
    this.p.fill(20, 10, 10);
    this.p.ellipse(this.x, this.y - this.size * 0.8, this.size * 1.3, this.size * 0.4);
    this.p.rect(this.x - this.size * 0.6, this.y - this.size * 1.4, this.size * 1.2, this.size * 0.7);
    
    // Head
    this.p.fill(180, 140, 110);
    this.p.ellipse(this.x, this.y - this.size * 0.3, this.size * 1.1, this.size * 1.2);
    
    // Scar
    this.p.stroke(150, 50, 50);
    this.p.strokeWeight(2);
    this.p.line(this.x - this.size * 0.2, this.y - this.size * 0.5, this.x + this.size * 0.3, this.y - this.size * 0.2);
    this.p.noStroke();
    
    // Skull badge
    this.p.fill(240, 240, 240);
    this.p.ellipse(this.x, this.y + this.size * 0.5, this.size * 0.4, this.size * 0.5);
    this.p.fill(20, 20, 20);
    this.p.ellipse(this.x - this.size * 0.1, this.y + this.size * 0.4, this.size * 0.1, this.size * 0.15);
    this.p.ellipse(this.x + this.size * 0.1, this.y + this.size * 0.4, this.size * 0.1, this.size * 0.15);
    
    // Health bar - larger for boss
    const barWidth = this.size * 2;
    const barHeight = 5;
    const healthPercent = this.health / this.maxHealth;
    
    this.p.fill(60, 20, 20);
    this.p.rect(this.x - barWidth / 2, this.y - this.size * 1.8, barWidth, barHeight);
    this.p.fill(220, 60, 60);
    this.p.rect(this.x - barWidth / 2, this.y - this.size * 1.8, barWidth * healthPercent, barHeight);
    
    // Boss indicator
    this.p.fill(255, 50, 50);
    this.p.textAlign(this.p.CENTER);
    this.p.textSize(10);
    this.p.text('BOSS', this.x, this.y - this.size * 2.1);
    
    this.p.pop();
  }
}

export class Projectile {
  constructor(p, x, y, targetX, targetY, damage, piercing = false) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.damage = damage;
    this.speed = 8;
    this.size = 4;
    this.piercing = piercing;
    this.hitEnemies = new Set();
    this.isDead = false;
    
    // Calculate direction
    const dx = targetX - x;
    const dy = targetY - y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    this.vx = (dx / dist) * this.speed;
    this.vy = (dy / dist) * this.speed;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    
    // Check if out of bounds
    if (this.x < 0 || this.x > CANVAS_WIDTH || this.y < 0 || this.y > CANVAS_HEIGHT) {
      this.isDead = true;
    }
  }

  render() {
    this.p.push();
    this.p.fill(255, 200, 100);
    this.p.noStroke();
    this.p.ellipse(this.x, this.y, this.size * 2, this.size);
    
    // Trail effect
    this.p.fill(255, 150, 50, 100);
    this.p.ellipse(this.x - this.vx * 0.5, this.y - this.vy * 0.5, this.size, this.size * 0.5);
    this.p.pop();
  }
}

export class EnemyProjectile {
  constructor(p, x, y, targetX, targetY, damage) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.damage = damage;
    this.speed = 4;
    this.size = 6;
    this.isDead = false;
    
    const dx = targetX - x;
    const dy = targetY - y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    this.vx = (dx / dist) * this.speed;
    this.vy = (dy / dist) * this.speed;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    
    if (this.x < 0 || this.x > CANVAS_WIDTH || this.y < 0 || this.y > CANVAS_HEIGHT) {
      this.isDead = true;
    }
  }

  render() {
    this.p.push();
    this.p.fill(200, 50, 50);
    this.p.noStroke();
    this.p.ellipse(this.x, this.y, this.size, this.size);
    
    this.p.fill(255, 100, 100, 150);
    this.p.ellipse(this.x, this.y, this.size * 0.6, this.size * 0.6);
    this.p.pop();
  }
}

export class ExperienceOrb {
  constructor(p, x, y, value) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.value = value;
    this.size = 8;
    this.isDead = false;
    this.collectRadius = 30;
    this.floatOffset = this.p.random(0, this.p.TWO_PI);
  }

  update(player) {
    // Float effect
    this.floatOffset += 0.05;
    
    // Magnetic attraction to player
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < this.collectRadius) {
      const speed = 5;
      this.x += (dx / dist) * speed;
      this.y += (dy / dist) * speed;
    }
  }

  render() {
    this.p.push();
    const floatY = this.y + Math.sin(this.floatOffset) * 2;
    
    // Glow
    this.p.fill(100, 255, 255, 60);
    this.p.noStroke();
    this.p.ellipse(this.x, floatY, this.size * 2.5, this.size * 2.5);
    
    // Core
    this.p.fill(50, 200, 255);
    this.p.ellipse(this.x, floatY, this.size, this.size);
    
    // Highlight
    this.p.fill(150, 255, 255);
    this.p.ellipse(this.x - this.size * 0.2, floatY - this.size * 0.2, this.size * 0.4, this.size * 0.4);
    
    this.p.pop();
  }
}

export class Particle {
  constructor(p, x, y, color, lifetime = 30) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.vx = this.p.random(-2, 2);
    this.vy = this.p.random(-2, 2);
    this.color = color;
    this.lifetime = lifetime;
    this.maxLifetime = lifetime;
    this.size = this.p.random(2, 5);
    this.isDead = false;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.1; // Gravity
    this.lifetime--;
    if (this.lifetime <= 0) {
      this.isDead = true;
    }
  }

  render() {
    this.p.push();
    const alpha = (this.lifetime / this.maxLifetime) * 255;
    this.p.fill(...this.color, alpha);
    this.p.noStroke();
    this.p.ellipse(this.x, this.y, this.size, this.size);
    this.p.pop();
  }
}