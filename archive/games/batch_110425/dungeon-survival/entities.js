// entities.js - Hero and Enemy classes

import { HERO_CLASSES, gameState } from './globals.js';

export class Hero {
  constructor(className, x, y) {
    const baseClass = HERO_CLASSES[className];
    this.className = className;
    this.name = baseClass.name;
    this.maxHp = baseClass.hp;
    this.hp = this.maxHp;
    this.baseAtk = baseClass.atk;
    this.baseDef = baseClass.def;
    this.baseSpd = baseClass.spd;
    this.color = baseClass.color;
    this.level = 1;
    this.exp = 0;
    this.expToLevel = 100;
    this.x = x;
    this.y = y;
    this.equipment = { weapon: null, armor: null, accessory: null };
    this.alive = true;
    this.initSkills();
  }

  initSkills() {
    this.skills = [];
    switch (this.className) {
      case "WARRIOR":
        this.skills = [
          { name: "Power Strike", damage: 50, cost: 0, target: "single" },
          { name: "Shield Bash", damage: 30, stun: true, cost: 0, target: "single" }
        ];
        break;
      case "MAGE":
        this.skills = [
          { name: "Fireball", damage: 60, cost: 0, target: "single" },
          { name: "Ice Storm", damage: 35, cost: 0, target: "all" }
        ];
        break;
      case "CLERIC":
        this.skills = [
          { name: "Heal", heal: 40, cost: 0, target: "ally" },
          { name: "Smite", damage: 45, cost: 0, target: "single" }
        ];
        break;
      case "ROGUE":
        this.skills = [
          { name: "Backstab", damage: 70, cost: 0, target: "single" },
          { name: "Poison Dagger", damage: 25, poison: 10, cost: 0, target: "single" }
        ];
        break;
      case "PALADIN":
        this.skills = [
          { name: "Holy Strike", damage: 45, cost: 0, target: "single" },
          { name: "Divine Shield", shield: 30, cost: 0, target: "self" }
        ];
        break;
      case "RANGER":
        this.skills = [
          { name: "Multi-Shot", damage: 30, cost: 0, target: "all" },
          { name: "Precise Shot", damage: 55, cost: 0, target: "single" }
        ];
        break;
      case "BERSERKER":
        this.skills = [
          { name: "Rage", damage: 80, selfDamage: 15, cost: 0, target: "single" },
          { name: "Cleave", damage: 40, cost: 0, target: "all" }
        ];
        break;
      case "NECROMANCER":
        this.skills = [
          { name: "Dark Bolt", damage: 65, cost: 0, target: "single" },
          { name: "Life Drain", damage: 40, heal: 20, cost: 0, target: "single" }
        ];
        break;
      case "BARD":
        this.skills = [
          { name: "Sonic Blast", damage: 35, cost: 0, target: "all" },
          { name: "Healing Song", heal: 25, cost: 0, target: "all_allies" }
        ];
        break;
    }
  }

  get atk() {
    let bonus = 0;
    if (this.equipment.weapon) bonus += this.equipment.weapon.stats.atk || 0;
    if (this.equipment.armor) bonus += this.equipment.armor.stats.atk || 0;
    if (this.equipment.accessory) bonus += this.equipment.accessory.stats.atk || 0;
    return this.baseAtk + bonus;
  }

  get def() {
    let bonus = 0;
    if (this.equipment.weapon) bonus += this.equipment.weapon.stats.def || 0;
    if (this.equipment.armor) bonus += this.equipment.armor.stats.def || 0;
    if (this.equipment.accessory) bonus += this.equipment.accessory.stats.def || 0;
    return this.baseDef + bonus;
  }

  get spd() {
    let bonus = 0;
    if (this.equipment.weapon) bonus += this.equipment.weapon.stats.spd || 0;
    if (this.equipment.armor) bonus += this.equipment.armor.stats.spd || 0;
    if (this.equipment.accessory) bonus += this.equipment.accessory.stats.spd || 0;
    return this.baseSpd + bonus;
  }

  takeDamage(amount) {
    const actualDamage = Math.max(1, amount - this.def);
    this.hp = Math.max(0, this.hp - actualDamage);
    if (this.hp <= 0) {
      this.alive = false;
    }
    return actualDamage;
  }

  heal(amount) {
    const oldHp = this.hp;
    this.hp = Math.min(this.maxHp, this.hp + amount);
    return this.hp - oldHp;
  }

  gainExp(amount) {
    this.exp += amount;
    while (this.exp >= this.expToLevel) {
      this.levelUp();
    }
  }

  levelUp() {
    this.level++;
    this.exp -= this.expToLevel;
    this.expToLevel = Math.floor(this.expToLevel * 1.5);
    
    // Stat increases
    const hpIncrease = 10 + Math.floor(Math.random() * 6);
    const atkIncrease = 2 + Math.floor(Math.random() * 3);
    const defIncrease = 1 + Math.floor(Math.random() * 3);
    const spdIncrease = Math.floor(Math.random() * 2);
    
    this.maxHp += hpIncrease;
    this.hp = this.maxHp;
    this.baseAtk += atkIncrease;
    this.baseDef += defIncrease;
    this.baseSpd += spdIncrease;
  }

  basicAttack(target) {
    const damage = this.atk + Math.floor(Math.random() * 5);
    return target.takeDamage(damage);
  }
}

export class Enemy {
  constructor(level, x, y, isBoss = false) {
    this.level = level;
    this.isBoss = isBoss;
    this.x = x;
    this.y = y;
    
    if (isBoss) {
      this.name = "Black Haze Guardian";
      this.maxHp = 300 + level * 100;
      this.atk = 25 + level * 8;
      this.def = 15 + level * 5;
      this.spd = 10 + level * 2;
      this.color = [50, 0, 50];
      this.expReward = 500;
      this.goldReward = 200;
    } else {
      const types = ["Goblin", "Skeleton", "Slime", "Orc", "Spider", "Bat", "Zombie"];
      this.name = types[Math.floor(Math.random() * types.length)];
      this.maxHp = 40 + level * 20 + Math.floor(Math.random() * 20);
      this.atk = 8 + level * 3 + Math.floor(Math.random() * 5);
      this.def = 3 + level * 2 + Math.floor(Math.random() * 3);
      this.spd = 5 + level * 1 + Math.floor(Math.random() * 3);
      this.color = [150 + Math.random() * 50, 50 + Math.random() * 50, 50 + Math.random() * 50];
      this.expReward = 30 + level * 10;
      this.goldReward = 10 + level * 5;
    }
    
    this.hp = this.maxHp;
    this.alive = true;
  }

  takeDamage(amount) {
    const actualDamage = Math.max(1, amount - this.def);
    this.hp = Math.max(0, this.hp - actualDamage);
    if (this.hp <= 0) {
      this.alive = false;
    }
    return actualDamage;
  }

  chooseAction(heroes) {
    // Simple AI: attack random living hero
    const livingHeroes = heroes.filter(h => h.alive);
    if (livingHeroes.length > 0) {
      const target = livingHeroes[Math.floor(Math.random() * livingHeroes.length)];
      const damage = this.atk + Math.floor(Math.random() * 5);
      return { type: "attack", target, damage };
    }
    return null;
  }
}

export class Item {
  constructor(level) {
    const types = ["Weapon", "Armor", "Accessory"];
    this.type = types[Math.floor(Math.random() * types.length)];
    this.level = level;
    this.name = this.generateName();
    this.stats = this.generateStats();
  }

  generateName() {
    const prefixes = ["Iron", "Steel", "Mythril", "Dragon", "Ancient", "Blessed", "Cursed"];
    const weaponNames = ["Sword", "Axe", "Bow", "Staff", "Dagger"];
    const armorNames = ["Plate", "Mail", "Robe", "Leather", "Chain"];
    const accessoryNames = ["Ring", "Amulet", "Bracelet", "Belt", "Cloak"];
    
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    let base;
    
    if (this.type === "Weapon") {
      base = weaponNames[Math.floor(Math.random() * weaponNames.length)];
    } else if (this.type === "Armor") {
      base = armorNames[Math.floor(Math.random() * armorNames.length)];
    } else {
      base = accessoryNames[Math.floor(Math.random() * accessoryNames.length)];
    }
    
    return `${prefix} ${base}`;
  }

  generateStats() {
    const stats = { hp: 0, atk: 0, def: 0, spd: 0 };
    const numStats = 1 + Math.floor(Math.random() * 2);
    const statKeys = Object.keys(stats);
    
    for (let i = 0; i < numStats; i++) {
      const statKey = statKeys[Math.floor(Math.random() * statKeys.length)];
      const value = Math.ceil(this.level * (2 + Math.random() * 3));
      stats[statKey] += value;
    }
    
    return stats;
  }
}