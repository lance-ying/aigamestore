// entities.js - Player and Enemy classes
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Player {
  constructor(p, maxHP, maxAP) {
    this.p = p;
    this.maxHP = maxHP;
    this.currentHP = maxHP;
    this.maxAP = maxAP;
    this.currentAP = maxAP;
    this.x = 100;
    this.y = 200;
    this.size = 50;
    this.activeBuffs = [];
    this.blockValue = 0;
    this.animationTimer = 0;
  }

  takeDamage(amount) {
    let actualDamage = amount;
    if (this.blockValue > 0) {
      actualDamage = Math.max(0, amount - this.blockValue);
      this.blockValue = Math.max(0, this.blockValue - amount);
    }
    this.currentHP = Math.max(0, this.currentHP - actualDamage);
    return actualDamage;
  }

  heal(amount) {
    const actualHeal = Math.min(amount, this.maxHP - this.currentHP);
    this.currentHP = Math.min(this.maxHP, this.currentHP + amount);
    return actualHeal;
  }

  addBuff(type, duration, value) {
    this.activeBuffs.push({ type, duration, value });
  }

  getDamageBonus() {
    let bonus = 0;
    for (const buff of this.activeBuffs) {
      if (buff.type === 'DAMAGE_BOOST') {
        bonus += buff.value;
      }
    }
    return bonus;
  }

  updateBuffs() {
    for (let i = this.activeBuffs.length - 1; i >= 0; i--) {
      this.activeBuffs[i].duration--;
      if (this.activeBuffs[i].duration <= 0) {
        this.activeBuffs.splice(i, 1);
      }
    }
  }

  resetTurn() {
    this.currentAP = this.maxAP;
    this.blockValue = 0;
    this.updateBuffs();
  }

  render() {
    const p = this.p;
    
    // Player body
    p.push();
    p.fill(100, 149, 237); // Cornflower blue
    p.stroke(70, 120, 200);
    p.strokeWeight(3);
    p.rect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
    p.pop();

    // Health bar
    this.renderHealthBar(p, this.x, this.y - this.size / 2 - 15);

    // AP bar
    this.renderAPBar(p, this.x, this.y + this.size / 2 + 10);

    // Block indicator
    if (this.blockValue > 0) {
      p.push();
      p.fill(100, 149, 237, 150);
      p.noStroke();
      p.rect(this.x - this.size / 2 - 5, this.y - this.size / 2 - 5, this.size + 10, this.size + 10);
      p.fill(255);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(14);
      p.text(`Shield: ${this.blockValue}`, this.x, this.y + this.size / 2 + 25);
      p.pop();
    }

    // Buff indicators
    if (this.activeBuffs.length > 0) {
      p.push();
      p.fill(255, 215, 0);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(12);
      let yOffset = this.y - this.size / 2 - 30;
      for (const buff of this.activeBuffs) {
        p.text(`PWR+${buff.value}(${buff.duration})`, this.x, yOffset);
        yOffset -= 15;
      }
      p.pop();
    }
  }

  renderHealthBar(p, x, y) {
    const barWidth = 60;
    const barHeight = 8;
    const hpPercent = this.currentHP / this.maxHP;
    
    const fillColor = hpPercent > 0.5 
      ? [34, 139, 34]  // Green
      : hpPercent > 0.25 
        ? [255, 215, 0] // Yellow
        : [178, 34, 34]; // Red

    p.push();
    p.fill(50);
    p.noStroke();
    p.rect(x - barWidth / 2, y, barWidth, barHeight);
    p.fill(...fillColor);
    p.rect(x - barWidth / 2, y, barWidth * hpPercent, barHeight);
    p.pop();

    // HP text
    p.push();
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(10);
    p.text(`${this.currentHP}/${this.maxHP}`, x, y - 10);
    p.pop();
  }

  renderAPBar(p, x, y) {
    const barWidth = 60;
    const barHeight = 6;
    const apPercent = this.currentAP / this.maxAP;

    p.push();
    p.fill(50);
    p.noStroke();
    p.rect(x - barWidth / 2, y, barWidth, barHeight);
    p.fill(255, 140, 0); // Orange
    p.rect(x - barWidth / 2, y, barWidth * apPercent, barHeight);
    p.pop();

    // AP text
    p.push();
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(10);
    p.text(`AP: ${this.currentAP}/${this.maxAP}`, x, y + 10);
    p.pop();
  }

  logState(p) {
    p.logs.player_info.push({
      screen_x: this.x,
      screen_y: this.y,
      game_x: this.x,
      game_y: this.y,
      framecount: p.frameCount
    });
  }
}

export class Enemy {
  constructor(p, type, hp, damage, x, y) {
    this.p = p;
    this.type = type;
    this.maxHP = hp;
    this.currentHP = hp;
    this.damage = damage;
    this.x = x;
    this.y = y;
    this.size = this.getSizeForType(type);
    this.activeBuffs = [];
    this.turnCounter = 0;
    this.animationTimer = 0;
    this.hasRaged = false;
  }

  getSizeForType(type) {
    if (type === 'BOSS') return 80;
    if (type.includes('HEAVY')) return 60;
    return 40;
  }

  takeDamage(amount) {
    this.currentHP = Math.max(0, this.currentHP - amount);
    
    // Rage mechanic for GRUNT_RAGE
    if (this.type === 'GRUNT_RAGE' && !this.hasRaged && this.currentHP < this.maxHP * 0.3) {
      this.damage += 2;
      this.hasRaged = true;
      this.addBuff('RAGE', 1, 2);
    }
    
    return amount;
  }

  addBuff(type, duration, value) {
    this.activeBuffs.push({ type, duration, value });
  }

  updateBuffs() {
    for (let i = this.activeBuffs.length - 1; i >= 0; i--) {
      this.activeBuffs[i].duration--;
      if (this.activeBuffs[i].duration <= 0) {
        this.activeBuffs.splice(i, 1);
      }
    }
  }

  getAction(player, gameState) {
    this.turnCounter++;
    
    // Boss summon mechanic
    if (this.type === 'BOSS' && this.turnCounter % 3 === 0) {
      return { type: 'SUMMON' };
    }
    
    // Heavy heal mechanic
    if (this.type === 'HEAVY_HEAL' && Math.random() < 0.1) {
      return { type: 'SELF_HEAL', value: 10 };
    }
    
    // Heavy double attack
    if (this.type === 'HEAVY_DOUBLE') {
      return { type: 'DOUBLE_ATTACK', damage: this.damage };
    }
    
    // Heavy weaken attack
    if (this.type === 'HEAVY') {
      return { type: 'WEAKEN_ATTACK', damage: this.damage };
    }
    
    // Default attack
    return { type: 'ATTACK', damage: this.damage };
  }

  render() {
    const p = this.p;
    
    // Enemy body
    p.push();
    const color = this.type === 'BOSS' 
      ? [139, 0, 0]    // Dark red
      : this.type.includes('HEAVY')
        ? [178, 34, 34] // Fire brick
        : [220, 20, 60]; // Crimson
    
    p.fill(...color);
    p.stroke(color[0] - 30, color[1], color[2]);
    p.strokeWeight(3);
    p.circle(this.x, this.y, this.size);
    p.pop();

    // Health bar
    this.renderHealthBar(p, this.x, this.y - this.size / 2 - 15);

    // Type label
    p.push();
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(10);
    const label = this.type === 'BOSS' ? 'BOSS' 
      : this.type.includes('HEAVY') ? 'HEAVY'
      : 'GRUNT';
    p.text(label, this.x, this.y);
    p.pop();

    // Buff indicators
    if (this.activeBuffs.length > 0) {
      p.push();
      p.fill(255, 69, 0);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(10);
      let yOffset = this.y - this.size / 2 - 30;
      for (const buff of this.activeBuffs) {
        p.text(`RAGE!`, this.x, yOffset);
        yOffset -= 15;
      }
      p.pop();
    }
  }

  renderHealthBar(p, x, y) {
    const barWidth = 50;
    const barHeight = 6;
    const hpPercent = this.currentHP / this.maxHP;
    
    const fillColor = hpPercent > 0.5 
      ? [34, 139, 34]
      : hpPercent > 0.25 
        ? [255, 215, 0]
        : [178, 34, 34];

    p.push();
    p.fill(50);
    p.noStroke();
    p.rect(x - barWidth / 2, y, barWidth, barHeight);
    p.fill(...fillColor);
    p.rect(x - barWidth / 2, y, barWidth * hpPercent, barHeight);
    p.pop();

    // HP text
    p.push();
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(9);
    p.text(`${this.currentHP}/${this.maxHP}`, x, y - 8);
    p.pop();
  }

  isDead() {
    return this.currentHP <= 0;
  }
}