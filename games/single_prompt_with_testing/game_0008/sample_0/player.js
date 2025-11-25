// player.js - Player character class and logic
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GRAVITY, JUMP_FORCE, PLAYER_SPEED, DASH_SPEED, DASH_DURATION } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 20;
    this.height = 30;
    this.vx = 0;
    this.vy = 0;
    this.grounded = false;
    this.health = 100;
    this.maxHealth = 100;
    this.facing = 1; // 1 = right, -1 = left
    this.attacking = false;
    this.attackTimer = 0;
    this.attackCooldown = 15;
    this.dashing = false;
    this.dashTimer = 0;
    this.dashCooldown = 0;
    this.invincible = false;
    this.invincibleTimer = 0;
    this.jumpHeld = false;
  }

  update(p) {
    // Apply gravity
    if (!this.grounded) {
      this.vy += GRAVITY;
    }

    // Cap fall speed
    if (this.vy > 15) this.vy = 15;

    // Update position
    this.x += this.vx;
    this.y += this.vy;

    // Collision with platforms
    this.grounded = false;
    for (let platform of gameState.platforms) {
      if (this.collidesWith(platform)) {
        // Bottom collision
        if (this.vy > 0 && this.y + this.height / 2 <= platform.y + 5) {
          this.y = platform.y - this.height / 2;
          this.vy = 0;
          this.grounded = true;
        }
        // Top collision
        else if (this.vy < 0 && this.y - this.height / 2 >= platform.y + platform.height - 5) {
          this.y = platform.y + platform.height + this.height / 2;
          this.vy = 0;
        }
        // Side collisions
        else if (Math.abs(this.vx) > 0) {
          if (this.x < platform.x + platform.width / 2) {
            this.x = platform.x - platform.width / 2 - this.width / 2;
          } else {
            this.x = platform.x + platform.width / 2 + this.width / 2;
          }
          this.vx = 0;
        }
      }
    }

    // Boundary checking
    if (this.x < this.width / 2) this.x = this.width / 2;
    if (this.x > CANVAS_WIDTH - this.width / 2) this.x = CANVAS_WIDTH - this.width / 2;
    if (this.y > CANVAS_HEIGHT + 50) {
      this.health = 0;
    }

    // Update timers
    if (this.attackTimer > 0) this.attackTimer--;
    if (this.attackTimer === 0) this.attacking = false;

    if (this.dashTimer > 0) {
      this.dashTimer--;
      if (this.dashTimer === 0) {
        this.dashing = false;
        this.vx = 0;
      }
    }

    if (this.dashCooldown > 0) this.dashCooldown--;

    if (this.invincibleTimer > 0) {
      this.invincibleTimer--;
      if (this.invincibleTimer === 0) this.invincible = false;
    }

    // Track highest point
    if (this.y < gameState.highestY) {
      gameState.highestY = this.y;
    }

    // Friction
    if (this.grounded && !this.dashing) {
      this.vx *= 0.8;
      if (Math.abs(this.vx) < 0.1) this.vx = 0;
    }
  }

  collidesWith(obj) {
    return (
      this.x + this.width / 2 > obj.x - obj.width / 2 &&
      this.x - this.width / 2 < obj.x + obj.width / 2 &&
      this.y + this.height / 2 > obj.y &&
      this.y - this.height / 2 < obj.y + obj.height
    );
  }

  move(direction) {
    if (this.dashing) return;
    this.vx = direction * PLAYER_SPEED;
    if (direction !== 0) this.facing = direction;
  }

  jump() {
    if (this.grounded && !this.dashing) {
      this.vy = JUMP_FORCE;
      this.grounded = false;
      this.jumpHeld = true;
    }
  }

  releaseJump() {
    this.jumpHeld = false;
    if (this.vy < -4) {
      this.vy = -4;
    }
  }

  attack(p) {
    if (this.attackTimer === 0 && !this.dashing) {
      this.attacking = true;
      this.attackTimer = this.attackCooldown;
      
      // Check for enemy hits
      for (let enemy of gameState.enemies) {
        if (enemy.alive) {
          let dist = Math.sqrt((this.x - enemy.x) ** 2 + (this.y - enemy.y) ** 2);
          if (dist < 40) {
            enemy.takeDamage(25, this.facing);
            // Create hit particles
            for (let i = 0; i < 5; i++) {
              gameState.particles.push(new HitParticle(p, enemy.x, enemy.y));
            }
          }
        }
      }
    }
  }

  dash() {
    if (gameState.dashUnlocked && this.dashCooldown === 0 && !this.dashing) {
      this.dashing = true;
      this.dashTimer = DASH_DURATION;
      this.dashCooldown = 60;
      this.vx = this.facing * DASH_SPEED;
      this.vy = 0;
      this.invincible = true;
      this.invincibleTimer = DASH_DURATION;
    }
  }

  takeDamage(amount) {
    if (!this.invincible) {
      this.health -= amount;
      this.invincible = true;
      this.invincibleTimer = 60;
      if (this.health < 0) this.health = 0;
    }
  }

  draw(p, cameraY) {
    let screenY = this.y - cameraY;
    
    p.push();
    
    // Flicker when invincible
    if (this.invincible && Math.floor(p.frameCount / 3) % 2 === 0) {
      p.translate(this.x, screenY);
      p.scale(this.facing, 1);
      
      // Draw translucent
      p.fill(200, 200, 255, 150);
      p.noStroke();
      
      // Body
      p.rect(-5, 0, 10, 20);
      // Head
      p.fill(220, 220, 255, 150);
      p.ellipse(0, -12, 14, 16);
      // Horns
      p.fill(255, 200, 200, 150);
      p.triangle(-3, -18, -5, -14, -1, -14);
      p.triangle(3, -18, 5, -14, 1, -14);
      
      p.pop();
      return;
    }
    
    p.translate(this.x, screenY);
    p.scale(this.facing, 1);
    
    // Body (cloak)
    p.fill(200, 200, 255);
    p.noStroke();
    p.rect(-5, 0, 10, 20);
    
    // Head
    p.fill(220, 220, 255);
    p.ellipse(0, -12, 14, 16);
    
    // Horns
    p.fill(255, 100, 100);
    p.triangle(-3, -18, -5, -14, -1, -14);
    p.triangle(3, -18, 5, -14, 1, -14);
    
    // Eyes
    p.fill(50, 50, 100);
    p.ellipse(-3, -12, 3, 3);
    p.ellipse(3, -12, 3, 3);
    
    // Needle (weapon)
    if (this.attacking) {
      p.stroke(200, 200, 220);
      p.strokeWeight(2);
      let attackAngle = this.attackTimer / this.attackCooldown * Math.PI / 2;
      let needleX = 15 * Math.cos(attackAngle);
      let needleY = -5 + 15 * Math.sin(attackAngle);
      p.line(5, -5, needleX, needleY);
      p.noStroke();
      p.fill(220, 220, 240);
      p.triangle(needleX, needleY, needleX - 2, needleY - 2, needleX - 2, needleY + 2);
    } else {
      p.stroke(200, 200, 220);
      p.strokeWeight(2);
      p.line(5, -5, 12, -8);
    }
    
    // Thread/silk trail when dashing
    if (this.dashing) {
      p.noStroke();
      p.fill(200, 220, 255, 100);
      p.ellipse(-this.facing * 15, 0, 10, 20);
      p.ellipse(-this.facing * 25, 0, 8, 15);
    }
    
    p.pop();
  }
}

export class HitParticle {
  constructor(p, x, y) {
    this.x = x;
    this.y = y;
    this.vx = p.random(-3, 3);
    this.vy = p.random(-3, 3);
    this.life = 20;
    this.maxLife = 20;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life--;
  }

  draw(p, cameraY) {
    let alpha = (this.life / this.maxLife) * 255;
    p.fill(255, 200, 150, alpha);
    p.noStroke();
    p.circle(this.x, this.y - cameraY, 4);
  }

  isDead() {
    return this.life <= 0;
  }
}