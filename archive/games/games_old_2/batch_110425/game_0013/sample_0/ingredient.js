// ingredient.js - Ingredient item

import { INGREDIENT_DATA } from './globals.js';

export class Ingredient {
  constructor(type, quantity) {
    this.type = type;
    this.quantity = quantity;
    this.data = INGREDIENT_DATA[type];
  }
  
  use(amount = 1) {
    if (this.quantity >= amount) {
      this.quantity -= amount;
      return true;
    }
    return false;
  }
  
  add(amount) {
    this.quantity += amount;
  }
  
  render(p, x, y, scale = 1) {
    p.push();
    p.translate(x, y);
    p.scale(scale);
    
    // Draw ingredient based on category
    const category = this.data.category;
    
    switch(category) {
      case "base":
        p.fill(220, 180, 120);
        p.ellipse(0, 0, 30, 10);
        p.ellipse(0, -5, 30, 10);
        break;
      case "protein":
        if (this.type === "PATTY") {
          p.fill(120, 80, 60);
          p.ellipse(0, 0, 28, 8);
        } else if (this.type === "BACON") {
          p.fill(200, 100, 100);
          for (let i = 0; i < 3; i++) {
            p.rect(-12 + i * 8, -3, 6, 6, 2);
          }
        } else if (this.type === "EGG") {
          p.fill(255, 255, 200);
          p.ellipse(0, 0, 25, 20);
          p.fill(255, 200, 0);
          p.ellipse(0, 0, 10, 10);
        } else if (this.type === "FISH") {
          p.fill(220, 200, 150);
          p.beginShape();
          p.vertex(-12, 0);
          p.vertex(0, -8);
          p.vertex(12, 0);
          p.vertex(0, 8);
          p.endShape(p.CLOSE);
        }
        break;
      case "vegetable":
        if (this.type === "LETTUCE") {
          p.fill(100, 200, 100);
          for (let i = 0; i < 5; i++) {
            p.ellipse(-10 + i * 5, 0, 8, 8);
          }
        } else if (this.type === "TOMATO") {
          p.fill(255, 100, 100);
          p.ellipse(0, 0, 20, 16);
        } else if (this.type === "PICKLE") {
          p.fill(100, 180, 100);
          p.ellipse(0, 0, 20, 6);
        } else if (this.type === "ONION") {
          p.fill(240, 220, 200);
          p.ellipse(0, 0, 18, 18);
        } else if (this.type === "MUSHROOM") {
          p.fill(200, 180, 160);
          p.arc(0, 0, 20, 20, p.PI, p.TWO_PI);
          p.rect(-10, 0, 20, 8);
        } else if (this.type === "AVOCADO") {
          p.fill(150, 200, 100);
          p.ellipse(0, 0, 22, 18);
        }
        break;
      case "topping":
        p.fill(255, 200, 0);
        p.rect(-15, -3, 30, 6, 2);
        break;
      case "sauce":
        if (this.type === "KETCHUP") {
          p.fill(255, 80, 80);
        } else if (this.type === "MAYO") {
          p.fill(255, 255, 230);
        } else if (this.type === "TARTAR") {
          p.fill(255, 255, 200);
        }
        p.ellipse(0, 0, 25, 8);
        break;
    }
    
    p.pop();
  }
}