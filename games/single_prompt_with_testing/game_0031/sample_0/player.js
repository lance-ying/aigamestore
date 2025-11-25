// player.js - Player entity and abilities

import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 20;
    this.speed = 3;
    this.health = 100;
    this.maxHealth = 100;
    this.direction = 0; // 0: right, 1: down, 2: left, 3: up
    this.color = [100, 200, 255];
    
    // Combat stats
    this.damage = 10;
    this.fireRate = 30; // frames between shots
    this.lastShotTime = 0;
    this.projectileSpeed = 6;
    
    // Abilities
    this.dashCooldown = 60;
    this.lastDashTime = -60;
    this.dashDistance = 80;
    this.isDashing = false;
    this.dashTimer = 0;
    
    this.specialCharge = 0;
    this.specialMaxCharge = 100;
    this.specialActive = false;
    this.specialDuration = 0;
    
    // Upgrades
    this.upgrades = {
      damageBonus: 0,
      fireRateBonus: 0,
      speedBonus: 0,
      healthBonus: 0,
      multishot: 1,
      piercing: false
    };
  }
  
  update(p) {
    if (this.isDashing) {
      this.dashTimer--;
      if (this.dashTimer <= 0) {
        this.isDashing = false;
      }
    }
    
    if (this.specialActive) {
      this.specialDuration--;
      if (this.specialDuration <= 0) {
        this.specialActive = false;
      }
    }
    
    // Bounds checking
    this.x = p.constrain(this.x, this.size, CANVAS_WIDTH - this.size);
    this.y = p.constrain(this.y, this.size, CANVAS_HEIGHT - this.size);
  }
  
  move(dx, dy) {
    if (!this.isDashing) {
      const totalSpeed = this.speed + this.upgrades.speedBonus;
      this.x += dx * totalSpeed;
      this.y += dy * totalSpeed;
      
      // Update direction based on movement
      if (dx > 0) this.direction = 0;
      else if (dx < 0) this.direction = 2;
      else if (dy > 0) this.direction = 1;
      else if (dy < 0) this.direction = 3;
    }
  }
  
  dash(p) {
    const currentTime = p.frameCount;
    if (currentTime - this.lastDashTime >= this.dashCooldown) {
      this.isDashing = true;
      this.dashTimer = 10;
      this.lastDashTime = currentTime;
      
      // Move in current direction
      const dashDist = this.dashDistance;
      switch(this.direction) {
        case 0: this.x += dashDist; break;
        case 1: this.y += dashDist; break;
        case 2: this.x -= dashDist; break;
        case 3: this.y -= dashDist; break;
      }
    }
  }
  
  shoot(p) {
    const currentTime = p.frameCount;
    const actualFireRate = Math.max(5, this.fireRate - this.upgrades.fireRateBonus);
    
    if (currentTime - this.lastShotTime >= actualFireRate) {
      this.lastShotTime = currentTime;
      
      const actualDamage = this.damage + this.upgrades.damageBonus;
      const shots = this.upgrades.multishot;
      
      for (let i = 0; i < shots; i++) {
        const angleOffset = (i - (shots - 1) / 2) * 0.2;
        const projectile = this.createProjectile(angleOffset, actualDamage);
        gameState.projectiles.push(projectile);
        gameState.entities.push(projectile);
      }
    }
  }
  
  createProjectile(angleOffset, damage) {
    const baseAngle = this.direction * Math.PI / 2;
    const angle = baseAngle + angleOffset;
    
    return {
      x: this.x,
      y: this.y,
      vx: Math.cos(angle) * this.projectileSpeed,
      vy: Math.sin(angle) * this.projectileSpeed,
      size: 6,
      damage: damage,
      piercing: this.upgrades.piercing,
      lifetime: 120,
      age: 0,
      color: this.specialActive ? [255, 255, 100] : [255, 200, 100],
      type: 'projectile'
    };
  }
  
  useSpecial(p) {
    if (this.specialCharge >= this.specialMaxCharge && !this.specialActive) {
      this.specialActive = true;
      this.specialDuration = 180; // 3 seconds
      this.specialCharge = 0;
      
      // Create explosion effect
      for (let i = 0; i < 20; i++) {
        const angle = (i / 20) * Math.PI * 2;
        gameState.particles.push({
          x: this.x,
          y: this.y,
          vx: Math.cos(angle) * 4,
          vy: Math.sin(angle) * 4,
          life: 30,
          color: [255, 255, 100],
          size: 8
        });
      }
    }
  }
  
  takeDamage(amount) {
    if (!this.isDashing) {
      this.health -= amount;
      if (this.health <= 0) {
        this.health = 0;
      }
    }
  }
  
  gainXP(amount) {
    gameState.xp += amount;
    this.specialCharge = Math.min(this.specialMaxCharge, this.specialCharge + amount * 2);
    
    if (gameState.xp >= gameState.xpToNextLevel) {
      this.levelUp();
    }
  }
  
  levelUp() {
    gameState.level++;
    gameState.xp -= gameState.xpToNextLevel;
    gameState.xpToNextLevel = Math.floor(gameState.xpToNextLevel * 1.5);
    gameState.isPendingUpgrade = true;
    this.generateUpgrades();
  }
  
  generateUpgrades() {
    const upgrades = [
      { name: "Damage Up", type: "damage", value: 5, description: "+5 Damage" },
      { name: "Fire Rate", type: "fireRate", value: 5, description: "Faster Shooting" },
      { name: "Speed Boost", type: "speed", value: 0.5, description: "+Movement Speed" },
      { name: "Max Health", type: "health", value: 20, description: "+20 Max HP" },
      { name: "Multishot", type: "multishot", value: 1, description: "+1 Projectile" },
      { name: "Piercing", type: "piercing", value: 1, description: "Shots Pierce Enemies" }
    ];
    
    gameState.upgradesAvailable = [];
    const shuffled = [...upgrades].sort(() => Math.random() - 0.5);
    gameState.upgradesAvailable = shuffled.slice(0, 3);
  }
  
  applyUpgrade(upgrade) {
    switch(upgrade.type) {
      case "damage":
        this.upgrades.damageBonus += upgrade.value;
        break;
      case "fireRate":
        this.upgrades.fireRateBonus += upgrade.value;
        break;
      case "speed":
        this.upgrades.speedBonus += upgrade.value;
        break;
      case "health":
        this.upgrades.healthBonus += upgrade.value;
        this.maxHealth += upgrade.value;
        this.health = this.maxHealth;
        break;
      case "multishot":
        this.upgrades.multishot += upgrade.value;
        break;
      case "piercing":
        this.upgrades.piercing = true;
        break;
    }
    gameState.isPendingUpgrade = false;
  }
  
  draw(p) {
    p.push();
    p.translate(this.x, this.y);
    
    // Dash effect
    if (this.isDashing) {
      p.fill(150, 200, 255, 100);
      p.noStroke();
      p.ellipse(0, 0, this.size * 2.5, this.size * 2.5);
    }
    
    // Special ability glow
    if (this.specialActive) {
      p.fill(255, 255, 100, 100);
      p.noStroke();
      p.ellipse(0, 0, this.size * 2, this.size * 2);
    }
    
    // Body
    p.fill(...this.color);
    p.stroke(50);
    p.strokeWeight(2);
    p.ellipse(0, 0, this.size * 2, this.size * 2);
    
    // Direction indicator
    p.fill(255);
    p.noStroke();
    const indicatorDist = this.size * 0.6;
    const angle = this.direction * Math.PI / 2;
    p.ellipse(
      Math.cos(angle) * indicatorDist,
      Math.sin(angle) * indicatorDist,
      6, 6
    );
    
    p.pop();
    
    // Health bar
    const barWidth = this.size * 2;
    const barHeight = 4;
    const barY = this.y - this.size - 8;
    
    p.fill(50);
    p.noStroke();
    p.rect(this.x - barWidth / 2, barY, barWidth, barHeight);
    
    const healthPercent = this.health / this.maxHealth;
    p.fill(100, 255, 100);
    p.rect(this.x - barWidth / 2, barY, barWidth * healthPercent, barHeight);
  }
}