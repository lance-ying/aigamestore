// player.js - Player class and related functions

import { PLAYER_CONFIG, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = PLAYER_CONFIG.radius;
    
    // Stats
    this.health = PLAYER_CONFIG.maxHealth;
    this.maxHealth = PLAYER_CONFIG.maxHealth;
    this.speed = PLAYER_CONFIG.baseSpeed;
    this.baseDamage = PLAYER_CONFIG.baseDamage;
    this.attackSpeedMultiplier = PLAYER_CONFIG.baseAttackSpeed;
    this.projectileSpeedMultiplier = 1.0;
    this.projectileCount = 1;
    
    // Experience and leveling
    this.currentExp = 0;
    this.level = 1;
    this.expToNextLevel = PLAYER_CONFIG.expToLevel;
    
    // Combat
    this.invincibilityFrames = 0;
    this.lastAttackTime = 0;
    this.attackInterval = 1000; // Base 1 second
    
    // Weapons and upgrades
    this.weapons = ["BASIC"];
    this.hasAura = false;
    this.auraRadius = 50;
    this.auraDamage = 2;
    this.auraInterval = 500;
    this.lastAuraDamage = 0;
    
    // New stats
    this.piercing = 0;
    this.critChance = 0;
    this.critDamage = 0;
    this.lifesteal = 0;
    this.thorns = 0;
    this.healthRegen = 0;
    this.lastHealthRegen = 0;
    this.expMultiplier = 0;
    this.magnetRange = 0;
    
    // Movement
    this.vx = 0;
    this.vy = 0;
    
    // Visual effects
    this.hitFlash = 0;
    this.levelUpGlow = 0;
  }
  
  update(p) {
    // Decrement invincibility
    if (this.invincibilityFrames > 0) {
      this.invincibilityFrames--;
    }
    
    // Decrement visual effects
    if (this.hitFlash > 0) this.hitFlash--;
    if (this.levelUpGlow > 0) this.levelUpGlow--;
    
    // Apply movement
    this.x += this.vx;
    this.y += this.vy;
    
    // Keep player in bounds
    this.x = p.constrain(this.x, this.radius, CANVAS_WIDTH - this.radius);
    this.y = p.constrain(this.y, this.radius, CANVAS_HEIGHT - this.radius);
  }
  
  takeDamage(amount) {
    if (this.invincibilityFrames > 0) return false;
    
    this.health -= amount;
    this.invincibilityFrames = PLAYER_CONFIG.invincibilityDuration;
    this.hitFlash = 10;
    
    if (this.health <= 0) {
      this.health = 0;
      return true; // Player died
    }
    return false;
  }
  
  addExp(amount) {
    this.currentExp += amount;
    if (this.currentExp >= this.expToNextLevel) {
      return this.levelUp();
    }
    return false;
  }
  
  levelUp() {
    const overflow = this.currentExp - this.expToNextLevel;
    this.level++;
    this.currentExp = overflow;
    this.expToNextLevel = Math.floor(PLAYER_CONFIG.expToLevel * Math.pow(PLAYER_CONFIG.expGrowthRate, this.level - 1));
    this.levelUpGlow = 30;
    return true;
  }
  
  applyUpgrade(upgrade) {
    const effect = upgrade.effect;
    
    if (upgrade.type === "WEAPON" && effect.weapon) {
      this.weapons.push(effect.weapon);
    }
    
    if (effect.attackSpeed) {
      this.attackSpeedMultiplier += effect.attackSpeed;
    }
    if (effect.projectileCount) {
      this.projectileCount += effect.projectileCount;
    }
    if (effect.moveSpeed) {
      this.speed += PLAYER_CONFIG.baseSpeed * effect.moveSpeed;
    }
    if (effect.projectileSpeed) {
      this.projectileSpeedMultiplier += effect.projectileSpeed;
    }
    if (effect.maxHealth) {
      this.maxHealth += effect.maxHealth;
      if (effect.healAmount) {
        this.health = Math.min(this.health + effect.healAmount, this.maxHealth);
      }
    }
    if (effect.baseDamage) {
      this.baseDamage += effect.baseDamage;
    }
    if (effect.aura) {
      this.hasAura = true;
    }
    if (effect.piercing) {
      this.piercing += effect.piercing;
    }
    if (effect.critChance) {
      this.critChance += effect.critChance;
    }
    if (effect.critDamage) {
      this.critDamage += effect.critDamage;
    }
    if (effect.lifesteal) {
      this.lifesteal += effect.lifesteal;
    }
    if (effect.thorns) {
      this.thorns += effect.thorns;
    }
    if (effect.healthRegen) {
      this.healthRegen += effect.healthRegen;
    }
    if (effect.expMultiplier) {
      this.expMultiplier += effect.expMultiplier;
    }
    if (effect.magnetRange) {
      this.magnetRange += effect.magnetRange;
    }
    if (effect.auraSize) {
      this.auraRadius += this.auraRadius * effect.auraSize;
    }
    if (effect.auraDamage) {
      this.auraDamage += effect.auraDamage;
    }
  }
  
  render(p) {
    p.push();
    
    // Level up glow
    if (this.levelUpGlow > 0) {
      const glowAlpha = this.levelUpGlow * 8;
      p.fill(100, 150, 255, glowAlpha);
      p.noStroke();
      p.circle(this.x, this.y, this.radius * 3);
    }
    
    // Aura visualization
    if (this.hasAura) {
      p.noFill();
      p.stroke(255, 200, 100, 100);
      p.strokeWeight(2);
      p.circle(this.x, this.y, this.auraRadius * 2);
    }
    
    // Player body
    const isInvincible = this.invincibilityFrames > 0 && Math.floor(this.invincibilityFrames / 5) % 2 === 0;
    
    if (!isInvincible) {
      if (this.hitFlash > 0) {
        p.fill(255);
      } else {
        p.fill(100, 150, 255);
      }
      p.noStroke();
      p.circle(this.x, this.y, this.radius * 2);
    }
    
    p.pop();
  }
}