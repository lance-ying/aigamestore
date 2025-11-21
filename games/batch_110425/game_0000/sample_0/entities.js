// entities.js - Game entity classes

import { gameState, GRAVITY, PLAYER_SPEED, PLAYER_JUMP_FORCE, MAX_HEALTH, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Player {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.w = 30;
    this.h = 40;
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
    this.health = MAX_HEALTH;
    this.weapon = "fist";
    this.hasShield = false;
    this.attackCooldown = 0;
    this.invulnerable = 0;
    this.facingRight = true;
    this.jumpHoldFrames = 0;
    this.isAttacking = false;
    this.attackFrame = 0;
  }

  update() {
    // Handle horizontal movement
    if (gameState.keys[37]) { // Left
      this.vx = -PLAYER_SPEED;
      this.facingRight = false;
    } else if (gameState.keys[39]) { // Right
      this.vx = PLAYER_SPEED;
      this.facingRight = true;
    } else {
      this.vx *= 0.8;
    }

    // Handle jumping with variable height
    if (gameState.keys[38] && this.onGround) { // Up
      this.vy = PLAYER_JUMP_FORCE;
      this.onGround = false;
      this.jumpHoldFrames = 0;
    }
    
    // Variable jump height
    if (gameState.keys[38] && this.vy < 0 && this.jumpHoldFrames < 12) {
      this.vy += -0.4;
      this.jumpHoldFrames++;
    }

    // Apply gravity
    if (!this.onGround) {
      this.vy += GRAVITY;
    }

    // Update position
    this.x += this.vx;
    this.y += this.vy;

    // Check platform collisions
    this.onGround = false;
    for (let platform of gameState.platforms) {
      if (this.checkPlatformCollision(platform)) {
        if (this.vy > 0 && this.y + this.h - this.vy <= platform.y) {
          this.y = platform.y - this.h;
          this.vy = 0;
          this.onGround = true;
          this.jumpHoldFrames = 100;
        }
      }
    }

    // Boundary check
    if (this.x < 0) this.x = 0;
    if (this.x > gameState.levelWidth - this.w) this.x = gameState.levelWidth - this.w;

    // Fall death
    if (this.y > CANVAS_HEIGHT + 50) {
      this.health = 0;
    }

    // Update cooldowns
    if (this.attackCooldown > 0) this.attackCooldown--;
    if (this.invulnerable > 0) this.invulnerable--;
    if (this.isAttacking) {
      this.attackFrame++;
      if (this.attackFrame > 10) {
        this.isAttacking = false;
        this.attackFrame = 0;
      }
    }

    // Check hazard collisions
    for (let hazard of gameState.hazards) {
      if (this.checkHazardCollision(hazard)) {
        this.takeDamage(1);
      }
    }

    // Check item collisions
    for (let i = gameState.items.length - 1; i >= 0; i--) {
      let item = gameState.items[i];
      if (this.checkItemCollision(item)) {
        this.collectItem(item);
        gameState.items.splice(i, 1);
        gameState.score += 100;
      }
    }

    // Check exit portal
    if (gameState.exitPortal && this.checkPortalCollision(gameState.exitPortal)) {
      gameState.levelComplete = true;
    }
  }

  checkPlatformCollision(platform) {
    return this.p.collideRectRect(this.x, this.y, this.w, this.h, platform.x, platform.y, platform.w, platform.h);
  }

  checkHazardCollision(hazard) {
    if (this.invulnerable > 0) return false;
    return this.p.collideRectRect(this.x, this.y, this.w, this.h, hazard.x, hazard.y, hazard.w, hazard.h);
  }

  checkItemCollision(item) {
    return this.p.collideRectCircle(this.x, this.y, this.w, this.h, item.x, item.y, 30);
  }

  checkPortalCollision(portal) {
    return this.p.collideRectCircle(this.x, this.y, this.w, this.h, portal.x, portal.y, 60);
  }

  attack() {
    if (this.attackCooldown > 0) return;
    
    this.isAttacking = true;
    this.attackFrame = 0;
    this.attackCooldown = 20;

    let attackX = this.facingRight ? this.x + this.w : this.x - 40;
    let attackY = this.y;
    let attackW = 40;
    let attackH = this.h;

    // Check enemy hits
    for (let enemy of gameState.enemies) {
      if (enemy.active && this.p.collideRectRect(attackX, attackY, attackW, attackH, enemy.x, enemy.y, enemy.w, enemy.h)) {
        let damage = this.weapon === "sword" ? 2 : 1;
        enemy.takeDamage(damage);
        gameState.score += 50;
        
        // Create hit particles
        for (let i = 0; i < 5; i++) {
          gameState.particles.push(new Particle(this.p, enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, "hit"));
        }
      }
    }
  }

  useShield() {
    if (this.hasShield && this.invulnerable === 0) {
      this.invulnerable = 120;
    }
  }

  takeDamage(amount) {
    if (this.invulnerable > 0) return;
    
    this.health -= amount;
    this.invulnerable = 60;
    
    // Create damage particles
    for (let i = 0; i < 3; i++) {
      gameState.particles.push(new Particle(this.p, this.x + this.w / 2, this.y + this.h / 2, "damage"));
    }
    
    if (this.health <= 0) {
      this.health = 0;
    }
  }

  collectItem(item) {
    if (item.type === "sword") {
      this.weapon = "sword";
    } else if (item.type === "shield") {
      this.hasShield = true;
    } else if (item.type === "health") {
      this.health = Math.min(this.health + 1, MAX_HEALTH);
    }
  }

  render(cameraX) {
    let screenX = this.x - cameraX;
    
    this.p.push();
    
    // Invulnerability flash
    if (this.invulnerable > 0 && this.p.frameCount % 4 < 2) {
      this.p.tint(255, 100, 100);
    }
    
    // Draw player body
    this.p.fill(200, 150, 100);
    this.p.stroke(150, 100, 50);
    this.p.strokeWeight(2);
    this.p.rect(screenX, this.y, this.w, this.h);
    
    // Draw helmet
    this.p.fill(180, 180, 200);
    this.p.arc(screenX + this.w / 2, this.y + 8, 25, 20, this.p.PI, 0);
    
    // Draw horns
    this.p.fill(220, 200, 150);
    this.p.noStroke();
    if (this.facingRight) {
      this.p.triangle(screenX + this.w / 2 - 10, this.y + 5, screenX + this.w / 2 - 15, this.y - 5, screenX + this.w / 2 - 8, this.y);
      this.p.triangle(screenX + this.w / 2 + 10, this.y + 5, screenX + this.w / 2 + 15, this.y - 5, screenX + this.w / 2 + 8, this.y);
    } else {
      this.p.triangle(screenX + this.w / 2 - 10, this.y + 5, screenX + this.w / 2 - 15, this.y - 5, screenX + this.w / 2 - 8, this.y);
      this.p.triangle(screenX + this.w / 2 + 10, this.y + 5, screenX + this.w / 2 + 15, this.y - 5, screenX + this.w / 2 + 8, this.y);
    }
    
    // Draw weapon indicator
    if (this.weapon === "sword") {
      this.p.stroke(150, 150, 180);
      this.p.strokeWeight(3);
      let weaponX = this.facingRight ? screenX + this.w : screenX;
      this.p.line(weaponX, this.y + this.h / 2, weaponX + (this.facingRight ? 15 : -15), this.y + this.h / 2 - 10);
    }
    
    // Draw shield if equipped
    if (this.hasShield && this.invulnerable > 60) {
      this.p.fill(100, 150, 200, 150);
      this.p.noStroke();
      this.p.ellipse(screenX + this.w / 2, this.y + this.h / 2, 60, 60);
    }
    
    // Draw attack animation
    if (this.isAttacking) {
      this.p.fill(255, 200, 100, 150);
      this.p.noStroke();
      let attackX = this.facingRight ? screenX + this.w : screenX - 40;
      this.p.rect(attackX, this.y, 40, this.h);
    }
    
    this.p.pop();
  }
}

export class Enemy {
  constructor(p, x, y, type) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.type = type;
    this.w = type === "troll" ? 50 : 35;
    this.h = type === "troll" ? 50 : 40;
    this.health = type === "troll" ? 3 : 2;
    this.vx = type === "troll" ? 0.5 : 1;
    this.vy = 0;
    this.onGround = false;
    this.direction = 1;
    this.active = true;
    this.patrolLeft = x - 100;
    this.patrolRight = x + 100;
    this.attackCooldown = 0;
  }

  update() {
    if (!this.active) return;

    // Simple patrol AI
    this.x += this.vx * this.direction;
    
    if (this.x < this.patrolLeft || this.x > this.patrolRight) {
      this.direction *= -1;
    }

    // Apply gravity
    this.vy += GRAVITY;
    this.y += this.vy;

    // Check platform collisions
    this.onGround = false;
    for (let platform of gameState.platforms) {
      if (this.p.collideRectRect(this.x, this.y, this.w, this.h, platform.x, platform.y, platform.w, platform.h)) {
        if (this.vy > 0) {
          this.y = platform.y - this.h;
          this.vy = 0;
          this.onGround = true;
        }
      }
    }

    // Check collision with player
    if (gameState.player && this.p.collideRectRect(this.x, this.y, this.w, this.h, gameState.player.x, gameState.player.y, gameState.player.w, gameState.player.h)) {
      if (this.attackCooldown === 0) {
        gameState.player.takeDamage(1);
        this.attackCooldown = 60;
      }
    }

    if (this.attackCooldown > 0) this.attackCooldown--;
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.active = false;
    }
  }

  render(cameraX) {
    if (!this.active) return;

    let screenX = this.x - cameraX;
    
    this.p.push();
    
    if (this.type === "troll") {
      this.p.fill(100, 150, 100);
      this.p.stroke(70, 100, 70);
    } else {
      this.p.fill(150, 100, 80);
      this.p.stroke(100, 70, 50);
    }
    
    this.p.strokeWeight(2);
    this.p.rect(screenX, this.y, this.w, this.h);
    
    // Draw eyes
    this.p.fill(255, 0, 0);
    this.p.noStroke();
    this.p.ellipse(screenX + this.w * 0.3, this.y + this.h * 0.3, 6, 6);
    this.p.ellipse(screenX + this.w * 0.7, this.y + this.h * 0.3, 6, 6);
    
    // Health bar
    this.p.fill(255, 0, 0);
    this.p.rect(screenX, this.y - 10, this.w, 4);
    this.p.fill(0, 255, 0);
    let healthWidth = this.w * (this.health / (this.type === "troll" ? 3 : 2));
    this.p.rect(screenX, this.y - 10, healthWidth, 4);
    
    this.p.pop();
  }
}

export class Particle {
  constructor(p, x, y, type) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.vx = this.p.random(-3, 3);
    this.vy = this.p.random(-5, -1);
    this.life = 30;
    this.type = type;
    this.size = this.p.random(3, 8);
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.3;
    this.life--;
  }

  render(cameraX) {
    if (this.life <= 0) return;
    
    let screenX = this.x - cameraX;
    this.p.push();
    this.p.noStroke();
    
    if (this.type === "hit") {
      this.p.fill(255, 200, 0, this.life * 8);
    } else if (this.type === "damage") {
      this.p.fill(255, 0, 0, this.life * 8);
    }
    
    this.p.ellipse(screenX, this.y, this.size, this.size);
    this.p.pop();
  }
}