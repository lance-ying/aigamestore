// entities.js - Game entity classes
import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';
import { keysJustPressed } from './input.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.radius = 20;
    this.maxHP = 100;
    this.currentHP = 100;
    this.damageStat = 10;
    this.attackSpeedStat = 1.0;
    this.rangeStat = 200;
    this.movementSpeedStat = 3;
    this.currentExp = 0;
    this.expToNextLevel = 100;
    this.playerLevel = 1;
    this.attackCooldown = 0;
    this.dashCooldown = 0;
    this.isDashing = false;
    this.dashDuration = 0;
    this.hitFlash = 0;
  }

  update(p, keys) {
    // Reset velocity to 0 first, then set based on current keys
    // This prevents residual velocity from previous inputs
    this.vx = 0;
    this.vy = 0;
    
    const moveSpeed = this.movementSpeedStat;
    
    // Check for continuous movement based on held keys
    if (keys.w || keys.up) {
      this.vy = -moveSpeed;
    }
    if (keys.s || keys.down) {
      this.vy = moveSpeed;
    }
    if (keys.a || keys.left) {
      this.vx = -moveSpeed;
    }
    if (keys.d || keys.right) {
      this.vx = moveSpeed;
    }
    
    // Handle opposing keys canceling out
    if ((keys.w || keys.up) && (keys.s || keys.down)) {
      this.vy = 0;
    }
    if ((keys.a || keys.left) && (keys.d || keys.right)) {
      this.vx = 0;
    }
    
    // Normalize diagonal movement
    if ((keys.w || keys.up || keys.s || keys.down) && 
        (keys.a || keys.left || keys.d || keys.right)) {
      const magnitude = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      if (magnitude > 0) {
        this.vx = (this.vx / magnitude) * moveSpeed;
        this.vy = (this.vy / magnitude) * moveSpeed;
      }
    }
    
    // Handle dash boost (triggered by just pressed)
    if (keysJustPressed.shift || keysJustPressed.shift) {
      this.activateDash();
    }
    
    if (this.isDashing) {
      // Dash multiplies current velocity
      const dashMultiplier = 2.0;
      this.vx *= dashMultiplier;
      this.vy *= dashMultiplier;
      
      this.dashDuration--;
      if (this.dashDuration <= 0) {
        this.isDashing = false;
      }
    }
    
    // Apply velocity to position
    this.x += this.vx;
    this.y += this.vy;
    
    // Keep player in bounds
    this.x = p.constrain(this.x, this.radius, CANVAS_WIDTH - this.radius);
    this.y = p.constrain(this.y, this.radius, CANVAS_HEIGHT - this.radius);
    
    // Bounce off walls to prevent getting stuck
    if (this.x <= this.radius || this.x >= CANVAS_WIDTH - this.radius) {
      this.vx = 0;
    }
    if (this.y <= this.radius || this.y >= CANVAS_HEIGHT - this.radius) {
      this.vy = 0;
    }
    
    // Update cooldowns
    if (this.attackCooldown > 0) this.attackCooldown--;
    if (this.dashCooldown > 0) this.dashCooldown--;
    if (this.hitFlash > 0) this.hitFlash--;
  }

  activateDash() {
    if (this.dashCooldown <= 0 && (this.vx !== 0 || this.vy !== 0)) {
      this.isDashing = true;
      this.dashDuration = 15;
      this.dashCooldown = 120;
    }
  }

  takeDamage(amount) {
    this.currentHP -= amount;
    this.hitFlash = 10;
    if (this.currentHP <= 0) {
      this.currentHP = 0;
    }
  }

  addExp(amount) {
    this.currentExp += amount;
    if (this.currentExp >= this.expToNextLevel) {
      this.currentExp -= this.expToNextLevel;
      this.playerLevel++;
      this.expToNextLevel = Math.floor(this.expToNextLevel * 1.5);
      return true; // Level up occurred
    }
    return false;
  }

  render(p) {
    p.push();
    
    // Dash trail effect
    if (this.isDashing) {
      p.noStroke();
      p.fill(255, 200, 100, 100);
      p.ellipse(this.x - this.vx * 0.5, this.y - this.vy * 0.5, this.radius * 2);
    }
    
    // Hit flash effect
    if (this.hitFlash > 0) {
      p.fill(255, 100, 100);
    } else {
      p.fill(200, 160, 100);
    }
    p.stroke(150, 120, 80);
    p.strokeWeight(2);
    p.ellipse(this.x, this.y, this.radius * 2);
    
    // Eyes
    p.fill(50);
    p.noStroke();
    p.ellipse(this.x - 6, this.y - 3, 4, 6);
    p.ellipse(this.x + 6, this.y - 3, 4, 6);
    
    // Weapon indicator pointing to nearest enemy
    const nearestEnemy = this.findNearestEnemy();
    if (nearestEnemy) {
      const angle = Math.atan2(nearestEnemy.y - this.y, nearestEnemy.x - this.x);
      p.stroke(255);
      p.strokeWeight(3);
      const weaponDist = this.radius + 8;
      p.line(
        this.x + Math.cos(angle) * this.radius,
        this.y + Math.sin(angle) * this.radius,
        this.x + Math.cos(angle) * weaponDist,
        this.y + Math.sin(angle) * weaponDist
      );
    }
    
    p.pop();
  }

  findNearestEnemy() {
    let nearest = null;
    let minDist = Infinity;
    
    for (const enemy of gameState.enemies) {
      const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
      if (dist < minDist) {
        minDist = dist;
        nearest = enemy;
      }
    }
    
    return nearest;
  }
}

export class Enemy {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.vx = 0;
    this.vy = 0;
    this.hitFlash = 0;
    
    // Set stats based on type
    switch (type) {
      case 'grunt':
        this.radius = 12;
        this.maxHP = 20;
        this.currentHP = 20;
        this.damage = 5;
        this.speed = 1.5;
        this.color = [100, 200, 100];
        this.scoreValue = 10;
        break;
      case 'ranged':
        this.radius = 15;
        this.maxHP = 15;
        this.currentHP = 15;
        this.damage = 3;
        this.speed = 1.0;
        this.color = [100, 150, 255];
        this.fireRate = 120;
        this.fireTimer = 0;
        this.projectileSpeed = 2;
        this.scoreValue = 20;
        break;
      case 'charger':
        this.radius = 15;
        this.maxHP = 30;
        this.currentHP = 30;
        this.damage = 10;
        this.speed = 2.5;
        this.color = [255, 150, 50];
        this.scoreValue = 25;
        break;
      case 'elite':
        this.radius = 25;
        this.maxHP = 100;
        this.currentHP = 100;
        this.damage = 15;
        this.speed = 1.2;
        this.color = [180, 100, 255];
        this.scoreValue = 50;
        break;
      case 'boss':
        this.radius = 40;
        this.maxHP = 500;
        this.currentHP = 500;
        this.damage = 20;
        this.speed = 0.8;
        this.color = [200, 50, 50];
        this.fireRate = 60;
        this.fireTimer = 0;
        this.projectileSpeed = 2.5;
        this.scoreValue = 200;
        this.spawnTimer = 0;
        break;
    }
  }

  update(p, player) {
    // Move towards player
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);
    
    if (dist > 0) {
      this.vx = (dx / dist) * this.speed;
      this.vy = (dy / dist) * this.speed;
    }
    
    this.x += this.vx;
    this.y += this.vy;
    
    // Ranged enemy shooting
    if (this.type === 'ranged' || this.type === 'boss') {
      this.fireTimer++;
      if (this.fireTimer >= this.fireRate) {
        this.fireTimer = 0;
        this.shoot(player);
      }
    }
    
    // Boss spawning minions
    if (this.type === 'boss') {
      this.spawnTimer++;
      if (this.spawnTimer >= 300) {
        this.spawnTimer = 0;
        this.spawnMinion();
      }
    }
    
    if (this.hitFlash > 0) this.hitFlash--;
  }

  shoot(player) {
    const angle = Math.atan2(player.y - this.y, player.x - this.x);
    const projectile = new Projectile(
      this.x + Math.cos(angle) * this.radius,
      this.y + Math.sin(angle) * this.radius,
      Math.cos(angle) * this.projectileSpeed,
      Math.sin(angle) * this.projectileSpeed,
      this.damage,
      'enemy',
      200
    );
    gameState.projectiles.push(projectile);
  }

  spawnMinion() {
    const angle = Math.random() * Math.PI * 2;
    const dist = 60;
    const enemy = new Enemy(
      this.x + Math.cos(angle) * dist,
      this.y + Math.sin(angle) * dist,
      'grunt'
    );
    gameState.enemies.push(enemy);
    gameState.entities.push(enemy);
  }

  takeDamage(amount) {
    this.currentHP -= amount;
    this.hitFlash = 5;
  }

  render(p) {
    p.push();
    
    const flashColor = this.hitFlash > 0 ? [255, 255, 255] : this.color;
    p.fill(...flashColor);
    p.stroke(this.color[0] * 0.7, this.color[1] * 0.7, this.color[2] * 0.7);
    p.strokeWeight(2);
    
    // Draw spiky outline for elite
    if (this.type === 'elite') {
      p.beginShape();
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const r = i % 2 === 0 ? this.radius * 1.3 : this.radius;
        p.vertex(this.x + Math.cos(angle) * r, this.y + Math.sin(angle) * r);
      }
      p.endShape(p.CLOSE);
    } else {
      p.ellipse(this.x, this.y, this.radius * 2);
    }
    
    // Boss glow effect
    if (this.type === 'boss') {
      p.noFill();
      p.stroke(255, 100, 100, 100);
      p.strokeWeight(3);
      p.ellipse(this.x, this.y, this.radius * 2.3);
    }
    
    // Ranged indicator
    if (this.type === 'ranged' || this.type === 'boss') {
      p.fill(255);
      p.noStroke();
      p.ellipse(this.x, this.y, 6);
    }
    
    // Health bar
    if (this.currentHP < this.maxHP) {
      const barWidth = this.radius * 2;
      const barHeight = 4;
      const healthPercent = this.currentHP / this.maxHP;
      
      p.fill(50);
      p.noStroke();
      p.rect(this.x - barWidth / 2, this.y - this.radius - 10, barWidth, barHeight);
      
      p.fill(200, 50, 50);
      p.rect(this.x - barWidth / 2, this.y - this.radius - 10, barWidth * healthPercent, barHeight);
    }
    
    p.pop();
  }
}

export class Projectile {
  constructor(x, y, vx, vy, damage, source, range) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.damage = damage;
    this.source = source;
    this.range = range;
    this.distanceTraveled = 0;
    this.radius = source === 'player' ? 4 : 5;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.distanceTraveled += Math.hypot(this.vx, this.vy);
  }

  render(p) {
    p.push();
    p.noStroke();
    
    if (this.source === 'player') {
      p.fill(255, 255, 100);
      p.ellipse(this.x, this.y, this.radius * 2);
    } else {
      p.fill(255, 50, 50);
      p.rect(this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2);
    }
    
    p.pop();
  }

  isOutOfRange() {
    return this.distanceTraveled >= this.range;
  }

  isOffScreen() {
    return this.x < -10 || this.x > CANVAS_WIDTH + 10 || 
           this.y < -10 || this.y > CANVAS_HEIGHT + 10;
  }
}

export class Item {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.radius = 6;
    this.lifetime = 600;
    this.pulse = 0;
    
    switch (type) {
      case 'exp':
        this.color = [255, 255, 100];
        this.value = 20;
        break;
      case 'materials':
        this.color = [180, 100, 255];
        this.value = 5;
        break;
      case 'health':
        this.color = [255, 50, 50];
        this.value = 20;
        break;
    }
  }

  update() {
    this.lifetime--;
    this.pulse += 0.1;
  }

  render(p) {
    p.push();
    
    const pulseSize = Math.sin(this.pulse) * 2 + this.radius;
    p.noStroke();
    
    // Outer glow
    p.fill(...this.color, 100);
    p.ellipse(this.x, this.y, pulseSize * 3);
    
    // Main item
    p.fill(...this.color);
    
    if (this.type === 'exp') {
      p.ellipse(this.x, this.y, pulseSize * 2);
    } else if (this.type === 'materials') {
      p.beginShape();
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const r = i % 2 === 0 ? pulseSize * 2 : pulseSize * 1.2;
        p.vertex(this.x + Math.cos(angle) * r, this.y + Math.sin(angle) * r);
      }
      p.endShape(p.CLOSE);
    } else if (this.type === 'health') {
      // Cross shape
      p.rect(this.x - pulseSize / 2, this.y - pulseSize * 1.5, pulseSize, pulseSize * 3);
      p.rect(this.x - pulseSize * 1.5, this.y - pulseSize / 2, pulseSize * 3, pulseSize);
    }
    
    p.pop();
  }

  isExpired() {
    return this.lifetime <= 0;
  }
}