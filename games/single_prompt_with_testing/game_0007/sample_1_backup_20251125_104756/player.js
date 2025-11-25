// Player (Cuphead) class and logic

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, PHASE_GAME_OVER_LOSE } from './globals.js';
import { clamp } from './utils.js';
import { PlayerProjectile } from './projectiles.js';
import { createDust, createSparkles, createExplosion } from './particles.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 30;
    this.height = 40;
    
    // Physics
    this.vx = 0;
    this.vy = 0;
    this.speed = 5;
    this.onGround = false;
    
    // State
    this.health = 100;
    this.maxHealth = 100;
    this.facing = 1; // 1 = right, -1 = left
    this.isDead = false;
    
    // Abilities
    this.canShoot = true;
    this.canDash = true;
    this.canParry = true;
    this.isDashing = false;
    this.dashDuration = 15;
    this.dashTimer = 0;
    this.dashSpeed = 12;
    
    // Animation
    this.animFrame = 0;
    this.animSpeed = 0.15;
    this.cupRotation = 0;
    
    // Visual effects
    this.hitFlash = 0;
    this.parryEffect = 0;
    
    gameState.player = this;
    gameState.entities.push(this);
  }
  
  update(p) {
    if (this.isDead) return;
    
    // Update timers
    if (gameState.shootCooldown > 0) gameState.shootCooldown--;
    if (gameState.dashCooldown > 0) gameState.dashCooldown--;
    if (gameState.parryCooldown > 0) gameState.parryCooldown--;
    if (gameState.invulnerabilityFrames > 0) gameState.invulnerabilityFrames--;
    if (this.hitFlash > 0) this.hitFlash--;
    if (this.parryEffect > 0) this.parryEffect--;
    
    // Dash logic
    if (this.isDashing) {
      this.dashTimer++;
      if (this.dashTimer >= this.dashDuration) {
        this.isDashing = false;
        this.dashTimer = 0;
      }
      
      // Move during dash
      this.vx = this.dashSpeed * this.facing;
      
      // Invulnerable during dash
      gameState.invulnerabilityFrames = 2;
      
      // Create dust trail
      if (gameState.frameCount % 3 === 0) {
        createDust(this.x, this.y + this.height / 2, 2);
      }
    } else {
      // Normal movement friction
      this.vx *= 0.8;
    }
    
    // Apply gravity
    this.vy += gameState.gravity;
    
    // Update position
    this.x += this.vx;
    this.y += this.vy;
    
    // Ground collision
    const groundY = CANVAS_HEIGHT - 50;
    if (this.y + this.height / 2 >= groundY) {
      this.y = groundY - this.height / 2;
      this.vy = 0;
      this.onGround = true;
      
      // Landing dust
      if (Math.abs(this.vy) > 5) {
        createDust(this.x, this.y + this.height / 2, 5);
      }
    } else {
      this.onGround = false;
    }
    
    // Wall collision
    this.x = clamp(this.x, this.width / 2, CANVAS_WIDTH - this.width / 2);
    
    // Update animation
    if (Math.abs(this.vx) > 0.5) {
      this.animFrame += this.animSpeed;
    }
    
    // Cup rotation for character
    this.cupRotation = Math.sin(this.animFrame) * 0.1;
    
    // Log position
    if (gameState.frameCount % 10 === 0) {
      this.logPosition(p);
    }
  }
  
  moveLeft() {
    if (!this.isDashing) {
      this.vx = -this.speed;
      this.facing = -1;
    }
  }
  
  moveRight() {
    if (!this.isDashing) {
      this.vx = this.speed;
      this.facing = 1;
    }
  }
  
  shoot() {
    if (gameState.shootCooldown <= 0 && !this.isDashing) {
      const offsetX = this.width / 2 * this.facing;
      const direction = this.facing > 0 ? 0 : Math.PI;
      
      const projectile = new PlayerProjectile(
        this.x + offsetX,
        this.y - 5,
        direction
      );
      
      gameState.playerProjectiles.push(projectile);
      gameState.shootCooldown = 10;
      gameState.projectilesShot++;
      
      // Recoil
      this.vx -= this.facing * 1;
    }
  }
  
  dash() {
    if (gameState.dashCooldown <= 0 && !this.isDashing) {
      this.isDashing = true;
      this.dashTimer = 0;
      gameState.dashCooldown = 60;
      gameState.dashesUsed++;
      
      // Create dash effect
      createDust(this.x, this.y, 8);
    }
  }
  
  parry() {
    if (gameState.parryCooldown <= 0) {
      // Check for parryable projectiles
      let parried = false;
      
      for (let i = gameState.bossProjectiles.length - 1; i >= 0; i--) {
        const proj = gameState.bossProjectiles[i];
        
        if (proj.isParryable && proj.checkHit(this)) {
          // Successfully parried!
          proj.active = false;
          gameState.bossProjectiles.splice(i, 1);
          
          gameState.score += 50;
          gameState.successfulParries++;
          parried = true;
          
          // Visual feedback
          createSparkles(proj.x, proj.y, 12);
          this.parryEffect = 20;
          
          // Small upward boost
          this.vy = -8;
          
          // Reset dash cooldown as reward
          gameState.dashCooldown = Math.max(0, gameState.dashCooldown - 30);
        }
      }
      
      if (parried) {
        gameState.parryCooldown = 30;
      } else {
        // Failed parry has longer cooldown
        gameState.parryCooldown = 15;
      }
    }
  }
  
  takeDamage(amount) {
    if (gameState.invulnerabilityFrames > 0 || this.isDead) return;
    
    this.health -= amount;
    this.hitFlash = 10;
    gameState.invulnerabilityFrames = 60;
    
    // Knockback
    this.vy = -5;
    
    // Visual feedback
    createExplosion(this.x, this.y, 10, COLORS.CUP_RED);
    
    if (this.health <= 0) {
      this.health = 0;
      this.die();
    }
  }
  
  die() {
    this.isDead = true;
    gameState.lives--;
    
    // Big explosion
    createExplosion(this.x, this.y, 20, COLORS.CUP_RED);
    
    if (gameState.lives <= 0) {
      gameState.gamePhase = PHASE_GAME_OVER_LOSE;
    } else {
      // Respawn after delay
      setTimeout(() => {
        this.respawn();
      }, 2000);
    }
  }
  
  respawn() {
    this.x = 100;
    this.y = CANVAS_HEIGHT / 2;
    this.vx = 0;
    this.vy = 0;
    this.health = this.maxHealth;
    this.isDead = false;
    this.isDashing = false;
    this.dashTimer = 0;
    gameState.invulnerabilityFrames = 120;
    
    createSparkles(this.x, this.y, 15);
  }
  
  getCollisionRadius() {
    return this.width / 2;
  }
  
  logPosition(p) {
    if (p.logs && p.logs.player_info) {
      p.logs.player_info.push({
        screen_x: this.x,
        screen_y: this.y,
        game_x: this.x,
        game_y: this.y,
        health: this.health,
        framecount: gameState.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  render(p) {
    if (this.isDead) return;
    
    p.push();
    p.translate(this.x, this.y);
    
    // Flip if facing left
    if (this.facing < 0) {
      p.scale(-1, 1);
    }
    
    // Invulnerability flash
    if (gameState.invulnerabilityFrames > 0 && gameState.frameCount % 6 < 3) {
      p.pop();
      return;
    }
    
    // Hit flash
    if (this.hitFlash > 0) {
      p.tint(255, 100, 100);
    }
    
    // Parry effect glow
    if (this.parryEffect > 0) {
      p.fill(...COLORS.PARTICLE_YELLOW, this.parryEffect * 10);
      p.noStroke();
      p.circle(0, 0, this.width * 2);
    }
    
    // Draw Cuphead character
    p.rotate(this.cupRotation);
    
    // Body (cup)
    p.strokeWeight(2);
    p.stroke(...COLORS.CUP_BLACK);
    p.fill(...COLORS.CUP_RED);
    p.beginShape();
    p.vertex(-12, 5);
    p.bezierVertex(-12, 15, -8, 20, 0, 20);
    p.bezierVertex(8, 20, 12, 15, 12, 5);
    p.vertex(12, -5);
    p.bezierVertex(12, -12, 8, -15, 0, -15);
    p.bezierVertex(-8, -15, -12, -12, -12, -5);
    p.endShape(p.CLOSE);
    
    // Cup handle
    p.noFill();
    p.arc(15, 0, 10, 15, -Math.PI / 2, Math.PI / 2);
    
    // Cup rim (white)
    p.fill(...COLORS.CUP_WHITE);
    p.rect(-12, -18, 24, 4);
    
    // Straw
    p.stroke(...COLORS.CUP_BLACK);
    p.strokeWeight(3);
    p.line(-5, -18, -5, -25);
    
    // Bendy part of straw
    p.noFill();
    p.arc(-5, -25, 4, 4, Math.PI, Math.PI * 1.5);
    p.line(-3, -27, 3, -27);
    
    // Face
    p.fill(...COLORS.CUP_WHITE);
    p.noStroke();
    
    // Eyes
    p.ellipse(-5, -5, 6, 8);
    p.ellipse(5, -5, 6, 8);
    
    // Pupils
    p.fill(...COLORS.CUP_BLACK);
    p.circle(-5, -5, 3);
    p.circle(5, -5, 3);
    
    // Nose
    p.fill(...COLORS.CUP_RED);
    p.triangle(-2, 0, 2, 0, 0, 3);
    
    // Smile
    p.noFill();
    p.stroke(...COLORS.CUP_BLACK);
    p.strokeWeight(2);
    p.arc(0, 2, 10, 8, 0, Math.PI);
    
    p.pop();
  }
}