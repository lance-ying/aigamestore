// hero.js - Hero class

import { STATUS_EFFECTS } from './globals.js';

export class Hero {
  constructor(name, maxHp, baseAttack, x, y) {
    this.name = name;
    this.maxHp = maxHp;
    this.hp = maxHp;
    this.baseAttack = baseAttack;
    this.shield = 0;
    this.level = 1;
    this.experience = 0;
    this.x = x;
    this.y = y;
    this.statusEffects = {};
    this.isPlayer = true;
  }
  
  takeDamage(amount) {
    if (this.shield > 0) {
      const blocked = Math.min(this.shield, amount);
      this.shield -= blocked;
      amount -= blocked;
    }
    
    this.hp = Math.max(0, this.hp - amount);
    return amount;
  }
  
  heal(amount) {
    const healed = Math.min(amount, this.maxHp - this.hp);
    this.hp += healed;
    return healed;
  }
  
  addShield(amount) {
    this.shield += amount;
  }
  
  addStatusEffect(effect, value, duration) {
    this.statusEffects[effect] = { value, duration };
  }
  
  updateStatusEffects() {
    for (const effect in this.statusEffects) {
      this.statusEffects[effect].duration--;
      if (this.statusEffects[effect].duration <= 0) {
        delete this.statusEffects[effect];
      }
    }
  }
  
  getAttackBonus() {
    let bonus = 0;
    if (this.statusEffects[STATUS_EFFECTS.POWER_UP]) {
      bonus += this.statusEffects[STATUS_EFFECTS.POWER_UP].value;
    }
    return bonus;
  }
  
  isDead() {
    return this.hp <= 0;
  }
  
  levelUp() {
    this.level++;
    this.maxHp += 10;
    this.hp = this.maxHp;
    this.baseAttack += 2;
  }
}

export function createHeroParty() {
  return [
    new Hero("Warrior", 80, 10, 150, 250),
    new Hero("Mage", 60, 12, 100, 280),
    new Hero("Cleric", 70, 8, 200, 280)
  ];
}