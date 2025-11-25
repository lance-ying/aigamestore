// Projectile classes for player and boss attacks

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './globals.js';
import { Vector2, distance, angleBetween, removeFromArray } from './utils.js';
import { createExplosion, createSparkles } from './particles.js';

// Base projectile class
export class Projectile {
  constructor(x, y, vx, vy, damage, radius, color) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.damage = damage;
    this.radius = radius;
    this.color = color;
    this.active = true;
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    
    // Remove if off screen
    if (this.x < -50 || this.x > CANVAS_WIDTH + 50 ||
        this.y < -50 || this.y > CANVAS_HEIGHT + 50) {
      this.active = false;
    }
  }
  
  render(p) {
    p.push();
    p.fill(...this.color);
    p.noStroke();
    p.circle(this.x, this.y, this.radius * 2);
    p.pop();
  }
  
  checkHit(target) {
    const dist = distance(this.x, this.y, target.x, target.y);
    return dist < (this.radius + target.getCollisionRadius());
  }
}

// Player projectile (peashooter bullet)
export class PlayerProjectile extends Projectile {
  constructor(x, y, direction) {
    const speed = 12;
    const vx = Math.cos(direction) * speed;
    const vy = Math.sin(direction) * speed;
    super(x, y, vx, vy, 10, 6, COLORS.CUP_BLUE);
    
    this.trailParticles = [];
  }
  
  update() {
    super.update();
    
    // Add trail effect
    if (gameState.frameCount % 2 === 0) {
      this.trailParticles.push({
        x: this.x,
        y: this.y,
        alpha: 1.0,
        size: this.radius
      });
    }
    
    // Update trail
    for (let i = this.trailParticles.length - 1; i >= 0; i--) {
      this.trailParticles[i].alpha -= 0.1;
      this.trailParticles[i].size *= 0.9;
      if (this.trailParticles[i].alpha <= 0) {
        this.trailParticles.splice(i, 1);
      }
    }
  }
  
  render(p) {
    // Render trail
    this.trailParticles.forEach(particle => {
      p.push();
      p.noStroke();
      p.fill(...this.color, particle.alpha * 255);
      p.circle(particle.x, particle.y, particle.size * 2);
      p.pop();
    });
    
    // Render projectile
    super.render(p);
  }
}

// Boss projectile base class
export class BossProjectile extends Projectile {
  constructor(x, y, vx, vy, isParryable = false) {
    const damage = 20;
    const radius = 8;
    const color = isParryable ? COLORS.BOSS_PINK : COLORS.BOSS_YELLOW;
    super(x, y, vx, vy, damage, radius, color);
    
    this.isParryable = isParryable;
    this.rotation = 0;
  }
  
  update() {
    super.update();
    this.rotation += 0.1;
  }
  
  render(p) {
    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.rotation);
    
    // Draw with black outline
    p.strokeWeight(2);
    p.stroke(0);
    p.fill(...this.color);
    
    if (this.isParryable) {
      // Pink parryable projectile - star shape
      p.beginShape();
      for (let i = 0; i < 5; i++) {
        const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
        const x = Math.cos(angle) * this.radius;
        const y = Math.sin(angle) * this.radius;
        p.vertex(x, y);
        
        const innerAngle = angle + Math.PI / 5;
        const ix = Math.cos(innerAngle) * this.radius * 0.5;
        const iy = Math.sin(innerAngle) * this.radius * 0.5;
        p.vertex(ix, iy);
      }
      p.endShape(p.CLOSE);
    } else {
      // Yellow projectile - circle
      p.circle(0, 0, this.radius * 2);
    }
    
    p.pop();
  }
}

// Spiral pattern projectile
export class SpiralProjectile extends BossProjectile {
  constructor(x, y, angle, speed, isParryable = false) {
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    super(x, y, vx, vy, isParryable);
    
    this.angularVelocity = 0.05;
  }
  
  update() {
    // Update velocity to create spiral
    const currentAngle = Math.atan2(this.vy, this.vx);
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    const newAngle = currentAngle + this.angularVelocity;
    
    this.vx = Math.cos(newAngle) * speed;
    this.vy = Math.sin(newAngle) * speed;
    
    super.update();
  }
}

// Homing projectile
export class HomingProjectile extends BossProjectile {
  constructor(x, y, targetX, targetY, isParryable = false) {
    const angle = angleBetween(x, y, targetX, targetY);
    const speed = 3;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    super(x, y, vx, vy, isParryable);
    
    this.homingStrength = 0.1;
  }
  
  update() {
    if (gameState.player && !gameState.player.isDead) {
      // Home towards player
      const angle = angleBetween(this.x, this.y, gameState.player.x, gameState.player.y);
      const targetVx = Math.cos(angle) * 4;
      const targetVy = Math.sin(angle) * 4;
      
      this.vx += (targetVx - this.vx) * this.homingStrength;
      this.vy += (targetVy - this.vy) * this.homingStrength;
    }
    
    super.update();
  }
}

// Wave projectile that moves in a sine wave
export class WaveProjectile extends BossProjectile {
  constructor(x, y, direction, isParryable = false) {
    const speed = 4;
    const vx = Math.cos(direction) * speed;
    const vy = Math.sin(direction) * speed;
    super(x, y, vx, vy, isParryable);
    
    this.baseDirection = direction;
    this.waveAmplitude = 50;
    this.waveFrequency = 0.1;
    this.time = 0;
  }
  
  update() {
    this.time++;
    
    // Calculate wave offset
    const waveOffset = Math.sin(this.time * this.waveFrequency) * this.waveAmplitude;
    
    // Perpendicular direction for wave
    const perpAngle = this.baseDirection + Math.PI / 2;
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    
    this.vx = Math.cos(this.baseDirection) * speed;
    this.vy = Math.sin(this.baseDirection) * speed;
    
    super.update();
  }
}

// Update player projectiles
export function updatePlayerProjectiles() {
  for (let i = gameState.playerProjectiles.length - 1; i >= 0; i--) {
    const proj = gameState.playerProjectiles[i];
    proj.update();
    
    // Check collision with boss
    if (gameState.boss && !gameState.boss.isDead && proj.checkHit(gameState.boss)) {
      gameState.boss.takeDamage(proj.damage);
      gameState.damageDealt += proj.damage;
      proj.active = false;
      createExplosion(proj.x, proj.y, 6, COLORS.PARTICLE_YELLOW);
    }
    
    // Remove if inactive
    if (!proj.active) {
      gameState.playerProjectiles.splice(i, 1);
    }
  }
}

// Update boss projectiles
export function updateBossProjectiles() {
  for (let i = gameState.bossProjectiles.length - 1; i >= 0; i--) {
    const proj = gameState.bossProjectiles[i];
    proj.update();
    
    // Check collision with player (if not invulnerable)
    if (gameState.player && !gameState.player.isDead && 
        gameState.invulnerabilityFrames <= 0) {
      if (proj.checkHit(gameState.player)) {
        gameState.player.takeDamage(proj.damage);
        proj.active = false;
        createExplosion(proj.x, proj.y, 8, COLORS.PARTICLE_ORANGE);
      }
    }
    
    // Remove if inactive
    if (!proj.active) {
      gameState.bossProjectiles.splice(i, 1);
    }
  }
}

// Render projectiles
export function renderProjectiles(p) {
  gameState.playerProjectiles.forEach(proj => proj.render(p));
  gameState.bossProjectiles.forEach(proj => proj.render(p));
}