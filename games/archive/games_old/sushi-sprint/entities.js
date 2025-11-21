// entities.js - Game entity classes

import { gameState, RECIPES } from './globals.js';

export class Table {
  constructor(x, y, id) {
    this.x = x;
    this.y = y;
    this.id = id;
    this.occupied = false;
    this.customer = null;
    this.dirty = false;
  }
  
  draw(p) {
    p.push();
    // Table
    p.fill(139, 90, 60);
    p.stroke(100, 60, 40);
    p.strokeWeight(2);
    p.rect(this.x - 20, this.y - 20, 40, 40, 5);
    
    // Dirty indicator
    if (this.dirty) {
      p.fill(150, 150, 100, 150);
      p.noStroke();
      p.ellipse(this.x - 10, this.y - 10, 8, 8);
      p.ellipse(this.x + 5, this.y + 5, 6, 6);
    }
    
    // Occupied indicator
    if (this.occupied && !this.dirty) {
      p.fill(100, 200, 100, 100);
      p.noStroke();
      p.ellipse(this.x, this.y, 35, 35);
    }
    p.pop();
  }
  
  clean() {
    this.dirty = false;
  }
}

export class Customer {
  constructor(x, y, id, patienceMultiplier = 1.0) {
    this.x = x;
    this.y = y;
    this.id = id;
    this.state = "entering"; // entering, waitingForTable, seated, ordering, waitingForFood, eating, waitingToPay, leaving, left
    this.table = null;
    this.order = null;
    this.maxPatience = 600 * patienceMultiplier; // frames
    this.patience = this.maxPatience;
    this.satisfaction = 100;
    this.eatingTimer = 0;
    this.eatingDuration = 240; // 4 seconds
    this.targetX = x;
    this.targetY = y;
    this.speed = 1.5;
    this.color = [
      p5.prototype.random(100, 255),
      p5.prototype.random(100, 255),
      p5.prototype.random(100, 255)
    ];
  }
  
  assignTable(table) {
    this.table = table;
    this.targetX = table.x;
    this.targetY = table.y + 30;
    this.state = "seated";
    table.occupied = true;
    table.customer = this;
  }
  
  update(p) {
    // Move toward target
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = p.sqrt(dx * dx + dy * dy);
    
    if (dist > this.speed) {
      this.x += (dx / dist) * this.speed;
      this.y += (dy / dist) * this.speed;
    } else {
      this.x = this.targetX;
      this.y = this.targetY;
    }
    
    // State machine
    if (this.state === "entering" && dist < 2) {
      this.state = "waitingForTable";
    }
    
    if (this.state === "waitingForTable" || 
        this.state === "ordering" || 
        this.state === "waitingForFood" || 
        this.state === "waitingToPay") {
      this.patience -= 1;
      if (this.patience <= 0) {
        this.leave();
        return;
      }
    }
    
    if (this.state === "seated" && dist < 2) {
      this.state = "ordering";
      this.createOrder();
    }
    
    if (this.state === "eating") {
      this.eatingTimer++;
      if (this.eatingTimer >= this.eatingDuration) {
        this.state = "waitingToPay";
        this.patience = this.maxPatience * 0.5; // Reset some patience for payment
      }
    }
    
    if (this.state === "leaving") {
      this.targetX = -50;
      this.targetY = 200;
      if (this.x < -40) {
        this.state = "left";
      }
    }
  }
  
  createOrder() {
    const availableRecipes = gameState.unlockedRecipes.filter(recipeId => {
      const recipe = RECIPES[recipeId];
      return Object.entries(recipe.ingredients).every(([ing, amt]) => 
        gameState.ingredients[ing] >= amt
      );
    });
    
    if (availableRecipes.length > 0) {
      const recipeId = availableRecipes[Math.floor(p5.prototype.random(availableRecipes.length))];
      this.order = recipeId;
    } else {
      this.order = gameState.unlockedRecipes[0]; // Fallback
    }
  }
  
  serveFood() {
    this.state = "eating";
    this.eatingTimer = 0;
    this.satisfaction = Math.min(100, (this.patience / this.maxPatience) * 100 + 20);
  }
  
  collectPayment() {
    const recipe = RECIPES[this.order];
    const payment = recipe.price;
    const satisfactionBonus = this.satisfaction > 75 ? 25 : 0;
    const timeBonus = this.eatingTimer < 120 ? 10 : 0;
    
    gameState.gold += payment;
    gameState.score += 25 + satisfactionBonus + timeBonus;
    gameState.customersServed++;
    gameState.consecutiveServicesCombo++;
    
    // Apply combo multiplier
    if (gameState.consecutiveServicesCombo >= 3) {
      gameState.score += Math.floor((25 + satisfactionBonus + timeBonus) * 0.1);
    }
    
    // Reputation change
    const reputationChange = Math.floor(this.satisfaction / 10) - 5;
    gameState.reputation = Math.max(0, Math.min(2500, gameState.reputation + reputationChange));
    
    // Track daily stats
    gameState.dailySatisfactionTotal += this.satisfaction;
    gameState.dailyCustomersServed++;
    
    this.leave();
  }
  
  leave() {
    this.state = "leaving";
    if (this.table) {
      this.table.occupied = false;
      this.table.dirty = true;
      this.table.customer = null;
    }
    
    if (this.patience <= 0) {
      gameState.customersLeft++;
      gameState.consecutiveServicesCombo = 0;
      gameState.reputation = Math.max(0, gameState.reputation - 10);
    }
  }
  
  draw(p) {
    if (this.state === "left") return;
    
    p.push();
    
    // Body
    p.fill(...this.color);
    p.stroke(0);
    p.strokeWeight(1);
    p.ellipse(this.x, this.y - 10, 20, 30);
    
    // Head
    p.fill(255, 220, 180);
    p.ellipse(this.x, this.y - 25, 18, 18);
    
    // Patience bar
    if (this.state !== "eating" && this.state !== "entering" && this.state !== "leaving") {
      const barWidth = 30;
      const barHeight = 4;
      const patiencePercent = this.patience / this.maxPatience;
      
      p.fill(200, 50, 50);
      p.noStroke();
      p.rect(this.x - barWidth / 2, this.y - 40, barWidth, barHeight);
      
      p.fill(50, 200, 50);
      p.rect(this.x - barWidth / 2, this.y - 40, barWidth * patiencePercent, barHeight);
    }
    
    // Order bubble
    if (this.state === "ordering") {
      p.fill(255, 255, 255);
      p.stroke(0);
      p.strokeWeight(1);
      p.ellipse(this.x + 20, this.y - 40, 25, 25);
      p.fill(0);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(10);
      p.text("!", this.x + 20, this.y - 40);
    }
    
    // Waiting for food
    if (this.state === "waitingForFood") {
      p.fill(255, 200, 100);
      p.stroke(0);
      p.strokeWeight(1);
      p.ellipse(this.x + 20, this.y - 40, 25, 25);
      p.fill(0);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(10);
      p.text("...", this.x + 20, this.y - 40);
    }
    
    // Payment icon
    if (this.state === "waitingToPay") {
      p.fill(255, 215, 0);
      p.stroke(0);
      p.strokeWeight(1);
      p.ellipse(this.x + 20, this.y - 40, 20, 20);
      p.fill(0);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(12);
      p.text("$", this.x + 20, this.y - 40);
    }
    
    p.pop();
  }
}

export class KitchenStation {
  constructor(x, y, id, type) {
    this.x = x;
    this.y = y;
    this.id = id;
    this.type = type; // "sushiBar", "riceCooker"
    this.state = "idle"; // idle, preparing, ready
    this.currentRecipe = null;
    this.prepTimer = 0;
    this.prepDuration = 0;
    this.customer = null;
  }
  
  startPreparation(recipeId, customer) {
    const recipe = RECIPES[recipeId];
    
    // Check and consume ingredients
    let canPrepare = true;
    for (const [ing, amt] of Object.entries(recipe.ingredients)) {
      if (gameState.ingredients[ing] < amt) {
        canPrepare = false;
        break;
      }
    }
    
    if (!canPrepare) return false;
    
    // Consume ingredients
    for (const [ing, amt] of Object.entries(recipe.ingredients)) {
      gameState.ingredients[ing] -= amt;
    }
    
    this.state = "preparing";
    this.currentRecipe = recipeId;
    this.prepTimer = 0;
    this.prepDuration = recipe.prepTime;
    this.customer = customer;
    
    gameState.score += 5; // Small score for starting prep
    
    return true;
  }
  
  update() {
    if (this.state === "preparing") {
      this.prepTimer++;
      if (this.prepTimer >= this.prepDuration) {
        this.state = "ready";
        gameState.score += 50; // Dish prepared
      }
    }
  }
  
  serveDish() {
    if (this.state === "ready" && this.customer) {
      this.customer.serveFood();
      this.state = "idle";
      this.currentRecipe = null;
      this.customer = null;
      return true;
    }
    return false;
  }
  
  draw(p) {
    p.push();
    
    // Station base
    p.fill(100, 100, 120);
    p.stroke(60, 60, 80);
    p.strokeWeight(2);
    p.rect(this.x - 25, this.y - 25, 50, 50, 5);
    
    // Type indicator
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(10);
    p.text(this.type === "sushiBar" ? "SUSHI" : "RICE", this.x, this.y - 10);
    
    // State indicator
    if (this.state === "preparing") {
      // Progress bar
      const progress = this.prepTimer / this.prepDuration;
      p.fill(200, 100, 100);
      p.noStroke();
      p.rect(this.x - 20, this.y + 5, 40, 6);
      p.fill(100, 200, 100);
      p.rect(this.x - 20, this.y + 5, 40 * progress, 6);
      
      p.fill(255, 200, 100);
      p.textSize(8);
      p.text("COOKING", this.x, this.y + 18);
    } else if (this.state === "ready") {
      p.fill(100, 255, 100);
      p.noStroke();
      p.ellipse(this.x + 20, this.y - 35, 15, 15);
      p.fill(0);
      p.textSize(10);
      p.text("✓", this.x + 20, this.y - 35);
    }
    
    p.pop();
  }
}