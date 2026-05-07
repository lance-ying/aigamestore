// entities.js - Game entity classes

import { PLAYER_CONFIG, ENEMY_CONFIG, WEAPON_TYPES, gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Player {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.angle = 0;
    this.health = PLAYER_CONFIG.maxHealth;
    this.maxHealth = PLAYER_CONFIG.maxHealth;
    this.currentWeapon = "PISTOL";
    this.ammo = WEAPON_TYPES.PISTOL.maxAmmo;
    this.maxAmmo = WEAPON_TYPES.PISTOL.maxAmmo;
    this.framesSinceFire = 999;
    this.reloading = false;
    this.reloadFrames = 0;
    this.velocityX = 0;
    this.velocityY = 0;
  }

  // Continuous movement methods (for holding keys)
  moveForwardContinuous(speed) {
    const newX = this.x + this.p.cos(this.angle) * speed;
    const newY = this.y + this.p.sin(this.angle) * speed;
    
    if (!this.checkObstacleCollision(newX, newY)) {
      this.x = newX;
      this.y = newY;
    }
  }

  moveBackwardContinuous(speed) {
    const newX = this.x - this.p.cos(this.angle) * speed;
    const newY = this.y - this.p.sin(this.angle) * speed;
    
    if (!this.checkObstacleCollision(newX, newY)) {
      this.x = newX;
      this.y = newY;
    }
  }

  // Discrete movement actions (for AI and tap-based movement)
  moveForward(distance) {
    // Add impulse to velocity for smooth movement
    const impulse = distance * 0.2;
    this.velocityX += this.p.cos(this.angle) * impulse;
    this.velocityY += this.p.sin(this.angle) * impulse;
  }

  moveBackward(distance) {
    // Add impulse to velocity for smooth movement
    const impulse = distance * 0.2;
    this.velocityX -= this.p.cos(this.angle) * impulse;
    this.velocityY -= this.p.sin(this.angle) * impulse;
  }

  turnLeft(angle) {
    this.angle -= angle;
  }

  turnRight(angle) {
    this.angle += angle;
  }

  // Passive update (for reload timers, velocity, etc.)
  passiveUpdate() {
    this.framesSinceFire++;

    // Apply velocity for smooth movement (for AI)
    const newX = this.x + this.velocityX;
    const newY = this.y + this.velocityY;
    
    if (!this.checkObstacleCollision(newX, newY)) {
      this.x = newX;
      this.y = newY;
    }
    
    // Apply velocity decay (friction)
    this.velocityX *= 0.8;
    this.velocityY *= 0.8;
    
    // Stop very small velocities
    if (Math.abs(this.velocityX) < 0.01) this.velocityX = 0;
    if (Math.abs(this.velocityY) < 0.01) this.velocityY = 0;
    
    // Boundary constraints
    this.x = this.p.constrain(this.x, 20, CANVAS_WIDTH - 20);
    this.y = this.p.constrain(this.y, 20, CANVAS_HEIGHT - 20);

    // Reload handling
    if (this.reloading) {
      this.reloadFrames++;
      const weapon = WEAPON_TYPES[this.currentWeapon];
      if (this.reloadFrames >= weapon.reloadTime) {
        this.ammo = this.maxAmmo;
        this.reloading = false;
        this.reloadFrames = 0;
      }
    }
  }

  checkObstacleCollision(x, y) {
    for (const obstacle of gameState.obstacles) {
      if (x > obstacle.x - obstacle.width / 2 - 10 &&
          x < obstacle.x + obstacle.width / 2 + 10 &&
          y > obstacle.y - obstacle.height / 2 - 10 &&
          y < obstacle.y + obstacle.height / 2 + 10) {
        return true;
      }
    }
    return false;
  }

  shoot() {
    const weapon = WEAPON_TYPES[this.currentWeapon];
    if (this.framesSinceFire >= weapon.fireRate && !this.reloading && this.ammo > 0) {
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

  switchWeapon(weaponType) {
    if (WEAPON_TYPES[weaponType]) {
      this.currentWeapon = weaponType;
      const weapon = WEAPON_TYPES[weaponType];
      this.maxAmmo = weapon.maxAmmo;
      this.ammo = weapon.maxAmmo;
      this.reloading = false;
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
    this.p.fill(healthPercent > 0.3 ? 100 : 200, healthPercent > 0.3 ? 200 : 50, healthPercent > 0.3 ? 100 : 50);
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
        const newX = this.x + this.p.cos(this.angle) * this.moveSpeed;
        const newY = this.y + this.p.sin(this.angle) * this.moveSpeed;
        
        if (!this.checkObstacleCollision(newX, newY)) {
          this.x = newX;
          this.y = newY;
        }
      }
    } else {
      // Wander behavior
      this.wanderChangeFrames++;
      if (this.wanderChangeFrames > 60) {
        this.wanderAngle += this.p.random(-0.5, 0.5);
        this.wanderChangeFrames = 0;
      }
      this.angle += (this.wanderAngle - this.angle) * 0.05;
      
      const newX = this.x + this.p.cos(this.angle) * this.moveSpeed * 0.5;
      const newY = this.y + this.p.sin(this.angle) * this.moveSpeed * 0.5;
      
      if (!this.checkObstacleCollision(newX, newY)) {
        this.x = newX;
        this.y = newY;
      }
    }

    // Boundary constraints
    this.x = this.p.constrain(this.x, 20, CANVAS_WIDTH - 20);
    this.y = this.p.constrain(this.y, 20, CANVAS_HEIGHT - 20);

    this.framesSinceFire++;
  }

  checkObstacleCollision(x, y) {
    for (const obstacle of gameState.obstacles) {
      if (x > obstacle.x - obstacle.width / 2 - 9 &&
          x < obstacle.x + obstacle.width / 2 + 9 &&
          y > obstacle.y - obstacle.height / 2 - 9 &&
          y < obstacle.y + obstacle.height / 2 + 9) {
        return true;
      }
    }
    return false;
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
  constructor(p, x, y, angle, fromPlayer = true, color = null) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.speed = 8;
    this.fromPlayer = fromPlayer;
    this.lifetime = 60;
    this.color = color || (fromPlayer ? [255, 220, 100] : [255, 100, 100]);
  }

  update() {
    const newX = this.x + this.p.cos(this.angle) * this.speed;
    const newY = this.y + this.p.sin(this.angle) * this.speed;
    
    // Check obstacle collision
    let hitObstacle = false;
    for (const obstacle of gameState.obstacles) {
      if (newX > obstacle.x - obstacle.width / 2 &&
          newX < obstacle.x + obstacle.width / 2 &&
          newY > obstacle.y - obstacle.height / 2 &&
          newY < obstacle.y + obstacle.height / 2) {
        hitObstacle = true;
        break;
      }
    }
    
    if (hitObstacle) {
      return true; // Remove projectile
    }
    
    this.x = newX;
    this.y = newY;
    this.lifetime--;
    return this.lifetime <= 0 || this.x < 0 || this.x > CANVAS_WIDTH || this.y < 0 || this.y > CANVAS_HEIGHT;
  }

  render() {
    this.p.push();
    this.p.fill(...this.color);
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

export class WeaponPickup {
  constructor(p, x, y, weaponType) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.weaponType = weaponType;
    this.bobOffset = 0;
    this.rotation = 0;
  }

  update() {
    this.bobOffset = this.p.sin(this.p.frameCount * 0.1) * 3;
    this.rotation += 0.05;
  }

  render() {
    const weapon = WEAPON_TYPES[this.weaponType];
    this.p.push();
    this.p.translate(this.x, this.y + this.bobOffset);
    this.p.rotate(this.rotation);
    
    this.p.fill(...weapon.color);
    this.p.stroke(weapon.color[0] - 50, weapon.color[1] - 50, weapon.color[2] - 50);
    this.p.strokeWeight(2);
    this.p.rectMode(this.p.CENTER);
    this.p.rect(0, 0, 16, 6);
    this.p.rect(8, 0, 6, 3);
    
    this.p.pop();
  }
}

export class Obstacle {
  constructor(p, x, y, width, height) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  render() {
    this.p.push();
    this.p.fill(80, 70, 60);
    this.p.stroke(60, 50, 40);
    this.p.strokeWeight(2);
    this.p.rectMode(this.p.CENTER);
    this.p.rect(this.x, this.y, this.width, this.height);
    
    // Add some texture
    this.p.fill(100, 90, 80);
    this.p.noStroke();
    this.p.rect(this.x - this.width/4, this.y - this.height/4, this.width/3, this.height/3);
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