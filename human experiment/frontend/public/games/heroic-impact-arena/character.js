// character.js - Character and ability classes

import { ELEMENT_TYPE, STATUS_EFFECT } from './globals.js';

export class Character {
  constructor(id, name, type, maxHP, power, defense, x, y, isPlayer = true) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.maxHP = maxHP;
    this.currentHP = maxHP;
    this.power = power;
    this.defense = defense;
    this.x = x;
    this.y = y;
    this.isPlayer = isPlayer;
    this.abilities = [];
    this.activeStatusEffects = [];
    this.isDefeated = false;
    this.hasActed = false;
  }

  takeDamage(damage) {
    this.currentHP -= damage;
    if (this.currentHP <= 0) {
      this.currentHP = 0;
      this.isDefeated = true;
    }
  }

  heal(amount) {
    this.currentHP = Math.min(this.currentHP + amount, this.maxHP);
  }

  addStatusEffect(effect) {
    this.activeStatusEffects.push(effect);
  }

  updateStatusEffects() {
    for (let i = this.activeStatusEffects.length - 1; i >= 0; i--) {
      const effect = this.activeStatusEffects[i];
      effect.duration--;
      
      if (effect.type === STATUS_EFFECT.HEAL_OVER_TIME) {
        this.heal(effect.value);
      }
      
      if (effect.duration <= 0) {
        this.activeStatusEffects.splice(i, 1);
      }
    }
  }

  hasStatusEffect(effectType) {
    return this.activeStatusEffects.some(e => e.type === effectType);
  }

  updateAbilityCooldowns() {
    this.abilities.forEach(ability => {
      if (ability.currentCooldown > 0) {
        ability.currentCooldown--;
      }
    });
  }

  resetTurn() {
    this.hasActed = false;
  }
}

export class Ability {
  constructor(name, damage, cooldown, targetType, abilityType = 'ATTACK', elementalType = ELEMENT_TYPE.NONE, statusEffect = null) {
    this.name = name;
    this.damage = damage;
    this.healValue = damage; // For heal abilities
    this.cooldown = cooldown;
    this.currentCooldown = 0;
    this.targetType = targetType; // 'SINGLE', 'SELF', 'ALL_ENEMIES'
    this.abilityType = abilityType; // 'ATTACK', 'HEAL', 'BUFF', 'DEBUFF'
    this.elementalType = elementalType;
    this.statusEffect = statusEffect;
  }

  isAvailable() {
    return this.currentCooldown === 0;
  }

  use() {
    this.currentCooldown = this.cooldown;
  }
}

export function calculateDamage(attacker, defender, ability, p) {
  let baseDamage = Math.max(1, attacker.power + ability.damage - defender.defense);
  
  // Apply elemental multiplier
  const multiplier = getElementalMultiplier(ability.elementalType, defender.type);
  baseDamage *= multiplier;
  
  // Apply defense up status
  if (defender.hasStatusEffect(STATUS_EFFECT.DEFENSE_UP)) {
    baseDamage *= 0.7;
  }
  
  // Random variance
  const variance = 1 + p.random(-0.1, 0.1);
  const finalDamage = Math.floor(baseDamage * variance);
  
  return Math.max(1, finalDamage);
}

export function getElementalMultiplier(attackType, defenseType) {
  if (attackType === ELEMENT_TYPE.NONE || defenseType === ELEMENT_TYPE.NONE) {
    return 1.0;
  }
  
  // Fire > Nature > Water > Fire
  if (attackType === ELEMENT_TYPE.FIRE && defenseType === ELEMENT_TYPE.NATURE) return 1.5;
  if (attackType === ELEMENT_TYPE.NATURE && defenseType === ELEMENT_TYPE.WATER) return 1.5;
  if (attackType === ELEMENT_TYPE.WATER && defenseType === ELEMENT_TYPE.FIRE) return 1.5;
  
  if (attackType === ELEMENT_TYPE.FIRE && defenseType === ELEMENT_TYPE.WATER) return 0.5;
  if (attackType === ELEMENT_TYPE.WATER && defenseType === ELEMENT_TYPE.NATURE) return 0.5;
  if (attackType === ELEMENT_TYPE.NATURE && defenseType === ELEMENT_TYPE.FIRE) return 0.5;
  
  return 1.0;
}