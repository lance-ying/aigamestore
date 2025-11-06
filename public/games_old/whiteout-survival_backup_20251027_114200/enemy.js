// enemy.js - Enemy class and combat zones

export class Enemy {
  constructor(type, level) {
    this.type = type;
    this.level = level;
    this.name = this.getNameForType();
    this.maxHP = this.getBaseHP();
    this.currentHP = this.maxHP;
    this.atk = this.getBaseAtk();
    this.def = this.getBaseDef();
    this.xpReward = this.getXPReward();
    this.scoreReward = 50;
  }
  
  getNameForType() {
    switch(this.type) {
      case "wolf": return "Wolf";
      case "bear": return "Bear";
      case "grunt": return "Rival Grunt";
      case "chief": return "Rival Chief";
      case "boss": return "Grand Chief";
      default: return "Enemy";
    }
  }
  
  getBaseHP() {
    const baseHP = {
      wolf: 30,
      bear: 60,
      grunt: 40,
      chief: 80,
      boss: 200
    };
    return (baseHP[this.type] || 30) * (1 + (this.level - 1) * 0.3);
  }
  
  getBaseAtk() {
    const baseAtk = {
      wolf: 8,
      bear: 15,
      grunt: 12,
      chief: 20,
      boss: 30
    };
    return (baseAtk[this.type] || 8) * (1 + (this.level - 1) * 0.3);
  }
  
  getBaseDef() {
    const baseDef = {
      wolf: 2,
      bear: 8,
      grunt: 5,
      chief: 10,
      boss: 15
    };
    return (baseDef[this.type] || 2) * (1 + (this.level - 1) * 0.3);
  }
  
  getXPReward() {
    const baseXP = {
      wolf: 20,
      bear: 40,
      grunt: 30,
      chief: 60,
      boss: 200
    };
    return (baseXP[this.type] || 20) * this.level;
  }
  
  getColor() {
    switch(this.type) {
      case "wolf": return [180, 100, 100];
      case "bear": return [120, 80, 60];
      case "grunt": return [160, 80, 80];
      case "chief": return [200, 50, 50];
      case "boss": return [255, 0, 0];
      default: return [150, 80, 80];
    }
  }
  
  getIcon() {
    switch(this.type) {
      case "wolf": return "W";
      case "bear": return "B";
      case "grunt": return "G";
      case "chief": return "C";
      case "boss": return "X";
      default: return "E";
    }
  }
  
  takeDamage(damage) {
    const actualDamage = Math.max(1, damage - this.def);
    this.currentHP = Math.max(0, this.currentHP - actualDamage);
    return actualDamage;
  }
  
  isAlive() {
    return this.currentHP > 0;
  }
}

export function createCombatZone(id, x, y, level) {
  const zone = {
    id,
    x,
    y,
    unlocked: true,
    defeated: false,
    enemies: []
  };
  
  // Define enemies based on level
  switch(id) {
    case 0: // Level 1
      zone.enemies = [
        new Enemy("wolf", level),
        new Enemy("wolf", level)
      ];
      break;
    case 1: // Level 2
      zone.enemies = [
        new Enemy("bear", level),
        new Enemy("wolf", level),
        new Enemy("wolf", level),
        new Enemy("wolf", level)
      ];
      break;
    case 2: // Level 3
      zone.enemies = [
        new Enemy("chief", level),
        new Enemy("grunt", level)
      ];
      break;
    case 3: // Level 4
      zone.enemies = [
        new Enemy("chief", level),
        new Enemy("grunt", level),
        new Enemy("grunt", level),
        new Enemy("bear", level)
      ];
      break;
    case 4: // Level 5 - Boss
      zone.enemies = [
        new Enemy("boss", level),
        new Enemy("chief", level),
        new Enemy("grunt", level),
        new Enemy("grunt", level)
      ];
      break;
  }
  
  return zone;
}