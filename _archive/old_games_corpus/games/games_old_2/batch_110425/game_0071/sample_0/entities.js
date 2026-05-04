// entities.js - Customer and Recipe entities

import { gameState, INGREDIENT_DATA, CUSTOMER_NAMES } from './globals.js';

export class Recipe {
  constructor(ingredients) {
    this.ingredients = ingredients.slice(0, 3); // Max 3 ingredients
    this.name = this.generateName();
    this.warmth = 0;
    this.comfort = 0;
    this.price = 0;
    this.popularity = 0;
    
    this.calculateStats();
  }
  
  generateName() {
    if (this.ingredients.length === 0) return "Empty Cup";
    
    const base = this.ingredients[0];
    if (this.ingredients.length === 1) {
      return base.charAt(0).toUpperCase() + base.slice(1);
    }
    
    // Create compound names
    const combinations = {
      "coffee-milk": "Latte",
      "coffee-milk-sugar": "Sweet Latte",
      "coffee-chocolate": "Mocha",
      "tea-milk": "Milk Tea",
      "tea-lemon": "Lemon Tea",
      "tea-honey": "Honey Tea",
      "milk-vanilla": "Vanilla Milk",
      "milk-strawberry": "Strawberry Milk",
      "coffee-caramel": "Caramel Coffee",
      "coffee-cream": "Cream Coffee"
    };
    
    const key = this.ingredients.slice(0, 2).sort().join("-");
    const key3 = this.ingredients.sort().join("-");
    
    if (combinations[key3]) return combinations[key3];
    if (combinations[key]) return combinations[key];
    
    // Default naming
    return this.ingredients.join("-").split("-").map(w => 
      w.charAt(0).toUpperCase() + w.slice(1)
    ).join(" ");
  }
  
  calculateStats() {
    this.warmth = 0;
    this.comfort = 0;
    
    for (const ing of this.ingredients) {
      if (INGREDIENT_DATA[ing]) {
        this.warmth += INGREDIENT_DATA[ing].warmth;
        this.comfort += INGREDIENT_DATA[ing].comfort;
      }
    }
    
    // Base price calculation
    this.price = 10 + (this.warmth * 3) + (this.comfort * 3);
    this.popularity = Math.floor((this.warmth + this.comfort) / 2);
  }
}

export class Customer {
  constructor(id, p5Instance) {
    this.id = id;
    this.p = p5Instance;
    this.name = CUSTOMER_NAMES[Math.floor(this.p.random() * CUSTOMER_NAMES.length)];
    
    // Preferences
    this.preferredWarmth = Math.floor(this.p.random(2, 8));
    this.preferredComfort = Math.floor(this.p.random(2, 8));
    this.patience = Math.floor(this.p.random(300, 600)); // frames
    
    this.waitTime = 0;
    this.served = false;
    this.servedItem = null;
    this.satisfaction = 0;
    this.isRegular = false;
    
    // Visual
    this.x = 50;
    this.y = 100 + (id % 4) * 60;
    this.color = [
      Math.floor(this.p.random(100, 255)),
      Math.floor(this.p.random(100, 255)),
      Math.floor(this.p.random(100, 255))
    ];
  }
  
  update() {
    if (!this.served) {
      this.waitTime++;
    }
  }
  
  isImpatient() {
    return this.waitTime > this.patience;
  }
  
  serve(recipe) {
    if (this.served) return 0;
    
    this.served = true;
    this.servedItem = recipe.name;
    
    // Calculate satisfaction based on match
    const warmthDiff = Math.abs(recipe.warmth - this.preferredWarmth);
    const comfortDiff = Math.abs(recipe.comfort - this.preferredComfort);
    
    const matchScore = Math.max(0, 10 - warmthDiff - comfortDiff);
    this.satisfaction = Math.floor(matchScore * 10);
    
    // Bonus for quick service
    if (this.waitTime < this.patience * 0.5) {
      this.satisfaction += 20;
    }
    
    // Check if becomes regular
    if (this.satisfaction >= 80 && this.p.random() < 0.3) {
      this.isRegular = true;
    }
    
    return this.satisfaction;
  }
  
  draw(p) {
    p.push();
    
    // Draw customer icon
    p.fill(...this.color);
    p.stroke(0);
    p.strokeWeight(2);
    p.ellipse(this.x, this.y, 30, 30);
    
    // Eyes
    p.fill(255);
    p.noStroke();
    p.ellipse(this.x - 6, this.y - 3, 8, 8);
    p.ellipse(this.x + 6, this.y - 3, 8, 8);
    p.fill(0);
    p.ellipse(this.x - 6, this.y - 3, 4, 4);
    p.ellipse(this.x + 6, this.y - 3, 4, 4);
    
    // Patience bar
    const patiencePercent = 1 - (this.waitTime / this.patience);
    const barWidth = 30;
    const barHeight = 4;
    
    p.fill(50);
    p.noStroke();
    p.rect(this.x - barWidth/2, this.y + 20, barWidth, barHeight);
    
    p.fill(patiencePercent > 0.5 ? [0, 255, 0] : patiencePercent > 0.25 ? [255, 255, 0] : [255, 0, 0]);
    p.rect(this.x - barWidth/2, this.y + 20, barWidth * Math.max(0, patiencePercent), barHeight);
    
    // Regular badge
    if (this.isRegular) {
      p.fill(255, 215, 0);
      p.stroke(0);
      p.strokeWeight(1);
      p.star(this.x + 15, this.y - 15, 3, 6, 5);
    }
    
    p.pop();
  }
}

// Helper function to draw star
if (typeof window !== 'undefined' && window.p5) {
  window.p5.prototype.star = function(x, y, radius1, radius2, npoints) {
    let angle = -Math.PI / 2;
    let angleStep = Math.PI / npoints;
    
    this.beginShape();
    for (let i = 0; i < npoints * 2; i++) {
      let r = (i % 2 === 0) ? radius1 : radius2;
      let sx = x + Math.cos(angle) * r;
      let sy = y + Math.sin(angle) * r;
      this.vertex(sx, sy);
      angle += angleStep;
    }
    this.endShape(this.CLOSE);
  };
}