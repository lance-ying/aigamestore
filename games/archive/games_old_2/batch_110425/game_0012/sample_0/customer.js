// customer.js - Customer entity and behavior

import { gameState, MOODS } from './globals.js';

let customerIdCounter = 0;

export class Customer {
  constructor(p, x, y) {
    this.p = p;
    this.id = customerIdCounter++;
    this.x = x;
    this.y = y;
    this.mood = MOODS[Math.floor(p.random() * MOODS.length)];
    this.patience = 600; // frames (10 seconds)
    this.maxPatience = 600;
    this.satisfied = false;
    this.orderTaken = false;
    this.preferredQuality = Math.floor(p.random() * 3) + 2; // 2-4
    this.payment = 0;
    this.served = false;
    
    // Visual properties
    this.size = 25;
    this.color = this.getMoodColor();
  }
  
  getMoodColor() {
    switch(this.mood) {
      case 'happy': return [255, 200, 100];
      case 'neutral': return [200, 200, 200];
      case 'sad': return [150, 150, 200];
      case 'energetic': return [255, 100, 100];
      case 'tired': return [150, 150, 150];
      default: return [200, 200, 200];
    }
  }
  
  update() {
    if (!this.served && this.patience > 0) {
      this.patience--;
      
      // Leave if patience runs out
      if (this.patience <= 0) {
        this.leave();
      }
    }
  }
  
  serve(recipe) {
    this.orderTaken = true;
    this.served = true;
    
    // Calculate satisfaction based on recipe quality vs preference
    const qualityMatch = recipe.quality >= this.preferredQuality;
    const basePayment = recipe.price;
    
    if (qualityMatch) {
      this.satisfied = true;
      this.payment = Math.floor(basePayment * 1.2);
      gameState.reputation += 2;
    } else {
      this.satisfied = false;
      this.payment = Math.floor(basePayment * 0.8);
      gameState.reputation += 1;
    }
    
    // Bonus for fast service
    if (this.patience > this.maxPatience * 0.7) {
      this.payment = Math.floor(this.payment * 1.1);
      gameState.reputation += 1;
    }
    
    gameState.money += this.payment;
    gameState.totalRevenue += this.payment;
    gameState.totalCustomersServed++;
    
    // Schedule removal
    this.removeTimer = 60;
  }
  
  leave() {
    // Remove customer
    const index = gameState.customers.indexOf(this);
    if (index > -1) {
      gameState.customers.splice(index, 1);
    }
  }
  
  render() {
    const p = this.p;
    
    p.push();
    
    // Draw customer body
    p.fill(...this.color);
    p.stroke(0);
    p.strokeWeight(2);
    p.circle(this.x, this.y - 10, this.size);
    
    // Draw body
    p.rect(this.x - 8, this.y, 16, 20, 5);
    
    // Draw patience bar
    const patiencePercent = this.patience / this.maxPatience;
    const barWidth = 30;
    const barHeight = 4;
    
    p.noStroke();
    p.fill(50);
    p.rect(this.x - barWidth/2, this.y - 30, barWidth, barHeight);
    
    p.fill(patiencePercent > 0.5 ? [100, 255, 100] : patiencePercent > 0.25 ? [255, 200, 100] : [255, 100, 100]);
    p.rect(this.x - barWidth/2, this.y - 30, barWidth * patiencePercent, barHeight);
    
    // Draw mood indicator
    if (this.satisfied) {
      p.fill(100, 255, 100);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(16);
      p.text('😊', this.x, this.y - 45);
    }
    
    p.pop();
  }
}

export function spawnCustomer(p) {
  if (gameState.customers.length < gameState.maxCustomers) {
    const x = 50 + Math.floor(p.random() * 100);
    const y = 100 + Math.floor(p.random() * 200);
    const customer = new Customer(p, x, y);
    gameState.customers.push(customer);
    gameState.entities.push(customer);
  }
}

export function updateCustomers() {
  for (let i = gameState.customers.length - 1; i >= 0; i--) {
    const customer = gameState.customers[i];
    customer.update();
    
    if (customer.removeTimer !== undefined) {
      customer.removeTimer--;
      if (customer.removeTimer <= 0) {
        gameState.customers.splice(i, 1);
        const entityIndex = gameState.entities.indexOf(customer);
        if (entityIndex > -1) {
          gameState.entities.splice(entityIndex, 1);
        }
      }
    }
  }
}