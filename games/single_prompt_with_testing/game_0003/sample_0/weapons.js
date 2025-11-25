// weapons.js - Weapon system and projectiles
import { WEAPON_BASE_DAMAGE, WEAPON_BASE_RANGE, WEAPON_BASE_COOLDOWN, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Weapon {
  constructor(type) {
    this.type = type;
    this.level = 1;
    this.cooldown = 0;
    this.cooldownMax = WEAPON_BASE_COOLDOWN;
    
    // Base stats by weapon type
    this.applyTypeStats();
  }
  
  applyTypeStats() {
    switch (this.type) {
      case 'magic_wand':
        this.damage = WEAPON_BASE_DAMAGE;
        this.range = WEAPON_BASE_RANGE;
        this.projectileCount = 1;
        this.piercing = 0;
        this.cooldownMax = 45;
        break;
      case 'holy_water':
        this.damage = WEAPON_BASE_DAMAGE * 0.7;
        this.range = WEAPON_BASE_RANGE * 0.6;
        this.projectileCount = 1;
        this.areaSize = 60;
        this.duration = 180;
        this.cooldownMax = 90;
        break;
      case 'garlic':
        this.damage = WEAPON_BASE_DAMAGE * 0.5;
        this.range = WEAPON_BASE_RANGE * 0.5;
        this.cooldownMax = 30;
        break;
      case 'cross':
        this.damage = WEAPON_BASE_DAMAGE * 1.2;
        this.range = WEAPON_BASE_RANGE * 1.2;
        this.projectileCount = 2;
        this.cooldownMax = 60;
        break;
    }
  }
  
  update() {
    if (this.cooldown > 0) {
      this.cooldown--;
    }
  }
  
  canFire() {
    return this.cooldown <= 0;
  }
  
  fire(p, player, enemies) {
    this.cooldown = this.cooldownMax / player.attackSpeed;
    
    const projectiles = [];
    
    switch (this.type) {
      case 'magic_wand':
        projectiles.push(...this.fireMagicWand(p, player, enemies));
        break;
      case 'holy_water':
        projectiles.push(...this.fireHolyWater(p, player, enemies));
        break;
      case 'garlic':
        // Garlic is passive, no projectiles
        break;
      case 'cross':
        projectiles.push(...this.fireCross(p, player, enemies));
        break;
    }
    
    return projectiles;
  }
  
  fireMagicWand(p, player, enemies) {
    const projectiles = [];
    
    // Find nearest enemy
    let nearestEnemy = null;
    let nearestDist = Infinity;
    
    for (const enemy of enemies) {
      if (enemy.dead) continue;
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestEnemy = enemy;
      }
    }
    
    if (nearestEnemy) {
      const angle = Math.atan2(nearestEnemy.y - player.y, nearestEnemy.x - player.x);
      
      for (let i = 0; i < this.projectileCount; i++) {
        const spreadAngle = angle + (i - (this.projectileCount - 1) / 2) * 0.2;
        projectiles.push(new Projectile(player.x, player.y, spreadAngle, this, player));
      }
    }
    
    return projectiles;
  }
  
  fireHolyWater(p, player, enemies) {
    const projectiles = [];
    
    // Find nearest enemy
    let nearestEnemy = null;
    let nearestDist = Infinity;
    
    for (const enemy of enemies) {
      if (enemy.dead) continue;
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestEnemy = enemy;
      }
    }
    
    if (nearestEnemy) {
      projectiles.push(new HolyWaterProjectile(nearestEnemy.x, nearestEnemy.y, this, player));
    }
    
    return projectiles;
  }
  
  fireCross(p, player, enemies) {
    const projectiles = [];
    const baseAngle = p.frameCount * 0.05;
    
    for (let i = 0; i < this.projectileCount + Math.floor(this.level / 2); i++) {
      const angle = baseAngle + (i * p.TWO_PI / (this.projectileCount + Math.floor(this.level / 2)));
      projectiles.push(new OrbitingProjectile(player.x, player.y, angle, this, player));
    }
    
    return projectiles;
  }
  
  upgrade() {
    this.level++;
    
    // Improve stats based on level
    switch (this.type) {
      case 'magic_wand':
        if (this.level % 2 === 0) this.projectileCount++;
        if (this.level >= 3) this.piercing = Math.floor((this.level - 1) / 2);
        break;
      case 'holy_water':
        this.areaSize += 10;
        this.duration += 30;
        break;
      case 'garlic':
        this.damage *= 1.2;
        this.range *= 1.1;
        break;
      case 'cross':
        if (this.level % 2 === 0) this.projectileCount++;
        break;
    }
  }
}

export class Projectile {
  constructor(x, y, angle, weapon, player) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.speed = 6 * player.projectileSpeed;
    this.damage = weapon.damage * player.damage;
    this.range = weapon.range * player.range;
    this.piercing = weapon.piercing || 0;
    this.piercedEnemies = 0;
    this.distanceTraveled = 0;
    this.dead = false;
    this.size = 8;
  }
  
  update() {
    this.x += Math.cos(this.angle) * this.speed;
    this.y += Math.sin(this.angle) * this.speed;
    this.distanceTraveled += this.speed;
    
    if (this.distanceTraveled > this.range * 10) {
      this.dead = true;
    }
  }
  
  hitEnemy() {
    this.piercedEnemies++;
    if (this.piercedEnemies > this.piercing) {
      this.dead = true;
    }
  }
  
  render(p, camera) {
    if (this.dead) return;
    
    const screenX = this.x - camera.x + CANVAS_WIDTH / 2;
    const screenY = this.y - camera.y + CANVAS_HEIGHT / 2;
    
    p.push();
    p.fill(150, 150, 255);
    p.noStroke();
    p.ellipse(screenX, screenY, this.size, this.size);
    
    // Trail effect
    p.fill(150, 150, 255, 100);
    p.ellipse(screenX - Math.cos(this.angle) * 5, screenY - Math.sin(this.angle) * 5, this.size * 0.6, this.size * 0.6);
    p.pop();
  }
}

export class HolyWaterProjectile {
  constructor(x, y, weapon, player) {
    this.x = x;
    this.y = y;
    this.damage = weapon.damage * player.damage;
    this.areaSize = weapon.areaSize;
    this.duration = weapon.duration;
    this.timer = 0;
    this.dead = false;
    this.damageCooldown = 0;
  }
  
  update() {
    this.timer++;
    if (this.timer >= this.duration) {
      this.dead = true;
    }
    
    if (this.damageCooldown > 0) {
      this.damageCooldown--;
    }
  }
  
  canDamage() {
    return this.damageCooldown <= 0;
  }
  
  dealDamage() {
    this.damageCooldown = 15;
  }
  
  render(p, camera) {
    if (this.dead) return;
    
    const screenX = this.x - camera.x + CANVAS_WIDTH / 2;
    const screenY = this.y - camera.y + CANVAS_HEIGHT / 2;
    
    p.push();
    p.fill(100, 200, 255, 100);
    p.noStroke();
    p.ellipse(screenX, screenY, this.areaSize, this.areaSize);
    
    // Bubbles effect
    const bubbles = 5;
    for (let i = 0; i < bubbles; i++) {
      const angle = (this.timer * 0.1 + i * p.TWO_PI / bubbles);
      const radius = this.areaSize * 0.3;
      const bx = screenX + Math.cos(angle) * radius;
      const by = screenY + Math.sin(angle) * radius;
      p.fill(150, 220, 255, 150);
      p.ellipse(bx, by, 8, 8);
    }
    p.pop();
  }
}

export class OrbitingProjectile {
  constructor(x, y, angle, weapon, player) {
    this.playerRef = player;
    this.angle = angle;
    this.orbitRadius = 50 * player.range;
    this.damage = weapon.damage * player.damage;
    this.dead = false;
    this.size = 15;
    this.rotationSpeed = 0.05;
    this.hitCooldown = {};
  }
  
  update() {
    this.angle += this.rotationSpeed;
    
    // Clean up old cooldowns
    for (const key in this.hitCooldown) {
      this.hitCooldown[key]--;
      if (this.hitCooldown[key] <= 0) {
        delete this.hitCooldown[key];
      }
    }
  }
  
  getPosition() {
    return {
      x: this.playerRef.x + Math.cos(this.angle) * this.orbitRadius,
      y: this.playerRef.y + Math.sin(this.angle) * this.orbitRadius
    };
  }
  
  canHitEnemy(enemyId) {
    return !this.hitCooldown[enemyId];
  }
  
  hitEnemy(enemyId) {
    this.hitCooldown[enemyId] = 30;
  }
  
  render(p, camera) {
    if (this.dead) return;
    
    const pos = this.getPosition();
    const screenX = pos.x - camera.x + CANVAS_WIDTH / 2;
    const screenY = pos.y - camera.y + CANVAS_HEIGHT / 2;
    
    p.push();
    p.fill(255, 215, 0);
    p.stroke(200, 170, 0);
    p.strokeWeight(2);
    
    // Draw cross shape
    p.push();
    p.translate(screenX, screenY);
    p.rotate(this.angle);
    p.rectMode(p.CENTER);
    p.rect(0, 0, this.size, this.size * 0.4);
    p.rect(0, 0, this.size * 0.4, this.size);
    p.pop();
    
    p.pop();
  }
}