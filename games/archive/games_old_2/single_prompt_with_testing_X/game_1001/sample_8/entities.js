import { gameState, WEAPON_TYPES, WEAPON_DATA } from './globals.js';

export class Projectile {
  constructor(p, x, y, direction, weapon) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.weapon = weapon;
    this.type = weapon.type;
    this.level = weapon.level;
    this.direction = direction;
    this.active = true;
    this.lifetime = 180;
    this.bounces = 0;
    
    this.initializeVelocity();
    this.size = this.getSize();
    this.damage = this.getDamage();
  }
  
  initializeVelocity() {
    const speeds = [[8, 8, 8], [6, 7, 8], [5, 5, 5], [7, 7, 7], [6, 6, 6]];
    const speed = speeds[this.type][this.level - 1];
    
    if (this.type === WEAPON_TYPES.PISTOL) {
      this.vx = this.direction * speed;
      this.vy = 0;
    } else if (this.type === WEAPON_TYPES.MACHINE_GUN) {
      this.vx = this.direction * speed;
      this.vy = (Math.random() - 0.5) * 2;
    } else if (this.type === WEAPON_TYPES.FIREBALL) {
      this.vx = this.direction * speed;
      this.vy = -2;
      this.gravity = 0.3;
    } else if (this.type === WEAPON_TYPES.BLADE) {
      const angle = this.direction > 0 ? -0.3 : -2.84;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
    } else if (this.type === WEAPON_TYPES.MISSILE) {
      this.vx = this.direction * speed;
      this.vy = 0;
      this.homing = this.level >= 2;
    }
  }
  
  getSize() {
    const sizes = [[4, 6, 8], [3, 3, 3], [6, 8, 10], [8, 10, 12], [8, 10, 12]];
    return sizes[this.type][this.level - 1];
  }
  
  getDamage() {
    const damages = [[2, 4, 6], [1, 2, 3], [3, 5, 7], [4, 6, 8], [8, 12, 16]];
    return damages[this.type][this.level - 1];
  }
  
  update() {
    this.lifetime--;
    if (this.lifetime <= 0) {
      this.active = false;
      return;
    }
    
    // Apply gravity for fireball
    if (this.type === WEAPON_TYPES.FIREBALL) {
      this.vy += this.gravity;
    }
    
    // Homing for missile
    if (this.type === WEAPON_TYPES.MISSILE && this.homing && gameState.boss) {
      const dx = gameState.boss.x - this.x;
      const dy = gameState.boss.y - this.y;
      const angle = Math.atan2(dy, dx);
      this.vx += Math.cos(angle) * 0.3;
      this.vy += Math.sin(angle) * 0.3;
      const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      if (speed > 8) {
        this.vx = (this.vx / speed) * 8;
        this.vy = (this.vy / speed) * 8;
      }
    }
    
    this.x += this.vx;
    this.y += this.vy;
    
    // Check platform collisions
    for (let platform of gameState.platforms) {
      if (this.p.collideRectRect(this.x - this.size/2, this.y - this.size/2,
                                  this.size, this.size,
                                  platform.x, platform.y, 
                                  platform.width, platform.height)) {
        if (this.type === WEAPON_TYPES.FIREBALL && this.bounces < 3) {
          this.vy *= -0.8;
          this.bounces++;
        } else if (this.type === WEAPON_TYPES.BLADE && this.bounces < 2) {
          this.vx *= -1;
          this.vy *= -0.7;
          this.bounces++;
        } else {
          this.active = false;
        }
        break;
      }
    }
    
    // Check bounds
    if (this.x < -50 || this.x > gameState.levelWidth + 50 || 
        this.y < -50 || this.y > gameState.levelHeight + 50) {
      this.active = false;
    }
  }
  
  draw() {
    const p = this.p;
    const screenX = this.x - gameState.camera.x;
    const screenY = this.y - gameState.camera.y;
    
    p.push();
    const color = WEAPON_DATA[this.type].color;
    p.fill(...color);
    p.noStroke();
    
    if (this.type === WEAPON_TYPES.MISSILE) {
      p.rectMode(p.CENTER);
      p.rect(screenX, screenY, this.size * 1.5, this.size * 0.6);
      // Exhaust trail
      p.fill(255, 150, 0, 150);
      p.circle(screenX - this.direction * this.size, screenY, this.size * 0.5);
    } else if (this.type === WEAPON_TYPES.BLADE) {
      p.push();
      p.translate(screenX, screenY);
      p.rotate(p.frameCount * 0.3);
      p.rectMode(p.CENTER);
      p.rect(0, 0, this.size * 1.5, this.size * 0.4);
      p.rect(0, 0, this.size * 0.4, this.size * 1.5);
      p.pop();
    } else {
      p.circle(screenX, screenY, this.size);
    }
    
    p.pop();
  }
}

export class DamageParticle {
  constructor(p, x, y, vx, vy) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.lifetime = 30;
    this.active = true;
    this.size = 4;
  }
  
  update() {
    this.lifetime--;
    if (this.lifetime <= 0) {
      this.active = false;
      return;
    }
    
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.2;
    this.vx *= 0.95;
  }
  
  draw() {
    const p = this.p;
    const screenX = this.x - gameState.camera.x;
    const screenY = this.y - gameState.camera.y;
    
    const alpha = (this.lifetime / 30) * 255;
    p.push();
    p.fill(255, 100, 100, alpha);
    p.noStroke();
    p.circle(screenX, screenY, this.size);
    p.pop();
  }
}

export class ExpTriangle {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.size = 6;
    this.lifetime = 300;
    this.magnetRange = 60;
    this.collected = false;
  }
  
  update() {
    this.lifetime--;
    
    // Apply gravity
    this.vy += 0.4;
    if (this.vy > 8) this.vy = 8;
    
    // Friction
    this.vx *= 0.95;
    
    this.x += this.vx;
    this.y += this.vy;
    
    // Platform collision
    for (let platform of gameState.platforms) {
      if (this.p.collideRectRect(this.x - this.size/2, this.y - this.size/2,
                                  this.size, this.size,
                                  platform.x, platform.y,
                                  platform.width, platform.height)) {
        this.y = platform.y - this.size/2;
        this.vy = 0;
        this.vx *= 0.8;
      }
    }
    
    // Magnet to player
    if (gameState.player) {
      const dx = gameState.player.x - this.x;
      const dy = gameState.player.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < this.magnetRange) {
        const force = 0.5;
        this.vx += (dx / dist) * force;
        this.vy += (dy / dist) * force;
      }
    }
  }
  
  checkCollision(player) {
    const dist = Math.sqrt((this.x - player.x) ** 2 + (this.y - player.y) ** 2);
    return dist < this.size + player.width/2;
  }
  
  collect(player) {
    player.addEXP(1);
    gameState.score += 10;
    this.collected = true;
  }
  
  draw() {
    const p = this.p;
    const screenX = this.x - gameState.camera.x;
    const screenY = this.y - gameState.camera.y;
    
    p.push();
    p.fill(255, 255, 100);
    p.stroke(200, 200, 50);
    p.strokeWeight(1);
    p.triangle(
      screenX, screenY - this.size,
      screenX - this.size * 0.866, screenY + this.size * 0.5,
      screenX + this.size * 0.866, screenY + this.size * 0.5
    );
    p.pop();
  }
}

export class Enemy {
  constructor(p, x, y, patrolLeft, patrolRight) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = 25;
    this.height = 25;
    this.hp = 8;
    this.maxHP = 8;
    this.defeated = false;
    
    this.vx = 1;
    this.vy = 0;
    this.patrolLeft = patrolLeft;
    this.patrolRight = patrolRight;
    this.direction = 1;
    
    this.shootCooldown = 90;
    this.shootTimer = 90;
    this.attackRange = 250;
    
    this.invulnerable = false;
    this.invulnerableTime = 0;
  }
  
  update() {
    if (this.defeated) return;
    
    // Patrol movement
    this.x += this.vx * this.direction;
    
    if (this.x <= this.patrolLeft) {
      this.x = this.patrolLeft;
      this.direction = 1;
    } else if (this.x >= this.patrolRight) {
      this.x = this.patrolRight;
      this.direction = -1;
    }
    
    // Gravity
    this.vy += 0.5;
    this.y += this.vy;
    
    // Platform collision
    for (let platform of gameState.platforms) {
      if (this.p.collideRectRect(this.x - this.width/2, this.y - this.height/2,
                                  this.width, this.height,
                                  platform.x, platform.y,
                                  platform.width, platform.height)) {
        this.y = platform.y - this.height/2;
        this.vy = 0;
      }
    }
    
    // Shooting logic
    if (gameState.player) {
      const dist = Math.sqrt((this.x - gameState.player.x) ** 2 + (this.y - gameState.player.y) ** 2);
      if (dist < this.attackRange) {
        this.shootTimer--;
        if (this.shootTimer <= 0) {
          this.shoot();
          this.shootTimer = this.shootCooldown;
        }
      }
    }
    
    // Check projectile collisions
    for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
      const proj = gameState.projectiles[i];
      if (proj.fromEnemy) continue;
      
      const dist = Math.sqrt((proj.x - this.x) ** 2 + (proj.y - this.y) ** 2);
      if (dist < this.width/2 + proj.size) {
        if (!this.invulnerable) {
          this.takeDamage(proj.damage);
        }
        proj.active = false;
        gameState.projectiles.splice(i, 1);
      }
    }
    
    // Check player collision
    if (gameState.player && !this.defeated) {
      const dist = Math.sqrt((this.x - gameState.player.x) ** 2 + (this.y - gameState.player.y) ** 2);
      if (dist < this.width/2 + gameState.player.width/2) {
        gameState.player.takeDamage(2);
      }
    }
    
    // Update timers
    if (this.invulnerable) {
      this.invulnerableTime--;
      if (this.invulnerableTime <= 0) {
        this.invulnerable = false;
      }
    }
  }
  
  shoot() {
    if (!gameState.player) return;
    
    const angle = Math.atan2(gameState.player.y - this.y, gameState.player.x - this.x);
    gameState.projectiles.push(new EnemyProjectile(this.p, this.x, this.y, angle, 1, false));
  }
  
  takeDamage(amount) {
    this.hp -= amount;
    this.invulnerable = true;
    this.invulnerableTime = 10;
    
    if (this.hp <= 0) {
      this.defeated = true;
      gameState.score += 100;
      
      // Drop EXP
      for (let i = 0; i < 3; i++) {
        const angle = (Math.PI * 2 * i) / 3;
        const speed = 2;
        const exp = new ExpTriangle(this.p, this.x, this.y);
        exp.vx = Math.cos(angle) * speed;
        exp.vy = Math.sin(angle) * speed - 2;
        gameState.collectibles.push(exp);
      }
    }
  }
  
  draw() {
    if (this.defeated) return;
    
    const p = this.p;
    const screenX = this.x - gameState.camera.x;
    const screenY = this.y - gameState.camera.y;
    
    p.push();
    
    if (this.invulnerable && Math.floor(p.frameCount / 3) % 2 === 0) {
      p.tint(255, 100);
    }
    
    // Body
    p.fill(200, 100, 100);
    p.stroke(150, 50, 50);
    p.strokeWeight(2);
    p.rectMode(p.CENTER);
    p.rect(screenX, screenY, this.width, this.height, 3);
    
    // Eye
    p.fill(255, 50, 50);
    p.noStroke();
    p.circle(screenX + this.direction * 5, screenY - 3, 6);
    
    // Health bar
    if (this.hp < this.maxHP) {
      p.fill(50, 50, 50);
      p.rectMode(p.CORNER);
      p.rect(screenX - 12, screenY - 18, 24, 3);
      p.fill(255, 100, 100);
      p.rect(screenX - 12, screenY - 18, 24 * (this.hp / this.maxHP), 3);
    }
    
    p.pop();
  }
}

export class LifeCapsule {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.size = 16;
    this.collected = false;
    this.hpIncrease = 4;
  }
  
  checkCollision(player) {
    const dist = Math.sqrt((this.x - player.x) ** 2 + (this.y - player.y) ** 2);
    return dist < this.size + player.width/2;
  }
  
  collect(player) {
    player.increaseMaxHP(this.hpIncrease);
    gameState.score += 500;
    this.collected = true;
  }
  
  draw() {
    const p = this.p;
    const screenX = this.x - gameState.camera.x;
    const screenY = this.y - gameState.camera.y;
    
    p.push();
    p.fill(255, 100, 100);
    p.stroke(200, 50, 50);
    p.strokeWeight(2);
    p.circle(screenX, screenY, this.size);
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(12);
    p.text("HP", screenX, screenY);
    p.pop();
  }
}

export class BoosterUpgrade {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.size = 20;
    this.collected = false;
  }
  
  checkCollision(player) {
    const dist = Math.sqrt((this.x - player.x) ** 2 + (this.y - player.y) ** 2);
    return dist < this.size + player.width/2;
  }
  
  collect(player) {
    player.hasBooster = true;
    gameState.score += 1000;
    this.collected = true;
  }
  
  draw() {
    const p = this.p;
    const screenX = this.x - gameState.camera.x;
    const screenY = this.y - gameState.camera.y;
    
    p.push();
    p.fill(100, 255, 100);
    p.stroke(50, 200, 50);
    p.strokeWeight(2);
    p.rectMode(p.CENTER);
    p.rect(screenX, screenY, this.size, this.size, 3);
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(10);
    p.text("JET", screenX, screenY);
    p.pop();
  }
}

export class Platform {
  constructor(p, x, y, width, height, type = "normal") {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = type;
  }
  
  draw() {
    const p = this.p;
    const screenX = this.x - gameState.camera.x;
    const screenY = this.y - gameState.camera.y;
    
    p.push();
    if (this.type === "normal") {
      p.fill(80, 80, 100);
      p.stroke(60, 60, 80);
    } else if (this.type === "metal") {
      p.fill(120, 120, 140);
      p.stroke(100, 100, 120);
    }
    p.strokeWeight(2);
    p.rect(screenX, screenY, this.width, this.height);
    p.pop();
  }
}

export class Spike {
  constructor(p, x, y, width, direction = "up") {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = 15;
    this.direction = direction;
    this.damage = 4;
  }
  
  checkCollision(player) {
    return this.p.collideRectRect(
      player.x - player.width/2, player.y - player.height/2,
      player.width, player.height,
      this.x, this.y, this.width, this.height
    );
  }
  
  draw() {
    const p = this.p;
    const screenX = this.x - gameState.camera.x;
    const screenY = this.y - gameState.camera.y;
    
    p.push();
    p.fill(150, 50, 50);
    p.stroke(100, 30, 30);
    p.strokeWeight(1);
    
    const numSpikes = Math.floor(this.width / 15);
    for (let i = 0; i < numSpikes; i++) {
      const x = screenX + i * 15 + 7.5;
      p.triangle(
        x - 7, screenY + this.height,
        x, screenY,
        x + 7, screenY + this.height
      );
    }
    p.pop();
  }
}

export class SaveStation {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = 40;
    this.height = 60;
    this.active = false;
    this.cooldown = 0;
  }
  
  checkCollision(player) {
    return this.p.collideRectRect(
      player.x - player.width/2, player.y - player.height/2,
      player.width, player.height,
      this.x, this.y, this.width, this.height
    );
  }
  
  activate(player) {
    if (this.cooldown > 0) {
      this.cooldown--;
      return;
    }
    
    player.heal(player.maxHP);
    player.refillAmmo();
    this.active = true;
    this.cooldown = 180;
    gameState.score += 100;
  }
  
  update() {
    if (this.cooldown > 0) this.cooldown--;
  }
  
  draw() {
    const p = this.p;
    const screenX = this.x - gameState.camera.x;
    const screenY = this.y - gameState.camera.y;
    
    p.push();
    p.fill(100, 200, 200);
    p.stroke(50, 150, 150);
    p.strokeWeight(2);
    p.rect(screenX, screenY, this.width, this.height);
    
    // Pulse effect
    const pulse = Math.sin(p.frameCount * 0.1) * 0.3 + 0.7;
    p.fill(150 * pulse, 255 * pulse, 255 * pulse);
    p.noStroke();
    p.circle(screenX + this.width/2, screenY + this.height/2, 15);
    
    p.pop();
  }
}

export class Boss {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = 80;
    this.height = 80;
    this.maxHP = 100;
    this.hp = this.maxHP;
    this.phase = 1;
    this.defeated = false;
    
    this.vx = 0;
    this.vy = 0;
    this.attackTimer = 0;
    this.attackCooldown = 120;
    this.pattern = 0;
    this.invulnerable = false;
    this.invulnerableTime = 0;
    
    this.moveTimer = 0;
    this.targetX = x;
    this.targetY = y;
  }
  
  update() {
    if (this.defeated) return;
    
    this.updateTimers();
    this.updatePhase();
    this.updateMovement();
    this.updateAttack();
    this.checkProjectileCollisions();
  }
  
  updateTimers() {
    if (this.attackTimer > 0) this.attackTimer--;
    if (this.invulnerable) {
      this.invulnerableTime--;
      if (this.invulnerableTime <= 0) {
        this.invulnerable = false;
      }
    }
    this.moveTimer++;
  }
  
  updatePhase() {
    if (this.hp < this.maxHP * 0.66 && this.phase === 1) {
      this.phase = 2;
      this.attackCooldown = 90;
    } else if (this.hp < this.maxHP * 0.33 && this.phase === 2) {
      this.phase = 3;
      this.attackCooldown = 60;
    }
  }
  
  updateMovement() {
    // Move in patterns
    if (this.moveTimer % 180 === 0) {
      const patterns = [
        { x: this.x + 100, y: this.y },
        { x: this.x - 100, y: this.y },
        { x: this.x, y: this.y - 50 },
        { x: this.x, y: this.y + 50 }
      ];
      const pattern = patterns[Math.floor(this.moveTimer / 180) % patterns.length];
      this.targetX = Math.max(this.width/2, Math.min(gameState.levelWidth - this.width/2, pattern.x));
      this.targetY = Math.max(this.height/2, Math.min(400, pattern.y));
    }
    
    // Move towards target
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    this.vx = dx * 0.05;
    this.vy = dy * 0.05;
    
    this.x += this.vx;
    this.y += this.vy;
  }
  
  updateAttack() {
    if (this.attackTimer <= 0) {
      this.attack();
      this.attackTimer = this.attackCooldown;
    }
  }
  
  attack() {
    if (!gameState.player) return;
    
    if (this.phase === 1) {
      // Simple 3-way burst
      for (let i = -1; i <= 1; i++) {
        const angle = Math.atan2(gameState.player.y - this.y, gameState.player.x - this.x) + i * 0.3;
        gameState.projectiles.push(new EnemyProjectile(this.p, this.x, this.y, angle, 2, false));
      }
    } else if (this.phase === 2) {
      // 5-way spread
      for (let i = -2; i <= 2; i++) {
        const angle = Math.atan2(gameState.player.y - this.y, gameState.player.x - this.x) + i * 0.25;
        gameState.projectiles.push(new EnemyProjectile(this.p, this.x, this.y, angle, 3, false));
      }
    } else if (this.phase === 3) {
      // 8-way radial
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 * i) / 8;
        gameState.projectiles.push(new EnemyProjectile(this.p, this.x, this.y, angle, 4, true));
      }
    }
  }
  
  checkProjectileCollisions() {
    for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
      const proj = gameState.projectiles[i];
      if (proj.fromEnemy) continue;
      
      const dist = Math.sqrt((proj.x - this.x) ** 2 + (proj.y - this.y) ** 2);
      if (dist < this.width/2 + proj.size) {
        if (!this.invulnerable) {
          this.takeDamage(proj.damage);
        }
        proj.active = false;
        gameState.projectiles.splice(i, 1);
      }
    }
  }
  
  takeDamage(amount) {
    this.hp -= amount;
    this.invulnerable = true;
    this.invulnerableTime = 10;
    
    if (this.hp <= 0) {
      this.hp = 0;
      this.defeated = true;
      gameState.bossDefeated = true;
      gameState.gamePhase = "GAME_OVER_WIN";
      gameState.score += 5000;
    }
  }
  
  draw() {
    const p = this.p;
    const screenX = this.x - gameState.camera.x;
    const screenY = this.y - gameState.camera.y;
    
    p.push();
    
    if (this.invulnerable && Math.floor(p.frameCount / 3) % 2 === 0) {
      p.tint(255, 100);
    }
    
    // Body
    p.fill(200, 50, 100);
    p.stroke(150, 30, 70);
    p.strokeWeight(3);
    p.rectMode(p.CENTER);
    p.rect(screenX, screenY, this.width, this.height, 10);
    
    // Eyes
    p.fill(255, 50, 50);
    p.noStroke();
    p.circle(screenX - 20, screenY - 15, 12);
    p.circle(screenX + 20, screenY - 15, 12);
    
    // Phase indicators
    p.fill(255);
    for (let i = 0; i < this.phase; i++) {
      p.circle(screenX - 15 + i * 15, screenY + 20, 6);
    }
    
    // Health bar
    p.fill(100, 100, 100);
    p.noStroke();
    p.rectMode(p.CORNER);
    p.rect(screenX - 40, screenY - 50, 80, 6);
    p.fill(255, 50, 50);
    p.rect(screenX - 40, screenY - 50, 80 * (this.hp / this.maxHP), 6);
    
    p.pop();
  }
}

export class EnemyProjectile {
  constructor(p, x, y, angle, damage, homing) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.speed = 4;
    this.vx = Math.cos(angle) * this.speed;
    this.vy = Math.sin(angle) * this.speed;
    this.damage = damage;
    this.homing = homing;
    this.size = 8;
    this.active = true;
    this.lifetime = 300;
    this.fromEnemy = true;
  }
  
  update() {
    this.lifetime--;
    if (this.lifetime <= 0) {
      this.active = false;
      return;
    }
    
    if (this.homing && gameState.player) {
      const dx = gameState.player.x - this.x;
      const dy = gameState.player.y - this.y;
      const angle = Math.atan2(dy, dx);
      this.vx += Math.cos(angle) * 0.2;
      this.vy += Math.sin(angle) * 0.2;
      const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      if (speed > this.speed) {
        this.vx = (this.vx / speed) * this.speed;
        this.vy = (this.vy / speed) * this.speed;
      }
    }
    
    this.x += this.vx;
    this.y += this.vy;
    
    // Check player collision
    if (gameState.player) {
      const dist = Math.sqrt((this.x - gameState.player.x) ** 2 + (this.y - gameState.player.y) ** 2);
      if (dist < this.size + gameState.player.width/2) {
        gameState.player.takeDamage(this.damage);
        this.active = false;
      }
    }
    
    // Check bounds
    if (this.x < -50 || this.x > gameState.levelWidth + 50 || 
        this.y < -50 || this.y > gameState.levelHeight + 50) {
      this.active = false;
    }
  }
  
  draw() {
    const p = this.p;
    const screenX = this.x - gameState.camera.x;
    const screenY = this.y - gameState.camera.y;
    
    p.push();
    p.fill(255, 100, 150);
    p.noStroke();
    p.circle(screenX, screenY, this.size);
    
    if (this.homing) {
      p.stroke(255, 100, 150, 100);
      p.strokeWeight(2);
      p.noFill();
      p.circle(screenX, screenY, this.size * 1.5);
    }
    p.pop();
  }
}

export class WaterZone {
  constructor(p, x, y, width, height) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.waterLevel = y;
  }
  
  update() {
    if (gameState.player && gameState.player.y > this.waterLevel) {
      gameState.player.waterLevel = this.waterLevel;
    }
  }
  
  draw() {
    const p = this.p;
    const screenX = this.x - gameState.camera.x;
    const screenY = this.y - gameState.camera.y;
    
    p.push();
    p.fill(50, 100, 200, 120);
    p.noStroke();
    p.rect(screenX, screenY, this.width, this.height);
    
    // Water surface animation
    p.stroke(100, 150, 255, 200);
    p.strokeWeight(3);
    p.noFill();
    p.beginShape();
    for (let i = 0; i <= this.width; i += 10) {
      const wave = Math.sin((i + p.frameCount * 2) * 0.1) * 4;
      p.vertex(screenX + i, screenY + wave);
    }
    p.endShape();
    
    // Bubble effects
    if (p.frameCount % 20 === 0 && gameState.player && gameState.player.inWater) {
      for (let i = 0; i < 2; i++) {
        p.fill(150, 200, 255, 150);
        p.noStroke();
        const bx = screenX + Math.random() * this.width;
        const by = screenY + this.height - Math.random() * 20;
        p.circle(bx, by, 4 + Math.random() * 4);
      }
    }
    
    p.pop();
  }
}