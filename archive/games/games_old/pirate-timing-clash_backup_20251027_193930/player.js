// player.js - Player character class

import { CANVAS_WIDTH, CANVAS_HEIGHT, ABILITIES } from './globals.js';

export class Player {
  constructor(p) {
    this.p = p;
    this.x = 100;
    this.y = CANVAS_HEIGHT / 2;
    this.width = 60;
    this.height = 80;
    this.hp = 250;
    this.maxHp = 250;
    this.attack = 30;
    this.specialGauge = 0;
    this.specialMaxGauge = 100;
    this.isAttacking = false;
    this.attackTimer = 0;
    this.flashTimer = 0;
    
    // Progression system
    this.level = 1;
    this.xp = 0;
    this.xpToNextLevel = 120; // Reduced from 200 for faster progression
    
    // Ability system
    this.currentAbility = ABILITIES.QUICK_STRIKE;
    this.unlockedAbilities = [ABILITIES.QUICK_STRIKE];
    
    // Passive regeneration
    this.regenTimer = 0;
    this.regenRate = 90; // Regen every 90 frames (1.5 seconds at 60fps)
    this.regenAmount = 2;
  }

  update() {
    // Update attack animation
    if (this.isAttacking) {
      this.attackTimer--;
      if (this.attackTimer <= 0) {
        this.isAttacking = false;
      }
    }
    
    // Update flash effect
    if (this.flashTimer > 0) {
      this.flashTimer--;
    }
    
    // Passive health regeneration
    if (this.hp < this.maxHp && this.hp > 0) {
      this.regenTimer++;
      if (this.regenTimer >= this.regenRate) {
        this.heal(this.regenAmount);
        this.regenTimer = 0;
      }
    }
  }

  draw() {
    const p = this.p;
    p.push();
    
    // Shadow
    p.fill(0, 0, 0, 50);
    p.noStroke();
    p.ellipse(this.x, this.y + this.height / 2 + 5, this.width * 0.8, 20);
    
    // Character body - apply jump animation if attacking
    const jumpOffset = this.isAttacking ? -15 : 0;
    const bodyY = this.y + jumpOffset;
    
    // Body glow when flashing
    if (this.flashTimer > 0) {
      p.fill(100, 200, 255, 150);
      p.rect(this.x - this.width / 2 - 5, bodyY - this.height / 2 - 5, 
             this.width + 10, this.height + 10, 10);
    }
    
    // Main body
    p.fill(50, 100, 200);
    p.stroke(30, 60, 150);
    p.strokeWeight(3);
    p.rect(this.x - this.width / 2, bodyY - this.height / 2, this.width, this.height, 8);
    
    // Face/details
    p.fill(255, 255, 255);
    p.noStroke();
    p.ellipse(this.x - 10, bodyY - 15, 12, 12); // Left eye
    p.ellipse(this.x + 10, bodyY - 15, 12, 12); // Right eye
    p.fill(0, 0, 0);
    p.ellipse(this.x - 10, bodyY - 15, 6, 6);
    p.ellipse(this.x + 10, bodyY - 15, 6, 6);
    
    // Mouth
    p.noFill();
    p.stroke(255, 255, 255);
    p.strokeWeight(2);
    p.arc(this.x, bodyY, 20, 15, 0, this.p.PI);
    
    // Level badge
    p.fill(255, 215, 0);
    p.noStroke();
    p.ellipse(this.x - this.width / 2 - 10, bodyY - this.height / 2, 20, 20);
    p.fill(0);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(12);
    p.text(this.level, this.x - this.width / 2 - 10, bodyY - this.height / 2);
    
    // HP Bar
    this.drawHPBar();
    
    // Special Gauge
    this.drawSpecialGauge();
    
    // XP Bar
    this.drawXPBar();
    
    p.pop();
  }

  drawHPBar() {
    const p = this.p;
    const barWidth = 80;
    const barHeight = 10;
    const barX = this.x - barWidth / 2;
    const barY = this.y - this.height / 2 - 25;
    
    // Background
    p.fill(100, 100, 100);
    p.noStroke();
    p.rect(barX, barY, barWidth, barHeight, 3);
    
    // HP fill
    const hpPercent = this.hp / this.maxHp;
    const fillColor = hpPercent > 0.5 ? [50, 200, 50] : 
                      hpPercent > 0.25 ? [200, 200, 50] : [200, 50, 50];
    p.fill(...fillColor);
    p.rect(barX, barY, barWidth * hpPercent, barHeight, 3);
    
    // HP text
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(10);
    p.text(`${Math.ceil(this.hp)}/${this.maxHp}`, this.x, barY - 10);
  }

  drawSpecialGauge() {
    const p = this.p;
    const barWidth = 80;
    const barHeight = 8;
    const barX = this.x - barWidth / 2;
    const barY = this.y + this.height / 2 + 15;
    
    // Background
    p.fill(80, 80, 80);
    p.noStroke();
    p.rect(barX, barY, barWidth, barHeight, 3);
    
    // Gauge fill
    const gaugePercent = this.specialGauge / this.specialMaxGauge;
    p.fill(255, 200, 50);
    p.rect(barX, barY, barWidth * gaugePercent, barHeight, 3);
    
    // Special ready indicator
    if (this.specialGauge >= this.specialMaxGauge) {
      p.fill(255, 255, 100);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(10);
      p.text("SHIFT: SPECIAL!", this.x, barY + barHeight + 12);
    }
  }

  drawXPBar() {
    const p = this.p;
    const barWidth = 80;
    const barHeight = 6;
    const barX = this.x - barWidth / 2;
    const barY = this.y + this.height / 2 + 32;
    
    // Background
    p.fill(60, 60, 80);
    p.noStroke();
    p.rect(barX, barY, barWidth, barHeight, 3);
    
    // XP fill
    const xpPercent = this.xp / this.xpToNextLevel;
    p.fill(100, 200, 255);
    p.rect(barX, barY, barWidth * xpPercent, barHeight, 3);
    
    // Level text
    p.fill(200, 220, 255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(9);
    p.text(`LV${this.level} XP: ${this.xp}/${this.xpToNextLevel}`, this.x, barY + barHeight + 8);
  }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    this.flashTimer = 10;
  }

  heal(amount) {
    const oldHp = this.hp;
    this.hp = Math.min(this.maxHp, this.hp + amount);
    const actualHeal = this.hp - oldHp;
    if (actualHeal > 0) {
      this.flashTimer = 10;
    }
    return actualHeal;
  }

  performAttack() {
    this.isAttacking = true;
    this.attackTimer = 20;
    this.flashTimer = 15;
  }

  addSpecialGauge(amount) {
    this.specialGauge = Math.min(this.specialMaxGauge, this.specialGauge + amount);
  }

  useSpecial() {
    if (this.specialGauge >= this.specialMaxGauge) {
      this.specialGauge = 0;
      this.performAttack();
      return true;
    }
    return false;
  }

  gainXP(amount) {
    this.xp += amount;
    
    // Check for level up
    while (this.xp >= this.xpToNextLevel) {
      this.levelUp();
    }
  }

  levelUp() {
    this.xp -= this.xpToNextLevel;
    this.level++;
    this.xpToNextLevel = Math.floor(this.xpToNextLevel * 1.4); // Reduced from 1.5 for smoother progression
    
    // Increase stats
    this.maxHp += 25;
    this.hp = this.maxHp; // Full heal on level up
    this.attack += 6;
    
    // Unlock new abilities
    this.checkUnlockAbilities();
    
    return true;
  }

  checkUnlockAbilities() {
    for (const abilityKey in ABILITIES) {
      const ability = ABILITIES[abilityKey];
      if (ability.unlockLevel <= this.level && !this.unlockedAbilities.includes(ability)) {
        this.unlockedAbilities.push(ability);
      }
    }
  }

  selectAbility(abilityKey) {
    const ability = ABILITIES[abilityKey];
    if (ability && this.unlockedAbilities.includes(ability)) {
      this.currentAbility = ability;
      return true;
    }
    return false;
  }

  getCurrentAbility() {
    return this.currentAbility;
  }
}