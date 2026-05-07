// player.js - Player class and related functions

import { PLAYER_CONFIG, CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';
import { handleEnemyDeath } from './combat.js';

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
    this.projectileCount = 0;
    
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
    
    // Sword upgrades
    this.swordRange = PLAYER_CONFIG.swordRange;
    this.swordArc = PLAYER_CONFIG.swordArc;
    this.swordDamageBonus = 0;
    this.swordSpeedMultiplier = 1.0;
    this.doubleSwords = false;
    this.spinAttack = false;
    
    // Sword state
    this.swordSwinging = false;
    this.swordAngle = 0;
    this.swordStartAngle = 0;
    this.swordSwingProgress = 0;
    this.swordSwingDuration = 22;
    this.swordHitEnemies = new Set();
    
    // Second sword for double swords
    this.sword2Angle = 0;
    this.sword2StartAngle = 0;
    
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
    
    // Update sword swing animation and check collisions during swing
    if (this.swordSwinging) {
      this.swordSwingProgress++;
      const actualDuration = this.swordSwingDuration / this.swordSpeedMultiplier;
      const progress = this.swordSwingProgress / actualDuration;
      
      if (this.spinAttack) {
        // Full 360 degree spin
        this.swordAngle = this.swordStartAngle + (Math.PI * 2 * progress);
        if (this.doubleSwords) {
          this.sword2Angle = this.sword2StartAngle + (Math.PI * 2 * progress);
        }
      } else {
        // Normal swing arc
        const swingArc = this.swordArc * 1.5; // Make swing cover more than just the arc
        this.swordAngle = this.swordStartAngle + (swingArc * progress);
        if (this.doubleSwords) {
          this.sword2Angle = this.sword2StartAngle + (swingArc * progress);
        }
      }
      
      // Check for sword hits during swing
      this.checkSwordCollisions(p);
      
      if (this.swordSwingProgress >= actualDuration) {
        this.swordSwinging = false;
        this.swordSwingProgress = 0;
        this.swordHitEnemies.clear();
      }
    }
    
    // Apply movement
    this.x += this.vx;
    this.y += this.vy;
    
    // Keep player in bounds
    this.x = p.constrain(this.x, this.radius, CANVAS_WIDTH - this.radius);
    this.y = p.constrain(this.y, this.radius, CANVAS_HEIGHT - this.radius);
  }
  
  startSwordSwing() {
    this.swordSwinging = true;
    this.swordSwingProgress = 0;
    this.swordHitEnemies.clear();
    
    if (this.spinAttack) {
      // Start spinning from right
      this.swordStartAngle = 0;
      this.swordAngle = this.swordStartAngle;
      if (this.doubleSwords) {
        this.sword2StartAngle = Math.PI; // Opposite side
        this.sword2Angle = this.sword2StartAngle;
      }
    } else {
      // Normal swing - start from below horizontal on right
      this.swordStartAngle = -Math.PI * 0.3;
      this.swordAngle = this.swordStartAngle;
      if (this.doubleSwords) {
        // Second sword starts from left side
        this.sword2StartAngle = Math.PI + Math.PI * 0.3;
        this.sword2Angle = this.sword2StartAngle;
      }
    }
  }
  
  checkSwordCollisions(p) {
    // Check main sword
    this.checkSingleSwordCollision(p, this.swordAngle);
    
    // Check second sword if double swords
    if (this.doubleSwords) {
      this.checkSingleSwordCollision(p, this.sword2Angle);
    }
  }
  
  checkSingleSwordCollision(p, swordAngle) {
    const swordRange = this.swordRange;
    const swordArc = this.swordArc;
    
    for (const enemy of gameState.enemies) {
      if (enemy.isDead) continue;
      if (this.swordHitEnemies.has(enemy)) continue;
      
      const dx = enemy.x - this.x;
      const dy = enemy.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < swordRange) {
        const angleToEnemy = Math.atan2(dy, dx);
        
        let angleDiff = angleToEnemy - swordAngle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        
        // For spin attack, hit detection is more lenient
        const hitArc = this.spinAttack ? Math.PI : swordArc * 0.7;
        
        if (Math.abs(angleDiff) < hitArc) {
          // Calculate damage with sword bonus
          let damage = this.baseDamage + this.swordDamageBonus;
          if (this.critChance > 0 && Math.random() < this.critChance) {
            damage *= (2 + this.critDamage);
          }
          
          const killed = enemy.takeDamage(damage);
          this.swordHitEnemies.add(enemy);
          
          // Lifesteal
          if (this.lifesteal > 0) {
            this.health = Math.min(this.health + damage * this.lifesteal, this.maxHealth);
          }
          
          if (killed) {
            handleEnemyDeath(p, enemy, []);
          }
        }
      }
    }
  }
  
  takeDamage(amount) {
    if (this.invincibilityFrames > 0) return false;
    
    this.health -= amount;
    this.invincibilityFrames = PLAYER_CONFIG.invincibilityDuration;
    this.hitFlash = 10;
    
    if (this.health <= 0) {
      this.health = 0;
      return true;
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
    
    if (effect.weapon) {
      this.weapons.push(effect.weapon);
    }
    
    // Sword upgrades
    if (effect.swordSpeed) {
      this.swordSpeedMultiplier += effect.swordSpeed;
    }
    if (effect.swordRange) {
      this.swordRange += effect.swordRange;
    }
    if (effect.swordArc) {
      this.swordArc += effect.swordArc;
    }
    if (effect.swordDamage) {
      this.swordDamageBonus += effect.swordDamage;
    }
    if (effect.doubleSwords) {
      this.doubleSwords = true;
    }
    if (effect.spinAttack) {
      this.spinAttack = true;
    }
    
    // General stats
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
    
    // Sword visualization
    if (this.swordSwinging) {
      this.renderSword(p, this.swordAngle);
      
      // Second sword for double swords
      if (this.doubleSwords) {
        this.renderSword(p, this.sword2Angle);
      }
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
  
  renderSword(p, angle) {
    const swordLength = this.swordRange;
    const swordEndX = this.x + Math.cos(angle) * swordLength;
    const swordEndY = this.y + Math.sin(angle) * swordLength;
    
    p.stroke(200, 220, 255);
    p.strokeWeight(4);
    p.line(this.x, this.y, swordEndX, swordEndY);
    
    // Sword tip glow
    p.fill(255, 255, 255, 150);
    p.noStroke();
    p.circle(swordEndX, swordEndY, 6);
    
    // Arc indicator for spin attack
    if (this.spinAttack && this.swordSwinging) {
      p.noFill();
      p.stroke(200, 220, 255, 80);
      p.strokeWeight(2);
      p.circle(this.x, this.y, this.swordRange * 2);
    }
  }
}