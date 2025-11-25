// entities.js - Game entities

import { INGREDIENT_TYPES, CARD_TYPES } from './globals.js';

export class Ingredient {
  constructor(type, level = 1) {
    this.type = type;
    this.level = level;
    this.baseValue = INGREDIENT_TYPES[type].baseValue;
  }
  
  getValue() {
    return this.baseValue * this.level;
  }
  
  getColor() {
    return INGREDIENT_TYPES[this.type].color;
  }
  
  getName() {
    return `${INGREDIENT_TYPES[this.type].name} Lv${this.level}`;
  }
}

export class Potion {
  constructor(ingredients) {
    this.ingredients = ingredients;
    this.quality = this.calculateQuality();
    this.basePrice = this.calculateBasePrice();
  }
  
  calculateQuality() {
    const totalLevels = this.ingredients.reduce((sum, ing) => sum + ing.level, 0);
    const avgLevel = totalLevels / this.ingredients.length;
    const variety = new Set(this.ingredients.map(i => i.type)).size;
    return Math.floor(avgLevel * 10 + variety * 5);
  }
  
  calculateBasePrice() {
    return this.ingredients.reduce((sum, ing) => sum + ing.getValue(), 0) + this.quality;
  }
  
  getName() {
    const types = this.ingredients.map(i => INGREDIENT_TYPES[i.type].name);
    return `${types.join("-")} Potion`;
  }
  
  getColor() {
    // Mix colors of ingredients
    const colors = this.ingredients.map(i => i.getColor());
    const r = colors.reduce((sum, c) => sum + c[0], 0) / colors.length;
    const g = colors.reduce((sum, c) => sum + c[1], 0) / colors.length;
    const b = colors.reduce((sum, c) => sum + c[2], 0) / colors.length;
    return [r, g, b];
  }
}

export class Customer {
  constructor(name, difficulty, budget, patience) {
    this.name = name;
    this.difficulty = difficulty; // 1-5
    this.budget = budget;
    this.patience = patience; // Max stress before leaving
    this.stress = 0;
    this.desiredPotion = null;
  }
  
  selectPotion(potions) {
    if (potions.length === 0) return null;
    // Prefer potions within budget
    const affordable = potions.filter(p => p.basePrice <= this.budget);
    if (affordable.length > 0) {
      return affordable[Math.floor(Math.random() * affordable.length)];
    }
    return potions[Math.floor(Math.random() * potions.length)];
  }
  
  getMaxPrice() {
    return Math.floor(this.budget * (1 + this.difficulty * 0.1));
  }
  
  getStartingStress() {
    return Math.floor(this.patience * 0.3);
  }
}

export class NegotiationCard {
  constructor(type) {
    this.type = type;
    this.data = CARD_TYPES[type];
  }
  
  getValue() {
    return this.data.value;
  }
  
  getStressReduce() {
    return this.data.stressReduce;
  }
  
  getColor() {
    return this.data.color;
  }
  
  getName() {
    return this.data.name;
  }
}