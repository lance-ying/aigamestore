// player.js - Player class and related functionality

import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';

export class Player {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = 16;
    this.height = 24;
    this.vx = 0;
    this.vy = 0;
    this.maxSpeed = 3;
    this.jumpPower = -8;
    this.gravity = 0.4;
    this.onGround = false;
    this.health = 5;
    this.maxHealth = 5;
    this.soul = 0;
    this.maxSoul = 99;
    this.facing = 1; // 1 = right, -1 = left
    this.attacking = false;
    this.attackTimer = 0;
    this.attackDuration = 15;
    this.dashTimer = 0;
    this.dashDuration = 10;
    this.dashCooldown = 0;
    this.invulnerable = false;
    this.invulnerableTimer = 0;
    this.type = 'player';
    this.animFrame = 0;
    this.animTimer = 0;
  }

  update() {
    this.animTimer++;
    if (this.animTimer % 8 === 0) {
      this.animFrame = (this.animFrame + 1) % 4;
    }

    // Apply gravity
    if (!this.onGround) {
      this.vy += this.gravity;
    }

    // Terminal velocity
    if (this.vy > 10) this.vy = 10;

    // Update timers
    if (this.attackTimer > 0) this.attackTimer--;
    if (this.attackTimer === 0) this.attacking = false;
    
    if (this.dashTimer > 0) {
      this.dashTimer--;
      this.invulnerable = true;
    }
    
    if (this.dashCooldown > 0) this.dashCooldown--;
    
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer--;
      if (this.invulnerableTimer === 0) this.invulnerable = false;
    }

    // Apply velocity
    this.x += this.vx;
    this.y += this.vy;

    // Check ground collision
    this.checkPlatformCollisions();

    // Keep in bounds (left and right)
    if (this.x < 10) this.x = 10;
    if (this.x > CANVAS_WIDTH - 10 - this.width) this.x = CANVAS_WIDTH - 10 - this.width;

    // Prevent falling into void
    if (this.y > CANVAS_HEIGHT + 100) {
      this.takeDamage(1);
      this.respawn();
    }
  }

  checkPlatformCollisions() {
    this.onGround = false;
    
    for (let platform of gameState.platforms) {
      if (platform.room !== gameState.currentRoom) continue;
      
      // Only check collision if moving down
      if (this.vy >= 0) {
        if (this.x + this.width > platform.x && 
            this.x < platform.x + platform.width &&
            this.y + this.height >= platform.y &&
            this.y + this.height <= platform.y + platform.height + this.vy) {
          this.y = platform.y - this.height;
          this.vy = 0;
          this.onGround = true;
        }
      }
      
      // Wall collision
      if (this.y + this.height > platform.y && 
          this.y < platform.y + platform.height) {
        // Right wall
        if (this.vx > 0 && this.x + this.width > platform.x && 
            this.x < platform.x) {
          this.x = platform.x - this.width;
          this.vx = 0;
        }
        // Left wall
        if (this.vx < 0 && this.x < platform.x + platform.width && 
            this.x + this.width > platform.x + platform.width) {
          this.x = platform.x + platform.width;
          this.vx = 0;
        }
      }
    }
  }

  moveLeft() {
    if (this.dashTimer > 0) return;
    this.vx = -this.maxSpeed;
    this.facing = -1;
  }

  moveRight() {
    if (this.dashTimer > 0) return;
    this.vx = this.maxSpeed;
    this.facing = 1;
  }

  stop() {
    if (this.dashTimer > 0) return;
    this.vx = 0;
  }

  jump() {
    if (this.onGround && this.dashTimer === 0) {
      this.vy = this.jumpPower;
      this.onGround = false;
    }
  }

  attack() {
    if (this.attacking || this.dashTimer > 0) return;
    this.attacking = true;
    this.attackTimer = this.attackDuration;
    
    // Create attack hitbox
    const attackX = this.x + (this.facing > 0 ? this.width : -20);
    const attackY = this.y;
    
    // Check enemy collisions
    for (let enemy of gameState.enemies) {
      if (enemy.room !== gameState.currentRoom) continue;
      if (enemy.dead) continue;
      
      const dist = this.p.dist(attackX + 10, attackY + 12, 
                               enemy.x + enemy.width/2, enemy.y + enemy.height/2);
      if (dist < 30) {
        enemy.takeDamage(1);
        this.gainSoul(10);
      }
    }
    
    // Check boss collisions
    for (let boss of gameState.bosses) {
      if (boss.room !== gameState.currentRoom) continue;
      if (boss.dead) continue;
      
      const dist = this.p.dist(attackX + 10, attackY + 12,
                               boss.x + boss.width/2, boss.y + boss.height/2);
      if (dist < 50) {
        boss.takeDamage(1);
        this.gainSoul(5);
      }
    }
  }

  dash() {
    if (!gameState.unlockedAbilities.dash) return;
    if (this.dashCooldown > 0 || this.dashTimer > 0) return;
    
    this.dashTimer = this.dashDuration;
    this.dashCooldown = 60;
    this.vx = this.facing * 10;
    this.vy = 0;
  }

  castSpell() {
    if (!gameState.unlockedAbilities.spell) return;
    if (this.soul < 33) return;
    
    this.soul -= 33;
    
    // Create projectile
    const proj = new Projectile(
      this.p,
      this.x + this.width/2,
      this.y + this.height/2,
      this.facing,
      gameState.currentRoom
    );
    gameState.projectiles.push(proj);
    gameState.entities.push(proj);
  }

  takeDamage(amount) {
    if (this.invulnerable) return;
    
    this.health -= amount;
    this.invulnerable = true;
    this.invulnerableTimer = 60;
    
    if (this.health <= 0) {
      this.health = 0;
      gameState.gamePhase = "GAME_OVER_LOSE";
    }
  }

  gainSoul(amount) {
    this.soul = Math.min(this.maxSoul, this.soul + amount);
  }

  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  respawn() {
    this.x = CANVAS_WIDTH / 2;
    this.y = 100;
    this.vx = 0;
    this.vy = 0;
  }

  render() {
    this.p.push();
    
    // Flicker when invulnerable
    if (this.invulnerable && this.p.frameCount % 6 < 3) {
      this.p.pop();
      return;
    }
    
    this.p.fill(240, 240, 240);
    this.p.noStroke();
    
    // Body
    this.p.ellipse(this.x + this.width/2, this.y + this.height - 8, 14, 16);
    
    // Head/mask
    this.p.fill(255);
    this.p.ellipse(this.x + this.width/2, this.y + 8, 12, 12);
    
    // Horns
    this.p.fill(240, 240, 240);
    this.p.triangle(
      this.x + this.width/2 - 4, this.y + 4,
      this.x + this.width/2 - 6, this.y - 2,
      this.x + this.width/2 - 2, this.y + 2
    );
    this.p.triangle(
      this.x + this.width/2 + 4, this.y + 4,
      this.x + this.width/2 + 6, this.y - 2,
      this.x + this.width/2 + 2, this.y + 2
    );
    
    // Eyes
    this.p.fill(40, 40, 50);
    this.p.ellipse(this.x + this.width/2 - 2, this.y + 8, 2, 3);
    this.p.ellipse(this.x + this.width/2 + 2, this.y + 8, 2, 3);
    
    // Cape
    this.p.fill(200, 200, 210);
    this.p.arc(this.x + this.width/2, this.y + this.height - 8, 16, 18, 0, this.p.PI);
    
    // Nail (sword) when attacking
    if (this.attacking) {
      this.p.stroke(180, 180, 190);
      this.p.strokeWeight(2);
      const nailX = this.x + this.width/2 + this.facing * 12;
      const nailY = this.y + this.height/2;
      this.p.line(nailX, nailY - 8, nailX, nailY + 8);
    }
    
    this.p.pop();
  }
}

export class Projectile {
  constructor(p, x, y, direction, room) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.vx = direction * 6;
    this.vy = 0;
    this.width = 8;
    this.height = 8;
    this.room = room;
    this.dead = false;
    this.lifetime = 120;
    this.type = 'projectile';
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.lifetime--;
    
    if (this.lifetime <= 0 || this.x < -20 || this.x > CANVAS_WIDTH + 20) {
      this.dead = true;
      return;
    }
    
    // Hit enemies
    for (let enemy of gameState.enemies) {
      if (enemy.room !== this.room) continue;
      if (enemy.dead) continue;
      
      const dist = this.p.dist(this.x, this.y, 
                               enemy.x + enemy.width/2, enemy.y + enemy.height/2);
      if (dist < 20) {
        enemy.takeDamage(2);
        this.dead = true;
        gameState.player.gainSoul(3);
      }
    }
    
    // Hit bosses
    for (let boss of gameState.bosses) {
      if (boss.room !== this.room) continue;
      if (boss.dead) continue;
      
      const dist = this.p.dist(this.x, this.y,
                               boss.x + boss.width/2, boss.y + boss.height/2);
      if (dist < 40) {
        boss.takeDamage(2);
        this.dead = true;
        gameState.player.gainSoul(2);
      }
    }
  }

  render() {
    this.p.push();
    this.p.fill(150, 200, 255, 200);
    this.p.noStroke();
    this.p.ellipse(this.x, this.y, 12, 12);
    this.p.fill(200, 230, 255, 150);
    this.p.ellipse(this.x, this.y, 8, 8);
    this.p.pop();
  }
}