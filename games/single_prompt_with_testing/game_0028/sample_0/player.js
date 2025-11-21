// player.js - Player entity

import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 12;
    this.speed = 2.5;
    this.maxHealth = 100;
    this.health = this.maxHealth;
    
    // Combat stats
    this.damage = 10;
    this.fireRate = 10; // frames between shots
    this.lastFireFrame = 0;
    this.projectileSpeed = 6;
    
    // Experience and leveling
    this.experience = 0;
    this.level = 1;
    this.experienceToNextLevel = 100;
    
    // Abilities
    this.autoAim = false;
    this.hasShield = false;
    this.shieldEndTime = 0;
    this.shieldCooldown = 0;
    
    // Upgrades
    this.damageMultiplier = 1.0;
    this.speedMultiplier = 1.0;
    this.fireRateMultiplier = 1.0;
    this.maxHealthBonus = 0;
    
    // Visual
    this.angle = 0;
  }
  
  update(p) {
    // Movement
    let dx = 0;
    let dy = 0;
    
    if (gameState.keys.left) dx -= 1;
    if (gameState.keys.right) dx += 1;
    if (gameState.keys.up) dy -= 1;
    if (gameState.keys.down) dy += 1;
    
    // Normalize diagonal movement
    if (dx !== 0 && dy !== 0) {
      dx *= 0.707;
      dy *= 0.707;
    }
    
    const moveSpeed = this.speed * this.speedMultiplier;
    this.x += dx * moveSpeed;
    this.y += dy * moveSpeed;
    
    // Boundary collision
    this.x = p.constrain(this.x, this.radius, CANVAS_WIDTH - this.radius);
    this.y = p.constrain(this.y, this.radius, CANVAS_HEIGHT - this.radius);
    
    // Update angle based on movement or nearest enemy
    if (this.autoAim && gameState.enemies.length > 0) {
      const nearest = this.findNearestEnemy();
      if (nearest) {
        this.angle = p.atan2(nearest.y - this.y, nearest.x - this.x);
      }
    } else if (dx !== 0 || dy !== 0) {
      this.angle = p.atan2(dy, dx);
    }
    
    // Shield timer
    if (this.hasShield && Date.now() > this.shieldEndTime) {
      this.hasShield = false;
    }
    
    if (this.shieldCooldown > 0) {
      this.shieldCooldown--;
    }
  }
  
  fire(p) {
    const currentFrame = p.frameCount;
    const effectiveFireRate = this.fireRate / this.fireRateMultiplier;
    
    if (currentFrame - this.lastFireFrame >= effectiveFireRate) {
      this.lastFireFrame = currentFrame;
      
      const projectile = {
        x: this.x + p.cos(this.angle) * (this.radius + 5),
        y: this.y + p.sin(this.angle) * (this.radius + 5),
        vx: p.cos(this.angle) * this.projectileSpeed,
        vy: p.sin(this.angle) * this.projectileSpeed,
        damage: this.damage * this.damageMultiplier,
        radius: 4,
        lifespan: 120,
        age: 0
      };
      
      gameState.projectiles.push(projectile);
    }
  }
  
  findNearestEnemy() {
    let nearest = null;
    let minDist = Infinity;
    
    for (const enemy of gameState.enemies) {
      const dist = p5.Vector.dist(
        { x: this.x, y: this.y },
        { x: enemy.x, y: enemy.y }
      );
      if (dist < minDist) {
        minDist = dist;
        nearest = enemy;
      }
    }
    
    return nearest;
  }
  
  takeDamage(amount) {
    if (this.hasShield) {
      return; // Shield blocks all damage
    }
    
    this.health -= amount;
    if (this.health <= 0) {
      this.health = 0;
    }
  }
  
  addExperience(amount) {
    this.experience += amount;
    
    while (this.experience >= this.experienceToNextLevel) {
      this.levelUp();
    }
  }
  
  levelUp() {
    this.level++;
    this.experience -= this.experienceToNextLevel;
    this.experienceToNextLevel = Math.floor(this.experienceToNextLevel * 1.5);
    
    // Trigger upgrade menu
    gameState.showUpgradeMenu = true;
    gameState.availableUpgrades = this.generateUpgrades();
  }
  
  generateUpgrades() {
    const allUpgrades = [
      { name: "Damage +10%", type: "damage", value: 0.1 },
      { name: "Fire Rate +15%", type: "fireRate", value: 0.15 },
      { name: "Speed +10%", type: "speed", value: 0.1 },
      { name: "Max Health +20", type: "health", value: 20 },
      { name: "Shield Ability", type: "ability", value: "shield" }
    ];
    
    // Randomly select 3 upgrades
    const shuffled = [...allUpgrades].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  }
  
  applyUpgrade(upgrade) {
    switch (upgrade.type) {
      case "damage":
        this.damageMultiplier += upgrade.value;
        break;
      case "fireRate":
        this.fireRateMultiplier += upgrade.value;
        break;
      case "speed":
        this.speedMultiplier += upgrade.value;
        break;
      case "health":
        this.maxHealthBonus += upgrade.value;
        this.maxHealth += upgrade.value;
        this.health = Math.min(this.health + upgrade.value, this.maxHealth);
        break;
      case "ability":
        // Shield ability unlocked
        break;
    }
    
    gameState.showUpgradeMenu = false;
    gameState.availableUpgrades = [];
  }
  
  activateShield() {
    if (this.level >= 2 && this.shieldCooldown === 0 && !this.hasShield) {
      this.hasShield = true;
      this.shieldEndTime = Date.now() + 5000; // 5 seconds
      this.shieldCooldown = 600; // 10 seconds at 60fps
    }
  }
  
  render(p) {
    p.push();
    
    // Shield effect
    if (this.hasShield) {
      p.fill(100, 200, 255, 80);
      p.noStroke();
      p.circle(this.x, this.y, this.radius * 3);
      
      p.stroke(100, 200, 255);
      p.strokeWeight(2);
      p.noFill();
      p.circle(this.x, this.y, this.radius * 2.5);
    }
    
    // Body
    p.fill(50, 150, 50);
    p.stroke(30, 100, 30);
    p.strokeWeight(2);
    p.circle(this.x, this.y, this.radius * 2);
    
    // Direction indicator (gun)
    p.stroke(200, 200, 50);
    p.strokeWeight(3);
    const gunLength = this.radius + 8;
    p.line(
      this.x,
      this.y,
      this.x + p.cos(this.angle) * gunLength,
      this.y + p.sin(this.angle) * gunLength
    );
    
    // Health bar
    const barWidth = 40;
    const barHeight = 4;
    const barX = this.x - barWidth / 2;
    const barY = this.y - this.radius - 10;
    
    p.fill(100, 30, 30);
    p.noStroke();
    p.rect(barX, barY, barWidth, barHeight);
    
    const healthPercent = this.health / this.maxHealth;
    p.fill(50, 200, 50);
    p.rect(barX, barY, barWidth * healthPercent, barHeight);
    
    p.pop();
  }
}