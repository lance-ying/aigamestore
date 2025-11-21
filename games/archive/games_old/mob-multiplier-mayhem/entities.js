import { gameState, MOB_CONFIG, CHAMPION_CONFIG, BASE_CONFIG, PROJECTILE_CONFIG } from './globals.js';

export class Projectile {
  constructor(p, x, y, angle) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * PROJECTILE_CONFIG.speed;
    this.vy = Math.sin(angle) * PROJECTILE_CONFIG.speed;
    this.radius = PROJECTILE_CONFIG.radius;
    this.active = true;
    this.passedGates = new Set();
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;

    // Check boundaries
    if (this.x < 0 || this.x > this.p.width || this.y < 0 || this.y > this.p.height) {
      this.active = false;
    }
  }

  render() {
    this.p.push();
    this.p.fill(...PROJECTILE_CONFIG.color);
    this.p.noStroke();
    this.p.circle(this.x, this.y, this.radius * 2);
    this.p.pop();
  }
}

export class MobUnit {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.radius = MOB_CONFIG.radius;
    this.speed = MOB_CONFIG.speed;
    this.damage = MOB_CONFIG.damage;
    this.active = true;
    this.hasHitBase = false;
    this.spawnFrame = p.frameCount;
  }

  update() {
    if (!this.active) return;

    const base = gameState.enemyBase;
    if (!base) return;

    // Simple movement toward base
    const dx = base.x - this.x;
    const dy = base.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 1) {
      this.x += (dx / dist) * this.speed;
      this.y += (dy / dist) * this.speed;
    }

    // Check if in speed boost zone
    for (const zone of gameState.speedBoostZones) {
      if (this.x > zone.x && this.x < zone.x + zone.width &&
          this.y > zone.y && this.y < zone.y + zone.height) {
        this.x += (dx / dist) * this.speed * 0.5; // 1.5x speed
        this.y += (dy / dist) * this.speed * 0.5;
        break;
      }
    }

    // Check collision with obstacles
    for (const obs of gameState.obstacles) {
      if (this.p.collideCircleCircle(this.x, this.y, this.radius * 2, 
          obs.x + obs.width / 2, obs.y + obs.height / 2, 
          Math.max(obs.width, obs.height))) {
        // Simple bounce/slide around obstacle
        if (Math.abs(dx) > Math.abs(dy)) {
          this.y += dy > 0 ? this.speed : -this.speed;
        } else {
          this.x += dx > 0 ? this.speed : -this.speed;
        }
      }
    }

    // Check collision with base
    if (this.p.collideCircleCircle(this.x, this.y, this.radius * 2,
        base.x, base.y, Math.max(base.width, base.height))) {
      if (!this.hasHitBase) {
        base.takeDamage(this.damage);
        this.hasHitBase = true;
        gameState.score += 10;
        this.active = false;
      }
    }
  }

  render() {
    if (!this.active) return;

    this.p.push();
    this.p.fill(...MOB_CONFIG.color);
    this.p.noStroke();
    
    // Spawn animation
    const age = this.p.frameCount - this.spawnFrame;
    if (age < 10) {
      const scale = age / 10;
      this.p.circle(this.x, this.y, this.radius * 2 * scale);
    } else {
      this.p.circle(this.x, this.y, this.radius * 2);
    }
    this.p.pop();
  }
}

export class Champion {
  constructor(p, x, y, type) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.type = type;
    const config = CHAMPION_CONFIG[type];
    this.radius = config.radius;
    this.speed = config.speed;
    this.damage = config.damage;
    this.health = config.health;
    this.maxHealth = config.health;
    this.color = config.color;
    this.label = config.label;
    this.active = true;
    this.hasHitBase = false;
    this.spawnFrame = p.frameCount;
  }

  update() {
    if (!this.active || this.health <= 0) {
      this.active = false;
      return;
    }

    const base = gameState.enemyBase;
    if (!base) return;

    const dx = base.x - this.x;
    const dy = base.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 1) {
      this.x += (dx / dist) * this.speed;
      this.y += (dy / dist) * this.speed;
    }

    // Check if in speed boost zone
    for (const zone of gameState.speedBoostZones) {
      if (this.x > zone.x && this.x < zone.x + zone.width &&
          this.y > zone.y && this.y < zone.y + zone.height) {
        this.x += (dx / dist) * this.speed * 0.5;
        this.y += (dy / dist) * this.speed * 0.5;
        break;
      }
    }

    // Check collision with destructible obstacles (tank only)
    if (this.type === 'tank') {
      for (let i = gameState.obstacles.length - 1; i >= 0; i--) {
        const obs = gameState.obstacles[i];
        if (obs.destructible && this.p.collideCircleCircle(
            this.x, this.y, this.radius * 2,
            obs.x + obs.width / 2, obs.y + obs.height / 2,
            Math.max(obs.width, obs.height))) {
          gameState.obstacles.splice(i, 1);
          break;
        }
      }
    }

    // Check collision with regular obstacles
    for (const obs of gameState.obstacles) {
      if (!obs.destructible && this.p.collideCircleCircle(
          this.x, this.y, this.radius * 2,
          obs.x + obs.width / 2, obs.y + obs.height / 2,
          Math.max(obs.width, obs.height))) {
        if (Math.abs(dx) > Math.abs(dy)) {
          this.y += dy > 0 ? this.speed : -this.speed;
        } else {
          this.x += dx > 0 ? this.speed : -this.speed;
        }
      }
    }

    // Check collision with base
    if (this.p.collideCircleCircle(this.x, this.y, this.radius * 2,
        base.x, base.y, Math.max(base.width, base.height))) {
      if (!this.hasHitBase) {
        base.takeDamage(this.damage);
        this.hasHitBase = true;
        this.active = false;
      }
    }
  }

  render() {
    if (!this.active) return;

    this.p.push();
    
    // Spawn animation
    const age = this.p.frameCount - this.spawnFrame;
    const scale = age < 10 ? age / 10 : 1;
    
    this.p.fill(...this.color);
    this.p.noStroke();
    this.p.circle(this.x, this.y, this.radius * 2 * scale);
    
    // Label
    this.p.fill(255);
    this.p.textAlign(this.p.CENTER, this.p.CENTER);
    this.p.textSize(10);
    this.p.text(this.label, this.x, this.y);
    
    // Health bar
    if (this.health < this.maxHealth) {
      const barWidth = this.radius * 2;
      const barHeight = 3;
      const healthPercent = this.health / this.maxHealth;
      
      this.p.fill(50);
      this.p.rect(this.x - barWidth / 2, this.y - this.radius - 5, barWidth, barHeight);
      this.p.fill(50, 200, 50);
      this.p.rect(this.x - barWidth / 2, this.y - this.radius - 5, barWidth * healthPercent, barHeight);
    }
    
    this.p.pop();
  }
}

export class EnemyBase {
  constructor(p) {
    this.p = p;
    this.x = BASE_CONFIG.x;
    this.y = BASE_CONFIG.y;
    this.width = BASE_CONFIG.width;
    this.height = BASE_CONFIG.height;
    this.health = gameState.levelConfig.baseHealth;
    this.maxHealth = gameState.levelConfig.baseHealth;
    this.color = BASE_CONFIG.color;
    this.damageFlashFrames = 0;
    this.shakeOffset = { x: 0, y: 0 };
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health < 0) this.health = 0;
    
    this.damageFlashFrames = 10;
    this.shakeOffset = {
      x: this.p.random(-3, 3),
      y: this.p.random(-3, 3)
    };
    
    gameState.score += Math.floor(amount / 10);
  }

  update() {
    if (this.damageFlashFrames > 0) {
      this.damageFlashFrames--;
      if (this.damageFlashFrames === 0) {
        this.shakeOffset = { x: 0, y: 0 };
      }
    }
  }

  render() {
    this.p.push();
    
    const renderX = this.x + this.shakeOffset.x;
    const renderY = this.y + this.shakeOffset.y;
    
    // Base structure
    if (this.damageFlashFrames > 0) {
      this.p.fill(255, 100, 100);
    } else {
      this.p.fill(...this.color);
    }
    this.p.stroke(150);
    this.p.strokeWeight(2);
    this.p.rectMode(this.p.CENTER);
    this.p.rect(renderX, renderY, this.width, this.height);
    
    // Health bar
    const barWidth = this.width + 20;
    const barHeight = 8;
    const healthPercent = this.health / this.maxHealth;
    
    this.p.noStroke();
    this.p.fill(50);
    this.p.rect(renderX, renderY - this.height / 2 - 15, barWidth, barHeight);
    
    const healthColor = healthPercent > 0.5 ? [50, 200, 50] : 
                       healthPercent > 0.25 ? [200, 200, 50] : [200, 50, 50];
    this.p.fill(...healthColor);
    this.p.rect(renderX - barWidth / 2 + (barWidth * healthPercent) / 2, 
                renderY - this.height / 2 - 15, 
                barWidth * healthPercent, barHeight);
    
    // Health text
    this.p.fill(255);
    this.p.textAlign(this.p.CENTER, this.p.CENTER);
    this.p.textSize(10);
    this.p.text(`${this.health}/${this.maxHealth}`, renderX, renderY - this.height / 2 - 15);
    
    this.p.pop();
  }
}

export class Gate {
  constructor(p, x, y, width, height, multiplier) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.multiplier = multiplier;
    this.activationFrames = 0;
  }

  activate() {
    this.activationFrames = 30;
  }

  update() {
    if (this.activationFrames > 0) {
      this.activationFrames--;
    }
  }

  render() {
    this.p.push();
    
    // Gate frame
    const isActive = this.activationFrames > 0;
    if (isActive) {
      this.p.stroke(255, 255, 100);
      this.p.strokeWeight(4);
    } else {
      this.p.stroke(200, 200, 0);
      this.p.strokeWeight(2);
    }
    this.p.noFill();
    this.p.rectMode(this.p.CORNER);
    this.p.rect(this.x, this.y, this.width, this.height);
    
    // Multiplier text
    this.p.fill(255);
    this.p.noStroke();
    this.p.textAlign(this.p.CENTER, this.p.CENTER);
    this.p.textSize(20);
    this.p.text(`x${this.multiplier}`, this.x + this.width / 2, this.y + this.height / 2);
    
    // Glow effect when active
    if (isActive) {
      const alpha = (this.activationFrames / 30) * 100;
      this.p.fill(255, 255, 100, alpha);
      this.p.rect(this.x, this.y, this.width, this.height);
    }
    
    this.p.pop();
  }
}