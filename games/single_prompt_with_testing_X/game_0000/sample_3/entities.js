// entities.js - Entity classes and creation functions

import { gameState } from './globals.js';

export class Enemy {
  constructor(name, level, hp, attack, defense, goldReward, expReward, isBoss = false) {
    this.name = name;
    this.level = level;
    this.maxHp = hp;
    this.hp = hp;
    this.attack = attack;
    this.defense = defense;
    this.goldReward = goldReward;
    this.expReward = expReward;
    this.isBoss = isBoss;
  }
  
  takeDamage(damage) {
    const actualDamage = Math.max(1, damage - this.defense);
    this.hp -= actualDamage;
    return actualDamage;
  }
  
  isAlive() {
    return this.hp > 0;
  }
  
  getAttackDamage() {
    return this.attack;
  }
}

export class Equipment {
  constructor(name, type, rarity, stats) {
    this.name = name;
    this.type = type; // weapon, armor, accessory
    this.rarity = rarity; // 1-5 stars
    this.stats = stats; // { attack: X, defense: Y, maxHp: Z }
  }
  
  getPowerScore() {
    return (this.stats.attack || 0) + (this.stats.defense || 0) + (this.stats.maxHp || 0) * 0.1;
  }
}

export function createEnemy(zone) {
  const baseHp = 50 + zone * 30;
  const baseAttack = 5 + zone * 3;
  const baseDefense = 2 + zone * 2;
  
  const enemyTypes = [
    { name: "Goblin", hpMult: 1.0, atkMult: 1.0, defMult: 1.0 },
    { name: "Skeleton", hpMult: 0.8, atkMult: 1.2, defMult: 0.9 },
    { name: "Orc", hpMult: 1.3, atkMult: 0.9, defMult: 1.1 },
    { name: "Dark Knight", hpMult: 1.1, atkMult: 1.1, defMult: 1.2 },
    { name: "Shadow Beast", hpMult: 0.9, atkMult: 1.3, defMult: 0.8 }
  ];
  
  const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
  
  return new Enemy(
    `${type.name} Lv.${zone}`,
    zone,
    Math.floor(baseHp * type.hpMult),
    Math.floor(baseAttack * type.atkMult),
    Math.floor(baseDefense * type.defMult),
    20 + zone * 10,
    15 + zone * 8,
    false
  );
}

export function createBoss(zone) {
  const bossNames = [
    "Goblin King",
    "Ancient Lich",
    "Warlord Grommash",
    "Dragon Tyrant",
    "Demon Lord"
  ];
  
  const name = zone <= 5 ? bossNames[zone - 1] : `Ultimate Boss Lv.${zone}`;
  
  return new Enemy(
    name,
    zone,
    200 + zone * 100,
    15 + zone * 8,
    10 + zone * 5,
    100 + zone * 50,
    80 + zone * 40,
    true
  );
}

export function generateEquipment(zone) {
  const types = ["weapon", "armor", "accessory"];
  const type = types[Math.floor(Math.random() * types.length)];
  
  const rarityRoll = Math.random();
  let rarity;
  if (rarityRoll < 0.5) rarity = 1;
  else if (rarityRoll < 0.75) rarity = 2;
  else if (rarityRoll < 0.90) rarity = 3;
  else if (rarityRoll < 0.97) rarity = 4;
  else rarity = 5;
  
  const basePower = 5 + zone * 3;
  const rarityBonus = rarity * 5;
  
  const stats = {};
  if (type === "weapon") {
    stats.attack = Math.floor((basePower + rarityBonus) * (0.8 + Math.random() * 0.4));
  } else if (type === "armor") {
    stats.defense = Math.floor((basePower + rarityBonus) * 0.6 * (0.8 + Math.random() * 0.4));
    stats.maxHp = Math.floor((basePower + rarityBonus) * 2 * (0.8 + Math.random() * 0.4));
  } else {
    stats.attack = Math.floor((basePower + rarityBonus) * 0.4 * (0.8 + Math.random() * 0.4));
    stats.defense = Math.floor((basePower + rarityBonus) * 0.4 * (0.8 + Math.random() * 0.4));
    stats.maxHp = Math.floor((basePower + rarityBonus) * 1.5 * (0.8 + Math.random() * 0.4));
  }
  
  const names = {
    weapon: ["Sword", "Axe", "Spear", "Blade", "Hammer"],
    armor: ["Plate", "Mail", "Guard", "Shell", "Aegis"],
    accessory: ["Ring", "Amulet", "Talisman", "Charm", "Relic"]
  };
  
  const nameList = names[type];
  const baseName = nameList[Math.floor(Math.random() * nameList.length)];
  const rarityPrefix = ["Common", "Rare", "Epic", "Legendary", "Mythic"][rarity - 1];
  
  return new Equipment(`${rarityPrefix} ${baseName}`, type, rarity, stats);
}