// entities.js - Game entities

import { gameState, CUSTOMER_TYPES, CAFE_OFFSET_X, CAFE_OFFSET_Y, GRID_SIZE } from './globals.js';

export class Customer {
  constructor(p, type, x, y) {
    this.p = p;
    this.type = type;
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
    this.state = "entering"; // entering, ordering, waiting, leaving, satisfied
    this.order = null;
    this.orderTimer = 0;
    this.patienceTimer = type.patience;
    this.isRegular = false;
    this.visitCount = 1;
  }
  
  update() {
    // Move towards target
    if (this.state === "entering" || this.state === "leaving") {
      const dx = this.targetX - this.x;
      const dy = this.targetY - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 2) {
        this.x += (dx / dist) * 2;
        this.y += (dy / dist) * 2;
      } else {
        this.x = this.targetX;
        this.y = this.targetY;
        
        if (this.state === "entering") {
          this.state = "ordering";
          this.orderTimer = this.type.orderDelay;
        } else if (this.state === "leaving") {
          return true; // Customer left
        }
      }
    }
    
    // Order behavior
    if (this.state === "ordering") {
      this.orderTimer--;
      if (this.orderTimer <= 0) {
        this.placeOrder();
        this.state = "waiting";
      }
    }
    
    // Waiting behavior
    if (this.state === "waiting") {
      this.patienceTimer--;
      if (this.patienceTimer <= 0) {
        this.state = "leaving";
        this.targetX = -50;
        return false;
      }
    }
    
    return false;
  }
  
  placeOrder() {
    if (gameState.menu.length > 0) {
      const randomIndex = Math.floor(this.p.random() * gameState.menu.length);
      this.order = gameState.menu[randomIndex];
    }
  }
  
  serve() {
    if (this.state === "waiting" && this.order) {
      const revenue = this.order.price + this.type.tip;
      const popularityGain = Math.floor(this.order.price * 0.5) + (this.isRegular ? 5 : 0);
      
      gameState.money += revenue;
      gameState.popularity += popularityGain;
      gameState.score += revenue + popularityGain;
      
      // Check for regular status
      if (!this.isRegular && this.p.random() < 0.3) {
        this.isRegular = true;
        gameState.regulars++;
      }
      
      this.state = "satisfied";
      this.targetX = -50;
      this.state = "leaving";
      return true;
    }
    return false;
  }
  
  draw() {
    this.p.push();
    
    // Draw customer
    this.p.fill(...this.type.color);
    this.p.stroke(0);
    this.p.strokeWeight(2);
    this.p.ellipse(this.x, this.y, 20, 30);
    
    // Draw head
    this.p.fill(255, 220, 180);
    this.p.ellipse(this.x, this.y - 15, 15, 15);
    
    // Draw regular indicator
    if (this.isRegular) {
      this.p.fill(255, 215, 0);
      this.p.noStroke();
      this.p.ellipse(this.x, this.y - 25, 8, 8);
    }
    
    // Draw order bubble
    if (this.state === "waiting" && this.order) {
      this.p.fill(255, 255, 255, 200);
      this.p.stroke(0);
      this.p.strokeWeight(1);
      this.p.ellipse(this.x + 20, this.y - 20, 30, 30);
      
      this.p.fill(0);
      this.p.noStroke();
      this.p.textSize(8);
      this.p.textAlign(this.p.CENTER, this.p.CENTER);
      this.p.text(this.order.name.substring(0, 6), this.x + 20, this.y - 20);
      
      // Patience bar
      const patiencePercent = this.patienceTimer / this.type.patience;
      this.p.fill(255 * (1 - patiencePercent), 255 * patiencePercent, 0);
      this.p.rect(this.x - 10, this.y + 20, 20 * patiencePercent, 3);
    }
    
    this.p.pop();
  }
}

export class Furniture {
  constructor(name, x, y, width, height, atmosphere, color) {
    this.name = name;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.atmosphere = atmosphere;
    this.color = color;
  }
  
  draw(p) {
    p.push();
    p.fill(...this.color);
    p.stroke(50);
    p.strokeWeight(2);
    p.rect(
      CAFE_OFFSET_X + this.x * GRID_SIZE,
      CAFE_OFFSET_Y + this.y * GRID_SIZE,
      this.width * GRID_SIZE,
      this.height * GRID_SIZE,
      5
    );
    
    // Draw name
    p.fill(255);
    p.noStroke();
    p.textSize(8);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(
      this.name.substring(0, 3),
      CAFE_OFFSET_X + (this.x + this.width / 2) * GRID_SIZE,
      CAFE_OFFSET_Y + (this.y + this.height / 2) * GRID_SIZE
    );
    
    p.pop();
  }
}

export class Recipe {
  constructor(name, base, additions, price) {
    this.name = name;
    this.base = base;
    this.additions = additions;
    this.price = price;
  }
}