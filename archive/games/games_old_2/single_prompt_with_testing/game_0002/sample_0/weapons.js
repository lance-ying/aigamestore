// weapons.js - Weapon and projectile systems

import { GRAVITY, CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';

export class Projectile {
  constructor(p, x, y, vx, vy, weaponType) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.weaponType = weaponType;
    this.active = true;
    this.radius = 4;
    this.timer = 0;
  }
  
  update(terrain) {
    if (!this.active) return false;
    
    this.timer++;
    
    // Apply gravity
    this.vy += GRAVITY * 0.5;
    
    // Update position
    this.x += this.vx;
    this.y += this.vy;
    
    // Check terrain collision
    const groundHeight = terrain.getHeightAt(this.x);
    if (this.y >= groundHeight) {
      this.explode();
      return true;
    }
    
    // Out of bounds
    if (this.x < 0 || this.x > CANVAS_WIDTH || this.y > CANVAS_HEIGHT) {
      this.active = false;
      return true;
    }
    
    // Grenade timer
    if (this.weaponType === "GRENADE" && this.timer > 120) {
      this.explode();
      return true;
    }
    
    return false;
  }
  
  explode() {
    this.active = false;
    
    // Create explosion based on weapon type
    let radius, damage;
    switch (this.weaponType) {
      case "BAZOOKA":
        radius = 40;
        damage = 50;
        break;
      case "GRENADE":
        radius = 35;
        damage = 35;
        break;
      case "SHOTGUN":
        radius = 15;
        damage = 20;
        break;
      default:
        radius = 30;
        damage = 30;
    }
    
    gameState.explosions.push(new Explosion(this.p, this.x, this.y, radius));
    
    // Damage terrain
    gameState.terrain.explode(this.x, this.y, radius);
    
    // Damage worms
    this.damageWorms(radius, damage);
    
    // Create particles
    this.createParticles();
  }
  
  damageWorms(radius, baseDamage) {
    const allWorms = [...gameState.playerWorms, ...gameState.enemyWorms];
    
    for (const worm of allWorms) {
      if (worm.isDead) continue;
      
      const dist = Math.sqrt(
        Math.pow(worm.x - this.x, 2) + 
        Math.pow(worm.y - this.y, 2)
      );
      
      if (dist < radius + worm.width / 2) {
        const damageMultiplier = 1 - (dist / (radius + worm.width / 2));
        const damage = Math.floor(baseDamage * damageMultiplier);
        worm.takeDamage(damage);
        
        // Apply knockback
        const angle = Math.atan2(worm.y - this.y, worm.x - this.x);
        const force = damageMultiplier * 8;
        worm.vx += Math.cos(angle) * force;
        worm.vy += Math.sin(angle) * force - 2;
      }
    }
  }
  
  createParticles() {
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const speed = 2 + Math.random() * 3;
      gameState.particles.push(new Particle(
        this.p,
        this.x,
        this.y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed
      ));
    }
  }
  
  render(p) {
    if (!this.active) return;
    
    p.push();
    p.noStroke();
    
    switch (this.weaponType) {
      case "BAZOOKA":
        p.fill(60, 60, 60);
        p.ellipse(this.x, this.y, 8, 8);
        p.fill(200, 50, 50);
        p.ellipse(this.x - 2, this.y, 4, 4);
        break;
      case "GRENADE":
        p.fill(100, 100, 100);
        p.ellipse(this.x, this.y, 7, 7);
        p.fill(200, 200, 50);
        p.rect(this.x - 1, this.y - 5, 2, 3);
        break;
      case "SHOTGUN":
        p.fill(255, 200, 50);
        p.ellipse(this.x, this.y, 6, 6);
        break;
    }
    
    p.pop();
  }
}

export class Explosion {
  constructor(p, x, y, radius) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.maxRadius = radius;
    this.timer = 0;
    this.maxTimer = 20;
  }
  
  update() {
    this.timer++;
    const progress = this.timer / this.maxTimer;
    this.radius = this.maxRadius * (1 + progress * 0.5);
    return this.timer >= this.maxTimer;
  }
  
  render(p) {
    p.push();
    p.noStroke();
    
    const alpha = 255 * (1 - this.timer / this.maxTimer);
    
    // Outer glow
    p.fill(255, 150, 0, alpha * 0.3);
    p.ellipse(this.x, this.y, this.radius * 2, this.radius * 2);
    
    // Middle ring
    p.fill(255, 200, 0, alpha * 0.6);
    p.ellipse(this.x, this.y, this.radius * 1.5, this.radius * 1.5);
    
    // Core
    p.fill(255, 255, 150, alpha);
    p.ellipse(this.x, this.y, this.radius, this.radius);
    
    p.pop();
  }
}

export class Particle {
  constructor(p, x, y, vx, vy) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.life = 30 + Math.random() * 20;
    this.maxLife = this.life;
    this.size = 2 + Math.random() * 3;
  }
  
  update() {
    this.vy += GRAVITY * 0.3;
    this.x += this.vx;
    this.y += this.vy;
    this.life--;
    return this.life <= 0;
  }
  
  render(p) {
    p.push();
    p.noStroke();
    
    const alpha = 255 * (this.life / this.maxLife);
    p.fill(255, 150, 0, alpha);
    p.ellipse(this.x, this.y, this.size, this.size);
    
    p.pop();
  }
}