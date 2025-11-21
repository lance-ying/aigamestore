// entities.js - Game entity classes

import { PLAYER_CONFIG, ENEMY_CONFIG, gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Player {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.angle = 0;
    this.health = PLAYER_CONFIG.maxHealth;
    this.maxHealth = PLAYER_CONFIG.maxHealth;
    this.ammo = PLAYER_CONFIG.maxAmmo;
    this.maxAmmo = PLAYER_CONFIG.maxAmmo;
    this.moveSpeed = PLAYER_CONFIG.moveSpeed;
    this.framesSinceFire = 999;
    this.reloading = false;
    this.reloadFrames = 0;
    this.sprinting = false;
  }

  update(keys) {
    const speed = this.sprinting ? this.moveSpeed * PLAYER_CONFIG.sprintMultiplier : this.moveSpeed;
    
    // Movement
    if (keys.up) {
      this.x += this.p.cos(this.angle) * speed;
      this.y += this.p.sin(this.angle) * speed;
    }
    if (keys.down) {
      this.x -= this.p.cos(this.angle) * speed;
      this.y -= this.p.sin(this.angle) * speed;
    }
    if (keys.left) {
      this.angle -= PLAYER_CONFIG.turnSpeed;
    }
    if (keys.right) {
      this.angle += PLAYER_CONFIG.turnSpeed;
    }

    // Boundary constraints
    this.x = this.p.constrain(this.x, 20, CANVAS_WIDTH - 20);
    this.y = this.p.constrain(this.y, 20, CANVAS_HEIGHT - 20);

    this.framesSinceFire++;

    // Reload handling
    if (this.reloading) {
      this.reloadFrames++;
      if (this.reloadFrames >= PLAYER_CONFIG.reloadTime) {
        this.ammo = this.maxAmmo;
        this.reloading = false;
        this.reloadFrames = 0;
      }
    }
  }

  shoot() {
    if (this.framesSinceFire >= PLAYER_CONFIG.fireRate && !this.reloading && this.ammo > 0) {
      this.framesSinceFire = 0;
      this.ammo--;
      return true;
    }
    return false;
  }

  reload() {
    if (!this.reloading && this.ammo < this.maxAmmo) {
      this.reloading = true;
      this.reloadFrames = 0;
    }
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.health = 0;
    }
  }

  heal(amount) {
    this.health = this.p.min(this.health + amount, this.maxHealth);
  }

  addAmmo(amount) {
    this.ammo = this.p.min(this.ammo + amount, this.maxAmmo);
  }

  render() {
    this.p.push();
    this.p.translate(this.x, this.y);
    this.p.rotate(this.angle);
    
    // Body (rectangle)
    this.p.fill(50, 120, 200);
    this.p.stroke(30, 80, 150);
    this.p.strokeWeight(2);
    this.p.rectMode(this.p.CENTER);
    this.p.rect(0, 0, 20, 15);
    
    // Gun barrel
    this.p.fill(40, 40, 40);
    this.p.noStroke();
    this.p.rect(12, 0, 10, 4);
    
    // Direction indicator
    this.p.fill(255, 200, 0);
    this.p.circle(6, 0, 4);
    
    this.p.pop();

    // Health bar
    this.renderHealthBar();
  }

  renderHealthBar() {
    const barWidth = 30;
    const barHeight = 4;
    const healthPercent = this.health / this.maxHealth;
    
    this.p.push();
    this.p.noStroke();
    this.p.fill(100, 100, 100);
    this.p.rect(this.x - barWidth/2, this.y - 20, barWidth, barHeight);
    this.p.fill(healthPercent > 0.3 ? (100, 200, 100) : (200, 50, 50));
    this.p.rect(this.x - barWidth/2, this.y - 20, barWidth * healthPercent, barHeight);
    this.p.pop();
  }
}

export class Enemy {
  constructor(p, x, y, difficulty = 1) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.angle = p.random(p.TWO_PI);
    this.health = ENEMY_CONFIG.maxHealth * difficulty;
    this.maxHealth = ENEMY_CONFIG.maxHealth * difficulty;
    this.moveSpeed = ENEMY_CONFIG.moveSpeed * (0.8 + difficulty * 0.2);
    this.difficulty = difficulty;
    this.framesSinceFire = 0;
    this.targetPlayer = true;
    this.wanderAngle = p.random(p.TWO_PI);
    this.wanderChangeFrames = 0;
    this.color = [200 - difficulty * 20, 50 + difficulty * 10, 50];
  }

  update(player) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = this.p.dist(this.x, this.y, player.x, player.y);
    
    if (dist < ENEMY_CONFIG.detectionRange) {
      // Move toward player
      const targetAngle = this.p.atan2(dy, dx);
      let angleDiff = targetAngle - this.angle;
      
      // Normalize angle difference
      while (angleDiff > this.p.PI) angleDiff -= this.p.TWO_PI;
      while (angleDiff < -this.p.PI) angleDiff += this.p.TWO_PI;
      
      this.angle += angleDiff * ENEMY_CONFIG.turnSpeed * this.difficulty;
      
      if (dist > 100) {
        this.x += this.p.cos(this.angle) * this.moveSpeed;
        this.y += this.p.sin(this.angle) * this.moveSpeed;
      }
    } else {
      // Wander behavior
      this.wanderChangeFrames++;
      if (this.wanderChangeFrames > 60) {
        this.wanderAngle += this.p.random(-0.5, 0.5);
        this.wanderChangeFrames = 0;
      }
      this.angle += (this.wanderAngle - this.angle) * 0.05;
      this.x += this.p.cos(this.angle) * this.moveSpeed * 0.5;
      this.y += this.p.sin(this.angle) * this.moveSpeed * 0.5;
    }

    // Boundary constraints
    this.x = this.p.constrain(this.x, 20, CANVAS_WIDTH - 20);
    this.y = this.p.constrain(this.y, 20, CANVAS_HEIGHT - 20);

    this.framesSinceFire++;
  }

  canShoot() {
    const player = gameState.player;
    const dist = this.p.dist(this.x, this.y, player.x, player.y);
    return this.framesSinceFire >= ENEMY_CONFIG.fireRate / this.difficulty && dist < ENEMY_CONFIG.attackRange;
  }

  shoot() {
    this.framesSinceFire = 0;
  }

  takeDamage(amount) {
    this.health -= amount;
    return this.health <= 0;
  }

  render() {
    this.p.push();
    this.p.translate(this.x, this.y);
    this.p.rotate(this.angle);
    
    // Body
    this.p.fill(...this.color);
    this.p.stroke(this.color[0] - 50, this.color[1] - 20, this.color[2] - 20);
    this.p.strokeWeight(2);
    this.p.rectMode(this.p.CENTER);
    this.p.rect(0, 0, 18, 13);
    
    // Gun
    this.p.fill(40, 40, 40);
    this.p.noStroke();
    this.p.rect(10, 0, 8, 3);
    
    // Direction indicator
    this.p.fill(255, 100, 100);
    this.p.circle(5, 0, 3);
    
    this.p.pop();

    // Health bar
    this.renderHealthBar();
  }

  renderHealthBar() {
    const barWidth = 25;
    const barHeight = 3;
    const healthPercent = this.health / this.maxHealth;
    
    this.p.push();
    this.p.noStroke();
    this.p.fill(80, 80, 80);
    this.p.rect(this.x - barWidth/2, this.y - 15, barWidth, barHeight);
    this.p.fill(200, 100, 100);
    this.p.rect(this.x - barWidth/2, this.y - 15, barWidth * healthPercent, barHeight);
    this.p.pop();
  }
}

export class Projectile {
  constructor(p, x, y, angle, fromPlayer = true) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.speed = 8;
    this.fromPlayer = fromPlayer;
    this.lifetime = 60;
  }

  update() {
    this.x += this.p.cos(this.angle) * this.speed;
    this.y += this.p.sin(this.angle) * this.speed;
    this.lifetime--;
    return this.lifetime <= 0 || this.x < 0 || this.x > CANVAS_WIDTH || this.y < 0 || this.y > CANVAS_HEIGHT;
  }

  render() {
    this.p.push();
    this.p.fill(...(this.fromPlayer ? [255, 220, 100] : [255, 100, 100]));
    this.p.noStroke();
    this.p.circle(this.x, this.y, 4);
    this.p.pop();
  }
}

export class Pickup {
  constructor(p, x, y, type) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.type = type;
    this.bobOffset = 0;
    this.rotation = 0;
  }

  update() {
    this.bobOffset = this.p.sin(this.p.frameCount * 0.1) * 3;
    this.rotation += 0.05;
  }

  render() {
    this.p.push();
    this.p.translate(this.x, this.y + this.bobOffset);
    this.p.rotate(this.rotation);
    
    if (this.type === "HEALTH") {
      this.p.fill(100, 255, 100);
      this.p.stroke(50, 200, 50);
      this.p.strokeWeight(2);
      this.p.rectMode(this.p.CENTER);
      this.p.rect(0, 0, 10, 10);
      this.p.rect(0, 0, 4, 16);
      this.p.rect(0, 0, 16, 4);
    } else if (this.type === "AMMO") {
      this.p.fill(255, 200, 50);
      this.p.stroke(200, 150, 30);
      this.p.strokeWeight(2);
      this.p.rectMode(this.p.CENTER);
      this.p.rect(0, 0, 12, 8);
      this.p.fill(100, 100, 100);
      this.p.rect(0, 0, 6, 6);
    }
    
    this.p.pop();
  }
}

export class Particle {
  constructor(p, x, y, vx, vy, color, lifetime = 30) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.lifetime = lifetime;
    this.maxLifetime = lifetime;
    this.size = p.random(2, 5);
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.15; // Gravity
    this.lifetime--;
    return this.lifetime <= 0;
  }

  render() {
    const alpha = this.lifetime / this.maxLifetime;
    this.p.push();
    this.p.noStroke();
    this.p.fill(this.color[0], this.color[1], this.color[2], alpha * 255);
    this.p.circle(this.x, this.y, this.size);
    this.p.pop();
  }
}