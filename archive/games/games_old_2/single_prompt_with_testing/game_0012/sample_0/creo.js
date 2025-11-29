// creo.js - Creo class and related functions

import { CREO_SPECIES, SKILLS } from './creo_data.js';
import { TYPE_CHART } from './globals.js';

export class Creo {
  constructor(speciesId, level = 5) {
    const species = CREO_SPECIES[speciesId];
    this.speciesId = speciesId;
    this.name = species.name;
    this.type = species.type;
    this.level = level;
    
    // Calculate stats based on level
    this.maxHp = Math.floor(species.baseStats.hp + (level * 2));
    this.hp = this.maxHp;
    this.atk = Math.floor(species.baseStats.atk + (level * 1.5));
    this.def = Math.floor(species.baseStats.def + (level * 1.5));
    this.spd = Math.floor(species.baseStats.spd + (level * 1.5));
    
    this.color = species.color;
    this.exp = 0;
    this.expToLevel = level * 10;
    
    // Learn skills based on level
    this.skills = [];
    const learnset = species.learnset;
    for (let learnLevel in learnset) {
      if (parseInt(learnLevel) <= level) {
        const skillId = learnset[learnLevel];
        if (SKILLS[skillId]) {
          this.skills.push(skillId);
        }
      }
    }
    
    // Ensure at least one skill
    if (this.skills.length === 0) {
      this.skills.push(Object.keys(learnset)[0]);
    }
    
    // Remove duplicates
    this.skills = [...new Set(this.skills)];
  }
  
  takeDamage(damage) {
    this.hp = Math.max(0, this.hp - damage);
    return this.hp <= 0;
  }
  
  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }
  
  gainExp(amount) {
    this.exp += amount;
    if (this.exp >= this.expToLevel) {
      this.levelUp();
      return true;
    }
    return false;
  }
  
  levelUp() {
    this.level++;
    this.exp = 0;
    this.expToLevel = this.level * 10;
    
    const species = CREO_SPECIES[this.speciesId];
    const oldMaxHp = this.maxHp;
    
    // Increase stats
    this.maxHp = Math.floor(species.baseStats.hp + (this.level * 2));
    this.atk = Math.floor(species.baseStats.atk + (this.level * 1.5));
    this.def = Math.floor(species.baseStats.def + (this.level * 1.5));
    this.spd = Math.floor(species.baseStats.spd + (this.level * 1.5));
    
    // Heal HP by amount gained
    this.hp += (this.maxHp - oldMaxHp);
    
    // Learn new skills
    const learnset = species.learnset;
    if (learnset[this.level]) {
      const newSkill = learnset[this.level];
      if (!this.skills.includes(newSkill)) {
        this.skills.push(newSkill);
      }
    }
  }
  
  isAlive() {
    return this.hp > 0;
  }
}

export function calculateDamage(attacker, defender, skillId) {
  const skill = SKILLS[skillId];
  if (!skill) return 0;
  
  // Base damage calculation
  let damage = Math.floor((attacker.atk / defender.def) * skill.power * 0.4);
  
  // Type effectiveness
  const effectiveness = getTypeEffectiveness(skill.type, defender.type);
  damage = Math.floor(damage * effectiveness);
  
  // Add some randomness (±10%)
  const randomFactor = 0.9 + Math.random() * 0.2;
  damage = Math.floor(damage * randomFactor);
  
  return Math.max(1, damage);
}

export function getTypeEffectiveness(attackType, defenseType) {
  if (TYPE_CHART[attackType] && TYPE_CHART[attackType][defenseType]) {
    return TYPE_CHART[attackType][defenseType];
  }
  return 1;
}

export function attemptCapture(creo) {
  // Capture rate based on HP percentage
  const hpPercent = creo.hp / creo.maxHp;
  const captureChance = 0.7 * (1 - hpPercent) + 0.15; // 15% to 85% based on HP
  
  return Math.random() < captureChance;
}