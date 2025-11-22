// entities.js
import { gameState } from './globals.js';

export class Recipe {
  constructor(ingredients) {
    this.ingredients = [...ingredients];
    this.name = this.generateName();
    this.basePrice = this.calculatePrice();
    this.quality = this.calculateQuality();
    this.popularity = 0;
  }
  
  generateName() {
    const names = this.ingredients.map(ing => ing.name);
    if (names.length === 1) return names[0] + " Burger";
    if (names.length === 2) return names.join(" & ") + " Burger";
    return names.join(", ") + " Deluxe";
  }
  
  calculatePrice() {
    const sum = this.ingredients.reduce((acc, ing) => acc + ing.cost, 0);
    return Math.floor(sum * 2.5);
  }
  
  calculateQuality() {
    const tierSum = this.ingredients.reduce((acc, ing) => acc + ing.tier, 0);
    const varietyBonus = this.ingredients.length * 5;
    return Math.min(100, tierSum * 10 + varietyBonus);
  }
}

export class Staff {
  constructor(name, specialty) {
    this.name = name;
    this.specialty = specialty; // "cooking" or "serving"
    this.level = 1;
    this.experience = 0;
    this.speed = 1.0;
    this.salary = 10;
    this.workTimer = 0;
  }
  
  gainExperience(amount) {
    this.experience += amount;
    const expNeeded = this.level * 50;
    if (this.experience >= expNeeded) {
      this.levelUp();
    }
  }
  
  levelUp() {
    this.level++;
    this.experience = 0;
    this.speed += 0.2;
    this.salary += 5;
  }
  
  work(deltaTime) {
    this.workTimer += deltaTime * this.speed;
    if (this.workTimer >= 60) {
      this.workTimer = 0;
      return true;
    }
    return false;
  }
}

export class Customer {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.waiting = true;
    this.waitTime = 0;
    this.maxWaitTime = 300; // 5 seconds
    this.patience = 1.0;
    this.desiredQuality = Math.floor(Math.random() * 50) + 30;
    this.orderPlaced = false;
    this.served = false;
    this.payment = 0;
    this.satisfied = false;
  }
  
  update() {
    if (this.waiting && !this.served) {
      this.waitTime++;
      this.patience = Math.max(0, 1 - this.waitTime / this.maxWaitTime);
      
      if (this.waitTime >= this.maxWaitTime) {
        return "timeout";
      }
    }
    return "waiting";
  }
  
  serve(recipe) {
    if (this.served) return;
    
    this.served = true;
    
    const qualityMatch = recipe.quality >= this.desiredQuality ? 1.0 : 0.7;
    const patienceMultiplier = 0.5 + this.patience * 0.5;
    
    this.payment = Math.floor(recipe.basePrice * qualityMatch * patienceMultiplier);
    this.satisfied = recipe.quality >= this.desiredQuality && this.patience > 0.3;
    
    return this.payment;
  }
}

export function generateStaffApplicant() {
  const firstNames = ["Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Avery", "Quinn"];
  const lastNames = ["Smith", "Johnson", "Brown", "Garcia", "Miller", "Davis", "Wilson", "Moore"];
  const name = firstNames[Math.floor(Math.random() * firstNames.length)] + " " + 
               lastNames[Math.floor(Math.random() * lastNames.length)];
  const specialty = Math.random() > 0.5 ? "cooking" : "serving";
  return new Staff(name, specialty);
}

export function spawnCustomer() {
  const x = 550;
  const y = 200 + Math.random() * 100;
  return new Customer(x, y);
}