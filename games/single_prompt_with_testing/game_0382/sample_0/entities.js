// entities.js - Game entity classes
import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';

export class Player {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = 24;
    this.height = 32;
    this.velocityX = 0;
    this.velocityY = 0;
    this.speed = 3;
    this.jumpPower = -10;
    this.gravity = 0.5;
    this.onGround = false;
    this.health = 100;
    this.maxHealth = 100;
    this.shootCooldown = 0;
    this.dashCooldown = 0;
    this.isDashing = false;
    this.dashTimer = 0;
    this.invulnerable = false;
    this.invulnerableTimer = 0;
    this.facingRight = true;
  }

  update() {
    // Apply gravity
    this.velocityY += this.gravity;
    
    // Apply velocity
    this.x += this.velocityX;
    this.y += this.velocityY;
    
    // Check platform collisions
    this.onGround = false;
    for (let platform of gameState.platforms) {
      if (this.checkPlatformCollision(platform)) {
        this.onGround = true;
        this.velocityY = 0;
        this.y = platform.y - this.height;
      }
    }
    
    // World boundaries
    if (this.x < 0) this.x = 0;
    if (this.x > gameState.worldWidth - this.width) {
      this.x = gameState.worldWidth - this.width;
    }
    
    // Fall off world
    if (this.y > CANVAS_HEIGHT + 50) {
      this.health = 0;
    }
    
    // Update cooldowns
    if (this.shootCooldown > 0) this.shootCooldown--;
    if (this.dashCooldown > 0) this.dashCooldown--;
    if (this.dashTimer > 0) {
      this.dashTimer--;
      if (this.dashTimer === 0) this.isDashing = false;
    }
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer--;
      if (this.invulnerableTimer === 0) this.invulnerable = false;
    }
    
    // Friction
    this.velocityX *= 0.8;
  }

  checkPlatformCollision(platform) {
    return this.p.collideRectRect(
      this.x, this.y, this.width, this.height,
      platform.x, platform.y, platform.width, platform.height
    ) && this.velocityY >= 0 && this.y + this.height - this.velocityY <= platform.y;
  }

  moveLeft() {
    if (!this.isDashing) {
      this.velocityX = -this.speed;
      this.facingRight = false;
    }
  }

  moveRight() {
    if (!this.isDashing) {
      this.velocityX = this.speed;
      this.facingRight = true;
    }
  }

  jump() {
    if (this.onGround && !this.isDashing) {
      this.velocityY = this.jumpPower;
      this.onGround = false;
    }
  }

  shoot() {
    if (this.shootCooldown === 0) {
      const direction = this.facingRight ? 1 : -1;
      const projectile = new Projectile(
        this.p,
        this.x + (this.facingRight ? this.width : 0),
        this.y + this.height / 2,
        direction
      );
      gameState.projectiles.push(projectile);
      gameState.entities.push(projectile);
      this.shootCooldown = 20;
    }
  }

  dash() {
    if (gameState.dashUnlocked && this.dashCooldown === 0 && !this.isDashing) {
      this.isDashing = true;
      this.dashTimer = 10;
      this.invulnerable = true;
      this.invulnerableTimer = 10;
      this.velocityX = (this.facingRight ? 1 : -1) * 12;
      this.dashCooldown = 60;
    }
  }

  takeDamage(amount) {
    if (!this.invulnerable) {
      this.health -= amount;
      this.invulnerable = true;
      this.invulnerableTimer = 60;
      if (this.health <= 0) {
        this.health = 0;
      }
    }
  }

  render() {
    this.p.push();
    
    // Flashing when invulnerable
    if (this.invulnerable && this.p.frameCount % 6 < 3) {
      this.p.pop();
      return;
    }
    
    // Body (purple)
    this.p.fill(138, 43, 226);
    this.p.noStroke();
    this.p.rect(this.x, this.y + 8, this.width, this.height - 8, 4);
    
    // Eye holes (white with dogs inside)
    this.p.fill(255);
    this.p.ellipse(this.x + 8, this.y + 4, 10, 10);
    this.p.ellipse(this.x + 16, this.y + 4, 10, 10);
    
    // Eyes
    this.p.fill(0);
    this.p.ellipse(this.x + 8, this.y + 4, 4, 4);
    this.p.ellipse(this.x + 16, this.y + 4, 4, 4);
    
    // Mouth
    this.p.stroke(0);
    this.p.strokeWeight(2);
    this.p.noFill();
    this.p.arc(this.x + 12, this.y + 18, 12, 8, 0, this.p.PI);
    
    // Dash effect
    if (this.isDashing) {
      this.p.fill(138, 43, 226, 100);
      for (let i = 1; i <= 3; i++) {
        this.p.rect(
          this.x - (this.facingRight ? i * 8 : -i * 8),
          this.y + 8,
          this.width,
          this.height - 8,
          4
        );
      }
    }
    
    this.p.pop();
  }
}

export class Enemy {
  constructor(p, x, y, type = "basic") {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = 28;
    this.height = 28;
    this.type = type;
    this.health = type === "basic" ? 30 : type === "flying" ? 20 : 50;
    this.maxHealth = this.health;
    this.velocityX = 0;
    this.velocityY = 0;
    this.speed = type === "flying" ? 1.5 : 1;
    this.gravity = type === "flying" ? 0 : 0.5;
    this.patrolLeft = x - 100;
    this.patrolRight = x + 100;
    this.direction = 1;
    this.shootCooldown = 0;
    this.active = true;
    this.onGround = false;
  }

  update() {
    if (!this.active) return;
    
    const player = gameState.player;
    
    if (this.type === "flying") {
      // Flying enemy behavior - follows player
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const dist = this.p.sqrt(dx * dx + dy * dy);
      
      if (dist > 10) {
        this.velocityX = (dx / dist) * this.speed;
        this.velocityY = (dy / dist) * this.speed;
      }
      
      // Shoot at player occasionally
      if (this.shootCooldown === 0 && dist < 200) {
        this.shoot(dx, dy, dist);
        this.shootCooldown = 90;
      }
    } else {
      // Ground enemy behavior - patrol
      this.velocityY += this.gravity;
      
      // Check platform collisions
      this.onGround = false;
      for (let platform of gameState.platforms) {
        if (this.checkPlatformCollision(platform)) {
          this.onGround = true;
          this.velocityY = 0;
          this.y = platform.y - this.height;
        }
      }
      
      // Patrol movement
      if (this.onGround) {
        this.velocityX = this.direction * this.speed;
        
        if (this.x < this.patrolLeft) {
          this.direction = 1;
        } else if (this.x > this.patrolRight) {
          this.direction = -1;
        }
      }
    }
    
    this.x += this.velocityX;
    this.y += this.velocityY;
    
    if (this.shootCooldown > 0) this.shootCooldown--;
    
    // Remove if dead
    if (this.health <= 0) {
      this.active = false;
      gameState.score += 100;
      gameState.enemiesDefeated++;
    }
  }

  checkPlatformCollision(platform) {
    return this.p.collideRectRect(
      this.x, this.y, this.width, this.height,
      platform.x, platform.y, platform.width, platform.height
    ) && this.velocityY >= 0;
  }

  shoot(dx, dy, dist) {
    const projectile = new EnemyProjectile(
      this.p,
      this.x + this.width / 2,
      this.y + this.height / 2,
      dx / dist,
      dy / dist
    );
    gameState.projectiles.push(projectile);
    gameState.entities.push(projectile);
  }

  takeDamage(amount) {
    this.health -= amount;
  }

  render() {
    if (!this.active) return;
    
    this.p.push();
    
    // Body color based on type
    if (this.type === "flying") {
      this.p.fill(255, 100, 100);
    } else {
      this.p.fill(200, 50, 50);
    }
    
    this.p.noStroke();
    this.p.rect(this.x, this.y, this.width, this.height, 4);
    
    // Eyes (menacing)
    this.p.fill(255, 0, 0);
    this.p.ellipse(this.x + 8, this.y + 10, 8, 8);
    this.p.ellipse(this.x + 20, this.y + 10, 8, 8);
    
    // Health bar
    const healthBarWidth = this.width;
    const healthPercent = this.health / this.maxHealth;
    this.p.fill(255, 0, 0);
    this.p.rect(this.x, this.y - 5, healthBarWidth, 3);
    this.p.fill(0, 255, 0);
    this.p.rect(this.x, this.y - 5, healthBarWidth * healthPercent, 3);
    
    this.p.pop();
  }
}

export class Boss {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = 80;
    this.height = 100;
    this.health = 300;
    this.maxHealth = 300;
    this.velocityX = 0;
    this.velocityY = 0;
    this.phase = 1;
    this.shootCooldown = 0;
    this.moveTimer = 0;
    this.active = true;
    this.attackPattern = 0;
  }

  update() {
    if (!this.active) return;
    
    const player = gameState.player;
    
    // Update phase based on health
    if (this.health < this.maxHealth * 0.66 && this.phase === 1) {
      this.phase = 2;
    } else if (this.health < this.maxHealth * 0.33 && this.phase === 2) {
      this.phase = 3;
    }
    
    // Movement pattern
    this.moveTimer++;
    if (this.moveTimer > 120) {
      this.moveTimer = 0;
      this.attackPattern = (this.attackPattern + 1) % 3;
    }
    
    // Follow player horizontally
    const dx = player.x - this.x;
    if (this.p.abs(dx) > 20) {
      this.velocityX = (dx > 0 ? 1 : -1) * 2;
    } else {
      this.velocityX = 0;
    }
    
    // Hovering motion
    this.velocityY = this.p.sin(this.p.frameCount * 0.05) * 0.5;
    
    this.x += this.velocityX;
    this.y += this.velocityY;
    
    // Keep in bounds
    if (this.x < gameState.worldWidth - CANVAS_WIDTH) {
      this.x = gameState.worldWidth - CANVAS_WIDTH;
    }
    if (this.x > gameState.worldWidth - 100) {
      this.x = gameState.worldWidth - 100;
    }
    if (this.y < 50) this.y = 50;
    if (this.y > 150) this.y = 150;
    
    // Attack patterns
    if (this.shootCooldown === 0) {
      if (this.phase === 1) {
        this.shootSingle();
        this.shootCooldown = 60;
      } else if (this.phase === 2) {
        this.shootTriple();
        this.shootCooldown = 45;
      } else {
        this.shootSpiral();
        this.shootCooldown = 30;
      }
    }
    
    if (this.shootCooldown > 0) this.shootCooldown--;
    
    // Check if defeated
    if (this.health <= 0) {
      this.active = false;
      gameState.score += 1000;
    }
  }

  shootSingle() {
    const player = gameState.player;
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = this.p.sqrt(dx * dx + dy * dy);
    
    const projectile = new EnemyProjectile(
      this.p,
      this.x + this.width / 2,
      this.y + this.height / 2,
      dx / dist,
      dy / dist
    );
    gameState.projectiles.push(projectile);
    gameState.entities.push(projectile);
  }

  shootTriple() {
    const player = gameState.player;
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = this.p.sqrt(dx * dx + dy * dy);
    
    for (let i = -1; i <= 1; i++) {
      const angle = this.p.atan2(dy, dx) + i * 0.3;
      const projectile = new EnemyProjectile(
        this.p,
        this.x + this.width / 2,
        this.y + this.height / 2,
        this.p.cos(angle),
        this.p.sin(angle)
      );
      gameState.projectiles.push(projectile);
      gameState.entities.push(projectile);
    }
  }

  shootSpiral() {
    const numProjectiles = 8;
    for (let i = 0; i < numProjectiles; i++) {
      const angle = (this.p.TWO_PI / numProjectiles) * i + this.p.frameCount * 0.1;
      const projectile = new EnemyProjectile(
        this.p,
        this.x + this.width / 2,
        this.y + this.height / 2,
        this.p.cos(angle),
        this.p.sin(angle)
      );
      gameState.projectiles.push(projectile);
      gameState.entities.push(projectile);
    }
  }

  takeDamage(amount) {
    this.health -= amount;
  }

  render() {
    if (!this.active) return;
    
    this.p.push();
    
    // Main body (Glorkon - large and menacing)
    const pulseSize = this.p.sin(this.p.frameCount * 0.1) * 5;
    this.p.fill(139, 0, 139);
    this.p.noStroke();
    this.p.ellipse(
      this.x + this.width / 2,
      this.y + this.height / 2,
      this.width + pulseSize,
      this.height + pulseSize
    );
    
    // Beak
    this.p.fill(255, 200, 0);
    this.p.triangle(
      this.x + this.width / 2 - 15,
      this.y + this.height / 2,
      this.x + this.width / 2 + 15,
      this.y + this.height / 2,
      this.x + this.width / 2,
      this.y + this.height / 2 + 25
    );
    
    // Eye holes with dogs
    this.p.fill(255);
    this.p.ellipse(this.x + 20, this.y + 30, 25, 25);
    this.p.ellipse(this.x + 60, this.y + 30, 25, 25);
    
    // Dogs in eye holes (small)
    this.p.fill(139, 69, 19);
    this.p.ellipse(this.x + 20, this.y + 30, 15, 15);
    this.p.ellipse(this.x + 60, this.y + 30, 15, 15);
    
    // Evil eyes
    this.p.fill(255, 0, 0);
    this.p.ellipse(this.x + 20, this.y + 30, 8, 8);
    this.p.ellipse(this.x + 60, this.y + 30, 8, 8);
    
    // Health bar (large)
    const healthBarWidth = 100;
    const healthPercent = this.health / this.maxHealth;
    this.p.fill(50);
    this.p.rect(this.x - 10, this.y - 15, healthBarWidth, 8);
    this.p.fill(255, 0, 0);
    this.p.rect(this.x - 10, this.y - 15, healthBarWidth * healthPercent, 8);
    
    // Phase indicator
    this.p.fill(255, 255, 0);
    this.p.textSize(12);
    this.p.textAlign(this.p.CENTER);
    this.p.text(`GLORKON - PHASE ${this.phase}`, this.x + this.width / 2, this.y - 25);
    
    this.p.pop();
  }
}

export class Projectile {
  constructor(p, x, y, direction) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = 8;
    this.height = 8;
    this.velocityX = direction * 7;
    this.velocityY = 0;
    this.active = true;
    this.damage = 10;
    this.isPlayerProjectile = true;
  }

  update() {
    this.x += this.velocityX;
    
    // Remove if out of bounds
    if (this.x < 0 || this.x > gameState.worldWidth || this.y < 0 || this.y > CANVAS_HEIGHT) {
      this.active = false;
    }
  }

  render() {
    if (!this.active) return;
    
    this.p.push();
    this.p.fill(0, 255, 255);
    this.p.noStroke();
    this.p.ellipse(this.x, this.y, this.width, this.height);
    
    // Trail effect
    this.p.fill(0, 255, 255, 100);
    this.p.ellipse(this.x - this.velocityX * 0.5, this.y, this.width * 0.7, this.height * 0.7);
    this.p.pop();
  }
}

export class EnemyProjectile {
  constructor(p, x, y, dirX, dirY) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = 10;
    this.height = 10;
    this.velocityX = dirX * 4;
    this.velocityY = dirY * 4;
    this.active = true;
    this.damage = 15;
    this.isPlayerProjectile = false;
  }

  update() {
    this.x += this.velocityX;
    this.y += this.velocityY;
    
    // Remove if out of bounds
    if (this.x < 0 || this.x > gameState.worldWidth || this.y < 0 || this.y > CANVAS_HEIGHT) {
      this.active = false;
    }
  }

  render() {
    if (!this.active) return;
    
    this.p.push();
    this.p.fill(255, 0, 0);
    this.p.noStroke();
    this.p.ellipse(this.x, this.y, this.width, this.height);
    this.p.pop();
  }
}

export class PowerGem {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = 16;
    this.height = 16;
    this.active = true;
    this.bobOffset = 0;
  }

  update() {
    this.bobOffset = this.p.sin(this.p.frameCount * 0.1) * 5;
  }

  render() {
    if (!this.active) return;
    
    this.p.push();
    const yPos = this.y + this.bobOffset;
    
    // Glow effect
    this.p.fill(255, 215, 0, 100);
    this.p.noStroke();
    this.p.ellipse(this.x, yPos, this.width * 2, this.height * 2);
    
    // Gem
    this.p.fill(255, 215, 0);
    this.p.beginShape();
    this.p.vertex(this.x, yPos - this.height / 2);
    this.p.vertex(this.x + this.width / 2, yPos);
    this.p.vertex(this.x, yPos + this.height / 2);
    this.p.vertex(this.x - this.width / 2, yPos);
    this.p.endShape(this.p.CLOSE);
    
    // Inner sparkle
    this.p.fill(255, 255, 200);
    this.p.ellipse(this.x, yPos, 6, 6);
    
    this.p.pop();
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

  render() {
    this.p.push();
    
    if (this.type === "normal") {
      this.p.fill(100, 100, 120);
    } else if (this.type === "grass") {
      this.p.fill(34, 139, 34);
    } else if (this.type === "cosmic") {
      this.p.fill(75, 0, 130);
    }
    
    this.p.noStroke();
    this.p.rect(this.x, this.y, this.width, this.height);
    
    // Add texture
    this.p.fill(255, 255, 255, 30);
    this.p.rect(this.x, this.y, this.width, 2);
    
    this.p.pop();
  }
}