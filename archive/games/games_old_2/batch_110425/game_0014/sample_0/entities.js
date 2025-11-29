// entities.js - Player and Enemy classes

import { gameState } from './globals.js';

export class Player {
  constructor() {
    this.maxHP = 100;
    this.hp = 100;
    this.maxMP = 50;
    this.mp = 50;
    this.maxAP = 5;
    this.ap = 5;
    this.attack = 15;
    this.defense = 10;
    this.magicAttack = 12;
    this.level = 1;
    
    // Weapons (Eris transformations)
    this.weapons = [
      {
        name: "Flame Blade",
        enhancement: 0,
        skills: [
          { name: "Fire Slash", apCost: 2, power: 1.5, type: "physical" },
          { name: "Inferno Strike", apCost: 3, power: 2.2, type: "magic" }
        ]
      },
      {
        name: "Ice Edge",
        enhancement: 0,
        skills: [
          { name: "Frost Cut", apCost: 2, power: 1.4, type: "physical" },
          { name: "Blizzard Blast", apCost: 3, power: 2.0, type: "magic" }
        ]
      },
      {
        name: "Thunder Sword",
        enhancement: 0,
        skills: [
          { name: "Lightning Stab", apCost: 2, power: 1.6, type: "physical" },
          { name: "Thunder Storm", apCost: 4, power: 2.5, type: "magic" }
        ]
      }
    ];
    
    this.currentWeapon = 0;
  }
  
  takeDamage(amount) {
    const actualDamage = Math.max(1, amount - this.defense);
    this.hp = Math.max(0, this.hp - actualDamage);
    return actualDamage;
  }
  
  heal(amount) {
    this.hp = Math.min(this.maxHP, this.hp + amount);
  }
  
  useAP(amount) {
    this.ap = Math.max(0, this.ap - amount);
  }
  
  charge() {
    this.ap = this.maxAP;
  }
  
  levelUp() {
    this.level++;
    this.maxHP += 15;
    this.hp = this.maxHP;
    this.maxMP += 8;
    this.mp = this.maxMP;
    this.attack += 3;
    this.defense += 2;
    this.magicAttack += 3;
  }
  
  gainExp(amount) {
    gameState.exp += amount;
    while (gameState.exp >= gameState.expToNext) {
      gameState.exp -= gameState.expToNext;
      this.levelUp();
      gameState.level = this.level;
      gameState.expToNext = Math.floor(gameState.expToNext * 1.5);
    }
  }
}

export class Enemy {
  constructor(name, level, type = "normal") {
    this.name = name;
    this.level = level;
    this.type = type; // "normal", "boss"
    
    const levelMult = 1 + (level - 1) * 0.3;
    const typeMult = type === "boss" ? 2.5 : 1;
    
    this.maxHP = Math.floor(50 * levelMult * typeMult);
    this.hp = this.maxHP;
    this.attack = Math.floor(10 * levelMult * typeMult);
    this.defense = Math.floor(5 * levelMult * typeMult);
    this.expReward = Math.floor(30 * levelMult * typeMult);
    
    // Enemy appearance properties
    this.color = this.getColorByType(type);
    this.size = type === "boss" ? 80 : 50;
    this.animationOffset = 0;
  }
  
  getColorByType(type) {
    if (type === "boss") {
      return [180, 20, 20]; // Dark red
    }
    const colors = [
      [100, 100, 180], // Blue
      [100, 180, 100], // Green
      [180, 100, 180], // Purple
      [180, 150, 100]  // Brown
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
  
  takeDamage(amount) {
    const actualDamage = Math.max(1, amount - this.defense);
    this.hp = Math.max(0, this.hp - actualDamage);
    return actualDamage;
  }
  
  attack(player) {
    return this.attack;
  }
  
  isDefeated() {
    return this.hp <= 0;
  }
}

export function createEnemyByWave(wave) {
  if (wave === 1) {
    return new Enemy("Goblin Scout", 1, "normal");
  } else if (wave === 2) {
    return new Enemy("Dark Knight", 2, "normal");
  } else if (wave === 3) {
    return new Enemy("Shadow Lord", 3, "boss");
  }
  return new Enemy("Unknown Foe", wave, "normal");
}