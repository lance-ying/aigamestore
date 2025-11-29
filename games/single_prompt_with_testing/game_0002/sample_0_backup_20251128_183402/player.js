// player.js - Player character class and logic

import {
  PLAYER_SIZE, PLAYER_SPEED, PLAYER_DASH_SPEED, PLAYER_DASH_DURATION,
  PLAYER_DASH_COOLDOWN, PLAYER_MAX_HEALTH, PLAYER_ATTACK_RANGE,
  PLAYER_ATTACK_DAMAGE, PLAYER_ATTACK_COOLDOWN, PLAYER_INVULN_FRAMES,
  ROOM_WIDTH, ROOM_HEIGHT, WALL_THICKNESS
} from './globals.js';

export class Player {
  constructor(x, y, p) {
    this.x = x;
    this.y = y;
    this.p = p;
    
    this.width = PLAYER_SIZE;
    this.height = PLAYER_SIZE;
    
    this.vx = 0;
    this.vy = 0;
    
    this.health = PLAYER_MAX_HEALTH;
    this.maxHealth = PLAYER_MAX_HEALTH;
    
    // Movement
    this.speed = PLAYER_SPEED;
    this.facing = 0; // 0=right, 1=down, 2=left, 3=up
    
    // Dash
    this.dashing = false;
    this.dashTimer = 0;
    this.dashCooldown = 0;
    this.dashDirX = 0;
    this.dashDirY = 0;
    
    // Attack
    this.attacking = false;
    this.attackTimer = 0;
    this.attackCooldown = 0;
    this.attackDamage = PLAYER_ATTACK_DAMAGE;
    
    // Invulnerability
    this.invulnFrames = 0;
    
    // Animation
    this.animFrame = 0;
  }
  
  update(gameState) {
    this.animFrame++;
    
    // Update timers
    if (this.dashCooldown > 0) this.dashCooldown--;
    if (this.attackCooldown > 0) this.attackCooldown--;
    if (this.invulnFrames > 0) this.invulnFrames--;
    
    // Dashing
    if (this.dashing) {
      this.dashTimer--;
      this.vx = this.dashDirX * PLAYER_DASH_SPEED;
      this.vy = this.dashDirY * PLAYER_DASH_SPEED;
      
      if (this.dashTimer <= 0) {
        this.dashing = false;
        this.vx = 0;
        this.vy = 0;
      }
    }
    
    // Attack animation
    if (this.attacking) {
      this.attackTimer--;
      if (this.attackTimer <= 0) {
        this.attacking = false;
      }
    }
    
    // Apply movement
    this.x += this.vx;
    this.y += this.vy;
    
    // Collision with walls
    this.constrainToRoom();
  }
  
  constrainToRoom() {
    const minX = WALL_THICKNESS + this.width / 2;
    const maxX = ROOM_WIDTH - WALL_THICKNESS - this.width / 2;
    const minY = WALL_THICKNESS + this.height / 2;
    const maxY = ROOM_HEIGHT - WALL_THICKNESS - this.height / 2;
    
    if (this.x < minX) this.x = minX;
    if (this.x > maxX) this.x = maxX;
    if (this.y < minY) this.y = minY;
    if (this.y > maxY) this.y = maxY;
  }
  
  move(dx, dy) {
    if (this.dashing) return;
    
    this.vx = dx * (this.speed + gameState.speedBonus * 0.5);
    this.vy = dy * (this.speed + gameState.speedBonus * 0.5);
    
    // Update facing direction
    if (dx > 0) this.facing = 0;
    else if (dx < 0) this.facing = 2;
    else if (dy > 0) this.facing = 1;
    else if (dy < 0) this.facing = 3;
  }
  
  dash() {
    if (this.dashCooldown > 0 || this.dashing) return;
    
    // Dash in facing direction
    const dirs = [[1, 0], [0, 1], [-1, 0], [0, -1]];
    const dir = dirs[this.facing];
    
    this.dashDirX = dir[0];
    this.dashDirY = dir[1];
    this.dashing = true;
    this.dashTimer = PLAYER_DASH_DURATION + gameState.dashBonus * 2;
    this.dashCooldown = PLAYER_DASH_COOLDOWN - gameState.dashBonus * 3;
    this.invulnFrames = PLAYER_DASH_DURATION + gameState.dashBonus * 2;
  }
  
  attack(gameState) {
    if (this.attackCooldown > 0 || this.attacking) return false;
    
    this.attacking = true;
    this.attackTimer = 15;
    this.attackCooldown = PLAYER_ATTACK_COOLDOWN;
    
    return true;
  }
  
  takeDamage(amount) {
    if (this.invulnFrames > 0) return;
    
    this.health -= amount;
    this.invulnFrames = PLAYER_INVULN_FRAMES;
    
    if (this.health <= 0) {
      this.health = 0;
    }
  }
  
  heal(amount) {
    this.health = Math.min(this.health + amount, this.maxHealth);
  }
  
  getAttackHitbox() {
    const dirs = [[1, 0], [0, 1], [-1, 0], [0, -1]];
    const dir = dirs[this.facing];
    
    return {
      x: this.x + dir[0] * PLAYER_ATTACK_RANGE,
      y: this.y + dir[1] * PLAYER_ATTACK_RANGE,
      radius: 25
    };
  }
  
  render(p) {
    p.push();
    
    // Draw shadow
    p.fill(0, 0, 0, 50);
    p.noStroke();
    p.ellipse(this.x, this.y + 5, this.width * 1.2, this.height * 0.4);
    
    // Invulnerability flash
    const invuln = this.invulnFrames > 0 && Math.floor(this.animFrame / 4) % 2 === 0;
    if (!invuln) {
      // Main body (purple/red gradient)
      p.fill(150, 50, 150);
      p.stroke(100, 30, 100);
      p.strokeWeight(2);
      p.ellipse(this.x, this.y, this.width, this.height);
      
      // Inner glow
      p.fill(200, 100, 200, 150);
      p.noStroke();
      p.ellipse(this.x, this.y, this.width * 0.6, this.height * 0.6);
      
      // Eyes based on facing
      p.fill(255, 255, 100);
      const eyeOffset = 4;
      if (this.facing === 0) { // right
        p.ellipse(this.x + 5, this.y - 2, 4, 4);
        p.ellipse(this.x + 5, this.y + 2, 4, 4);
      } else if (this.facing === 2) { // left
        p.ellipse(this.x - 5, this.y - 2, 4, 4);
        p.ellipse(this.x - 5, this.y + 2, 4, 4);
      } else if (this.facing === 3) { // up
        p.ellipse(this.x - 2, this.y - 5, 4, 4);
        p.ellipse(this.x + 2, this.y - 5, 4, 4);
      } else { // down
        p.ellipse(this.x - 2, this.y + 5, 4, 4);
        p.ellipse(this.x + 2, this.y + 5, 4, 4);
      }
    }
    
    // Attack visual
    if (this.attacking) {
      const hitbox = this.getAttackHitbox();
      const alpha = (this.attackTimer / 15) * 200;
      p.fill(255, 200, 100, alpha);
      p.noStroke();
      p.ellipse(hitbox.x, hitbox.y, hitbox.radius * 2, hitbox.radius * 2);
      
      // Slash effect
      p.stroke(255, 255, 200, alpha);
      p.strokeWeight(3);
      const dirs = [[1, 0], [0, 1], [-1, 0], [0, -1]];
      const dir = dirs[this.facing];
      const angle = Math.atan2(dir[1], dir[0]);
      p.line(
        this.x + Math.cos(angle - 0.5) * 15,
        this.y + Math.sin(angle - 0.5) * 15,
        this.x + Math.cos(angle - 0.5) * 15 + dir[0] * 40,
        this.y + Math.sin(angle - 0.5) * 15 + dir[1] * 40
      );
      p.line(
        this.x + Math.cos(angle + 0.5) * 15,
        this.y + Math.sin(angle + 0.5) * 15,
        this.x + Math.cos(angle + 0.5) * 15 + dir[0] * 40,
        this.y + Math.sin(angle + 0.5) * 15 + dir[1] * 40
      );
    }
    
    // Dash trail
    if (this.dashing) {
      for (let i = 1; i <= 3; i++) {
        const alpha = (i / 3) * 100;
        p.fill(150, 50, 150, alpha);
        p.noStroke();
        p.ellipse(
          this.x - this.vx * i * 0.3,
          this.y - this.vy * i * 0.3,
          this.width * (1 - i * 0.2),
          this.height * (1 - i * 0.2)
        );
      }
    }
    
    p.pop();
  }
}