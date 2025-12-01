// entities.js - Game entities
import { PLAYER_SIZE, PLAYER_MAX_HEALTH, ENEMY_SIZE, BULLET_SIZE, XP_ORB_SIZE } from './globals.js';
import { playerStats } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = PLAYER_SIZE;
    this.health = PLAYER_MAX_HEALTH;
    this.maxHealth = PLAYER_MAX_HEALTH;
    this.facingAngle = 0; // direction player is facing
    this.movingDirection = { x: 0, y: 0 };
    this.isInvulnerable = false;
    this.invulnerabilityTimer = 0;
  }

  update(p) {
    // Health regeneration
    if (playerStats.healthRegen > 0) {
      this.health = Math.min(this.maxHealth, this.health + playerStats.healthRegen / 60);
    }

    // Invulnerability timer
    if (this.isInvulnerable) {
      this.invulnerabilityTimer--;
      if (this.invulnerabilityTimer <= 0) {
        this.isInvulnerable = false;
      }
    }

    // Update max health from stats
    this.maxHealth = playerStats.maxHealth;
  }

  move(dx, dy) {
    this.x += dx;
    this.y += dy;
    
    // Keep player in bounds with padding
    const padding = this.size / 2;
    this.x = Math.max(padding, Math.min(600 - padding, this.x));
    this.y = Math.max(padding, Math.min(400 - padding, this.y));

    // Update facing direction if moving
    if (dx !== 0 || dy !== 0) {
      this.facingAngle = Math.atan2(dy, dx);
    }
  }

  takeDamage(amount) {
    if (this.isInvulnerable) return false;

    // Check shield first
    if (playerStats.hasShield && playerStats.shieldHealth > 0) {
      playerStats.shieldHealth -= amount;
      if (playerStats.shieldHealth < 0) {
        this.health += playerStats.shieldHealth; // overflow damage to health
        playerStats.shieldHealth = 0;
      }
    } else {
      this.health -= amount;
    }

    this.isInvulnerable = true;
    this.invulnerabilityTimer = 30; // 0.5 seconds of invulnerability
    return true;
  }

  draw(p) {
    p.push();
    p.translate(this.x, this.y);

    // Draw shield if active
    if (playerStats.hasShield && playerStats.shieldHealth > 0) {
      p.noFill();
      p.stroke(100, 200, 255, 150);
      p.strokeWeight(2);
      p.circle(0, 0, this.size * 2);
    }

    // Flashing effect when invulnerable
    if (this.isInvulnerable && Math.floor(this.invulnerabilityTimer / 5) % 2 === 0) {
      p.fill(255, 255, 255, 100);
    } else {
      p.fill(100, 200, 255);
    }
    
    p.noStroke();
    
    // Draw player body
    p.circle(0, 0, this.size);
    
    // Draw direction indicator
    p.fill(255);
    p.push();
    p.rotate(this.facingAngle);
    p.triangle(8, 0, 0, -4, 0, 4);
    p.pop();
    
    p.pop();

    // Draw health bar
    this.drawHealthBar(p);
  }

  drawHealthBar(p) {
    const barWidth = 40;
    const barHeight = 4;
    const barX = this.x - barWidth / 2;
    const barY = this.y - this.size - 8;

    // Background
    p.fill(60, 60, 60);
    p.noStroke();
    p.rect(barX, barY, barWidth, barHeight);

    // Health
    const healthPercent = this.health / this.maxHealth;
    const healthColor = healthPercent > 0.5 ? [100, 255, 100] : healthPercent > 0.25 ? [255, 200, 100] : [255, 100, 100];
    p.fill(...healthColor);
    p.rect(barX, barY, barWidth * healthPercent, barHeight);
  }
}

export class Enemy {
  constructor(x, y, type = 'basic') {
    this.x = x;
    this.y = y;
    this.type = type;
    this.size = ENEMY_SIZE;
    this.speed = this.getSpeed();
    this.health = this.getMaxHealth();
    this.maxHealth = this.health;
    this.damage = this.getDamage();
    this.xpValue = this.getXpValue();
    this.hue = this.getHue();
    this.rotation = 0;
    this.oscillation = Math.random() * Math.PI * 2;
  }

  getSpeed() {
    // Reduced speeds for easier difficulty
    switch (this.type) {
      case 'fast': return 1.5; // was 2.0
      case 'tank': return 0.6; // was 0.8
      case 'elite': return 1.1; // was 1.5
      default: return 0.9; // was 1.2
    }
  }

  getMaxHealth() {
    switch (this.type) {
      case 'fast': return 20;
      case 'tank': return 60;
      case 'elite': return 40;
      default: return 30;
    }
  }

  getDamage() {
    switch (this.type) {
      case 'fast': return 8;
      case 'tank': return 15;
      case 'elite': return 12;
      default: return 10;
    }
  }

  getXpValue() {
    switch (this.type) {
      case 'fast': return 3;
      case 'tank': return 8;
      case 'elite': return 10;
      default: return 5;
    }
  }

  getHue() {
    switch (this.type) {
      case 'fast': return 60; // yellow
      case 'tank': return 0; // red
      case 'elite': return 280; // purple
      default: return 120; // green
    }
  }

  update(p, player) {
    // Move towards player
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 0) {
      this.x += (dx / dist) * this.speed;
      this.y += (dy / dist) * this.speed;
    }

    this.rotation += 0.05;
    this.oscillation += 0.1;
  }

  takeDamage(amount) {
    this.health -= amount;
    return this.health <= 0;
  }

  draw(p) {
    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.rotation);

    // Enemy body with tentacle-like appearance
    p.colorMode(p.HSB);
    p.fill(this.hue, 70, 60);
    p.noStroke();
    
    // Main body
    p.circle(0, 0, this.size);

    // Tentacles or spikes
    const numTentacles = this.type === 'elite' ? 8 : 6;
    for (let i = 0; i < numTentacles; i++) {
      const angle = (Math.PI * 2 * i) / numTentacles;
      const oscillate = Math.sin(this.oscillation + i) * 2;
      const length = this.size / 2 + 4 + oscillate;
      p.fill(this.hue, 70, 40);
      p.push();
      p.rotate(angle);
      p.ellipse(length / 2, 0, length, 3);
      p.pop();
    }

    p.colorMode(p.RGB);
    p.pop();

    // Health bar for stronger enemies
    if (this.maxHealth > 30) {
      this.drawHealthBar(p);
    }
  }

  drawHealthBar(p) {
    const barWidth = 30;
    const barHeight = 3;
    const barX = this.x - barWidth / 2;
    const barY = this.y - this.size - 6;

    p.fill(40, 40, 40);
    p.noStroke();
    p.rect(barX, barY, barWidth, barHeight);

    const healthPercent = this.health / this.maxHealth;
    p.fill(255, 100, 100);
    p.rect(barX, barY, barWidth * healthPercent, barHeight);
  }
}

export class Bullet {
  constructor(x, y, angle, speed, damage, pierce = 0) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.speed = speed;
    this.size = BULLET_SIZE;
    this.damage = damage;
    this.pierce = pierce;
    this.pierceCount = 0;
    this.lifetime = 120; // 2 seconds
    this.trail = [];
  }

  update() {
    this.x += Math.cos(this.angle) * this.speed;
    this.y += Math.sin(this.angle) * this.speed;
    this.lifetime--;

    // Add trail
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 5) {
      this.trail.shift();
    }

    return this.lifetime <= 0 || this.isOutOfBounds();
  }

  isOutOfBounds() {
    return this.x < -20 || this.x > 620 || this.y < -20 || this.y > 420;
  }

  canPierce() {
    return this.pierceCount < this.pierce;
  }

  onHit() {
    this.pierceCount++;
  }

  draw(p) {
    // Draw trail
    for (let i = 0; i < this.trail.length; i++) {
      const alpha = (i / this.trail.length) * 150;
      p.fill(255, 200, 50, alpha);
      p.noStroke();
      const size = this.size * (i / this.trail.length);
      p.circle(this.trail[i].x, this.trail[i].y, size);
    }

    // Draw bullet
    p.fill(255, 220, 100);
    p.noStroke();
    p.circle(this.x, this.y, this.size);
  }
}

export class XPOrb {
  constructor(x, y, value) {
    this.x = x;
    this.y = y;
    this.value = value;
    this.size = XP_ORB_SIZE;
    this.lifetime = 600; // 10 seconds
    this.pulsePhase = Math.random() * Math.PI * 2;
    this.magnetized = false;
  }

  update(p, player) {
    this.lifetime--;
    this.pulsePhase += 0.1;

    // Magnetize towards player when close
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 100) {
      this.magnetized = true;
    }

    if (this.magnetized) {
      const speed = 4;
      if (dist > 0) {
        this.x += (dx / dist) * speed;
        this.y += (dy / dist) * speed;
      }
    }

    return this.lifetime <= 0;
  }

  draw(p) {
    const pulse = Math.sin(this.pulsePhase) * 2;
    p.fill(100, 255, 200, 200);
    p.noStroke();
    p.circle(this.x, this.y, this.size + pulse);
    
    p.fill(150, 255, 230, 150);
    p.circle(this.x, this.y, (this.size + pulse) * 0.6);
  }
}

export class Particle {
  constructor(x, y, vx, vy, color, lifetime = 30) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.lifetime = lifetime;
    this.maxLifetime = lifetime;
    this.size = 4;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.1; // gravity
    this.lifetime--;
    return this.lifetime <= 0;
  }

  draw(p) {
    const alpha = (this.lifetime / this.maxLifetime) * 255;
    p.fill(...this.color, alpha);
    p.noStroke();
    p.circle(this.x, this.y, this.size);
  }
}