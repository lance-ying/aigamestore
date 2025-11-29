// player.js - Player character implementation

import { gameState, COLORS, KEY_LEFT, KEY_RIGHT, KEY_UP, KEY_DOWN, KEY_SPACE, KEY_Z } from './globals.js';
import { isWalkable, getTileAt } from './world.js';
import { addCameraShake } from './utils.js';
import { createParticleBurst } from './particles.js';
import { EnergySlash } from './projectiles.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 20;
    this.height = 20;
    this.radius = 10;
    
    // Physics
    this.vx = 0;
    this.vy = 0;
    this.speed = 3;
    this.dashSpeed = 15;
    this.dashDuration = 8;
    this.dashCooldown = 30;
    
    // State
    this.health = 100;
    this.maxHealth = 100;
    this.energy = 100;
    this.maxEnergy = 100;
    this.isDashing = false;
    this.dashTimer = 0;
    this.invulnerable = false;
    this.invulnerableTimer = 0;
    
    // Facing direction
    this.facing = 0; // radians
    this.lastMoveX = 1;
    this.lastMoveY = 0;
    
    // Animation
    this.animFrame = 0;
    this.animSpeed = 0.15;
    this.flashTimer = 0;
    
    // Tracking
    this.lastPosition = { x, y };
    
    gameState.player = this;
    gameState.entities.push(this);
  }
  
  update(p) {
    // Update invulnerability
    if (this.invulnerable) {
      this.invulnerableTimer--;
      if (this.invulnerableTimer <= 0) {
        this.invulnerable = false;
      }
    }
    
    // Update flash effect
    if (this.flashTimer > 0) {
      this.flashTimer--;
    }
    
    // Regenerate energy slowly
    this.energy = Math.min(this.maxEnergy, this.energy + 0.1);
    
    // Handle dashing
    if (this.isDashing) {
      this.dashTimer--;
      if (this.dashTimer <= 0) {
        this.isDashing = false;
      }
    }
    
    // Movement
    let moveX = 0;
    let moveY = 0;
    
    if (gameState.keys[KEY_LEFT]) moveX -= 1;
    if (gameState.keys[KEY_RIGHT]) moveX += 1;
    if (gameState.keys[KEY_UP]) moveY -= 1;
    if (gameState.keys[KEY_DOWN]) moveY += 1;
    
    // Normalize diagonal movement
    if (moveX !== 0 && moveY !== 0) {
      moveX *= 0.707;
      moveY *= 0.707;
    }
    
    // Update facing direction
    if (moveX !== 0 || moveY !== 0) {
      this.lastMoveX = moveX;
      this.lastMoveY = moveY;
      this.facing = Math.atan2(moveY, moveX);
    }
    
    // Apply movement
    const currentSpeed = this.isDashing ? this.dashSpeed : this.speed;
    this.vx = moveX * currentSpeed;
    this.vy = moveY * currentSpeed;
    
    // Check collision before moving
    const nextX = this.x + this.vx;
    const nextY = this.y + this.vy;
    
    if (isWalkable(nextX, this.y)) {
      this.x = nextX;
    }
    if (isWalkable(this.x, nextY)) {
      this.y = nextY;
    }
    
    // Keep in world bounds
    this.x = Math.max(this.radius, Math.min(gameState.worldWidth - this.radius, this.x));
    this.y = Math.max(this.radius, Math.min(gameState.worldHeight - this.radius, this.y));
    
    // Update animation
    if (moveX !== 0 || moveY !== 0) {
      this.animFrame += this.animSpeed;
    }
    
    // Log position changes
    if (Math.abs(this.x - this.lastPosition.x) > 5 || 
        Math.abs(this.y - this.lastPosition.y) > 5) {
      this.logPosition(p);
      this.lastPosition.x = this.x;
      this.lastPosition.y = this.y;
    }
    
    // Update camera
    this.updateCamera();
  }
  
  updateCamera() {
    const targetX = this.x - 300;
    const targetY = this.y - 200;
    
    gameState.cameraX += (targetX - gameState.cameraX) * 0.1;
    gameState.cameraY += (targetY - gameState.cameraY) * 0.1;
    
    // Clamp camera to world bounds
    gameState.cameraX = Math.max(0, Math.min(gameState.worldWidth - 600, gameState.cameraX));
    gameState.cameraY = Math.max(0, Math.min(gameState.worldHeight - 400, gameState.cameraY));
  }
  
  dash() {
    if (this.isDashing || this.energy < 20) return;
    
    const timeSinceLastDash = gameState.frameCount - gameState.lastDashTime;
    if (timeSinceLastDash < this.dashCooldown) return;
    
    this.isDashing = true;
    this.dashTimer = this.dashDuration;
    this.invulnerable = true;
    this.invulnerableTimer = this.dashDuration;
    this.energy -= 20;
    
    gameState.lastDashTime = gameState.frameCount;
    
    // Create dash particles
    createParticleBurst(this.x, this.y, 8, COLORS.playerGlow);
    addCameraShake(2);
  }
  
  attack(p) {
    if (this.energy < 15) return;
    
    const timeSinceLastAttack = gameState.frameCount - gameState.lastAttackTime;
    if (timeSinceLastAttack < 20) return;
    
    this.energy -= 15;
    gameState.lastAttackTime = gameState.frameCount;
    
    // Create energy slash projectile
    const slashX = this.x + Math.cos(this.facing) * 25;
    const slashY = this.y + Math.sin(this.facing) * 25;
    new EnergySlash(slashX, slashY, this.facing, p);
    
    // Visual feedback
    this.flashTimer = 5;
    addCameraShake(3);
  }
  
  takeDamage(amount) {
    if (this.invulnerable) return;
    
    this.health = Math.max(0, this.health - amount);
    this.invulnerable = true;
    this.invulnerableTimer = 30;
    this.flashTimer = 10;
    
    addCameraShake(5);
    createParticleBurst(this.x, this.y, 12, COLORS.health);
    
    if (this.health <= 0) {
      this.die();
    }
  }
  
  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }
  
  restoreEnergy(amount) {
    this.energy = Math.min(this.maxEnergy, this.energy + amount);
  }
  
  die() {
    gameState.gamePhase = "GAME_OVER_LOSE";
    createParticleBurst(this.x, this.y, 30, COLORS.player);
  }
  
  logPosition(p) {
    if (p.logs && p.logs.player_info) {
      p.logs.player_info.push({
        screen_x: this.x - gameState.cameraX,
        screen_y: this.y - gameState.cameraY,
        game_x: this.x,
        game_y: this.y,
        health: this.health,
        energy: this.energy,
        framecount: gameState.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  render(p) {
    const screenX = this.x - gameState.cameraX + gameState.cameraShakeX;
    const screenY = this.y - gameState.cameraY + gameState.cameraShakeY;
    
    p.push();
    p.translate(screenX, screenY);
    
    // Glow effect
    if (!this.invulnerable || gameState.frameCount % 4 < 2) {
      p.fill(...COLORS.playerGlow);
      p.noStroke();
      p.circle(0, 0, this.radius * 3);
    }
    
    // Flash effect
    const flash = this.flashTimer > 0 ? 255 : 0;
    
    // Main body
    p.fill(...COLORS.player);
    if (flash > 0) {
      p.fill(255, 255, 255);
    }
    p.stroke(0);
    p.strokeWeight(2);
    p.circle(0, 0, this.radius * 2);
    
    // Direction indicator
    p.stroke(...COLORS.player);
    p.strokeWeight(3);
    p.line(0, 0, Math.cos(this.facing) * 12, Math.sin(this.facing) * 12);
    
    // Cape effect (animated trail)
    const bobOffset = Math.sin(this.animFrame) * 2;
    p.noStroke();
    p.fill(...COLORS.player.slice(0, 3), 150);
    p.ellipse(
      -Math.cos(this.facing) * 8,
      -Math.sin(this.facing) * 8 + bobOffset,
      12,
      16
    );
    
    p.pop();
  }
}