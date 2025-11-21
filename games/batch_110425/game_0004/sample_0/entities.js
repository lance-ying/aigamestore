// entities.js
import { gameState } from './globals.js';
import { JOB_TYPES } from './globals.js';

export class Adventurer {
  constructor(jobType, id) {
    this.id = id;
    this.jobType = jobType;
    this.baseHp = jobType.hp;
    this.baseAtk = jobType.atk;
    this.baseDef = jobType.def;
    this.currentHp = this.baseHp;
    this.equipment = { weapon: null, armor: null };
    this.level = 1;
  }
  
  getTotalAtk() {
    let total = this.baseAtk;
    if (this.equipment.weapon) total += this.equipment.weapon.atk;
    if (this.equipment.armor) total += this.equipment.armor.atk;
    return total;
  }
  
  getTotalDef() {
    let total = this.baseDef;
    if (this.equipment.weapon) total += this.equipment.weapon.def;
    if (this.equipment.armor) total += this.equipment.armor.def;
    return total;
  }
  
  getMaxHp() {
    return this.baseHp + (this.level - 1) * 10;
  }
  
  heal(amount) {
    this.currentHp = Math.min(this.currentHp + amount, this.getMaxHp());
  }
  
  takeDamage(amount) {
    const actualDamage = Math.max(1, amount - this.getTotalDef());
    this.currentHp = Math.max(0, this.currentHp - actualDamage);
    return this.currentHp <= 0;
  }
  
  equipItem(item) {
    if (item.def > item.atk) {
      this.equipment.armor = item;
    } else {
      this.equipment.weapon = item;
    }
  }
}

export class MazeNode {
  constructor(x, y, depth, type = "empty") {
    this.x = x;
    this.y = y;
    this.depth = depth;
    this.type = type; // "empty", "treasure", "enemy", "boss", "rest"
    this.connections = [];
    this.explored = false;
    this.cleared = false;
    this.reward = null;
    this.enemy = null;
    
    this.generateContent();
  }
  
  generateContent() {
    const rand = Math.random();
    if (this.depth % 5 === 0 && this.depth > 0) {
      this.type = "boss";
      this.enemy = { hp: 50 + this.depth * 20, atk: 10 + this.depth * 3, name: `Boss Lv${this.depth}` };
    } else if (rand < 0.3) {
      this.type = "treasure";
      this.reward = this.generateReward();
    } else if (rand < 0.7) {
      this.type = "enemy";
      this.enemy = { hp: 20 + this.depth * 5, atk: 5 + this.depth * 2, name: `Monster Lv${this.depth}` };
    } else if (rand < 0.85) {
      this.type = "rest";
    } else {
      this.type = "empty";
    }
  }
  
  generateReward() {
    const rewards = [
      { type: "material", material: "iron", amount: 10 + this.depth * 5 },
      { type: "material", material: "wood", amount: 10 + this.depth * 5 },
      { type: "material", material: "leather", amount: 8 + this.depth * 3 },
      { type: "material", material: "crystal", amount: 3 + this.depth * 2 },
      { type: "score", amount: 50 + this.depth * 20 }
    ];
    return rewards[Math.floor(Math.random() * rewards.length)];
  }
  
  addConnection(node) {
    if (!this.connections.includes(node)) {
      this.connections.push(node);
    }
  }
}

export class CraftingJob {
  constructor(recipe) {
    this.recipe = recipe;
    this.progress = 0;
    this.timeRequired = recipe.craftTime;
  }
  
  update(deltaTime) {
    this.progress += deltaTime;
    return this.progress >= this.timeRequired;
  }
  
  getProgress() {
    return Math.min(1, this.progress / this.timeRequired);
  }
}