// projectile.js - Projectile physics and rendering

import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';
import { isOnScreen } from './utils.js';

export class Projectile {
  constructor(p, x, y, angle, power, weapon, windSpeed, windDirection) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.weapon = weapon;
    this.alive = true;
    this.exploded = false;
    
    // Physics
    const rad = angle * p.PI / 180;
    const velocity = power * 0.15;
    this.vx = p.cos(rad) * velocity;
    this.vy = p.sin(rad) * velocity;
    this.gravity = 0.2;
    this.windSpeed = windSpeed;
    this.windDirection = windDirection;
    
    // Trail
    this.trail = [];
    this.maxTrailLength = 15;
  }

  update() {
    if (!this.alive || this.exploded) return;

    // Store trail
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > this.maxTrailLength) {
      this.trail.shift();
    }

    // Apply physics
    this.vy += this.gravity;
    this.vx += this.windSpeed * this.windDirection * 0.02;
    
    this.x += this.vx;
    this.y += this.vy;

    // Check bounds
    if (!isOnScreen(this.x, this.y, 100)) {
      this.alive = false;
    }

    // Check terrain collision
    if (this.y >= gameState.terrain.getHeight(this.x)) {
      this.explode();
    }

    // Check tank collisions
    this.checkTankCollisions();
  }

  checkTankCollisions() {
    const p = this.p;
    
    // Check player
    if (gameState.player && gameState.player.alive) {
      const dist = p.dist(this.x, this.y, gameState.player.x, gameState.player.y);
      if (dist < 15) {
        this.explode();
      }
    }

    // Check enemies
    for (let enemy of gameState.enemies) {
      if (enemy.alive) {
        const dist = p.dist(this.x, this.y, enemy.x, enemy.y);
        if (dist < 15) {
          this.explode();
        }
      }
    }
  }

  explode() {
    if (this.exploded) return;
    
    this.exploded = true;
    this.alive = false;

    // Create crater
    gameState.terrain.createCrater(this.x, this.y, this.weapon.blastRadius);

    // Camera shake
    gameState.cameraShake = 8;

    // Damage tanks in radius
    this.damageTanksInRadius();

    // Create particles
    this.createExplosionParticles();

    // Spawn cluster bombs if weapon is cluster
    if (this.weapon.name === "CLUSTER") {
      this.spawnClusterBombs();
    }
  }

  damageTanksInRadius() {
    const p = this.p;
    const tanks = [gameState.player, ...gameState.enemies].filter(t => t && t.alive);
    
    for (let tank of tanks) {
      const dist = p.dist(this.x, this.y, tank.x, tank.y);
      if (dist < this.weapon.blastRadius) {
        const damageFactor = 1 - (dist / this.weapon.blastRadius);
        const damage = Math.floor(this.weapon.damage * damageFactor);
        tank.takeDamage(damage);
        
        // Award points if player damaged an enemy
        if (tank !== gameState.player) {
          gameState.score += damage;
        }
      }
    }
  }

  createExplosionParticles() {
    const p = this.p;
    const particleCount = 30;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = p.random(0, p.TWO_PI);
      const speed = p.random(2, 6);
      const particle = {
        x: this.x,
        y: this.y,
        vx: p.cos(angle) * speed,
        vy: p.sin(angle) * speed,
        life: 1,
        decay: p.random(0.02, 0.04),
        size: p.random(3, 8),
        color: [...this.weapon.color]
      };
      gameState.particles.push(particle);
    }
  }

  spawnClusterBombs() {
    const p = this.p;
    const clusterCount = 5;
    
    for (let i = 0; i < clusterCount; i++) {
      const angle = p.random(-90, -30);
      const power = p.random(30, 60);
      const miniWeapon = {
        name: "MINI_CLUSTER",
        damage: 15,
        blastRadius: 15,
        color: [255, 200, 0]
      };
      
      const cluster = new Projectile(
        p, this.x, this.y, angle, power, miniWeapon,
        gameState.windSpeed, gameState.windDirection
      );
      gameState.projectiles.push(cluster);
    }
  }

  draw() {
    const p = this.p;
    
    if (!this.alive) return;

    // Draw trail
    p.noFill();
    p.stroke(...this.weapon.color, 150);
    p.strokeWeight(2);
    p.beginShape();
    for (let point of this.trail) {
      p.vertex(point.x, point.y);
    }
    p.endShape();

    // Draw projectile
    p.fill(...this.weapon.color);
    p.noStroke();
    p.circle(this.x, this.y, 6);
  }
}