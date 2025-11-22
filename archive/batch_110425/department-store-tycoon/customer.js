// customer.js - Customer entity and management

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Customer {
  constructor(p, isVIP = false) {
    this.isVIP = isVIP;
    this.x = p.random(50, CANVAS_WIDTH - 50);
    this.y = CANVAS_HEIGHT - 50;
    this.targetShop = null;
    this.state = 'wandering'; // wandering, moving, shopping, leaving
    this.stateTimer = 0;
    this.speed = this.isVIP ? 1.5 : 1.0;
    this.satisfaction = 50;
    this.shoppingTimer = 0;
    this.color = this.isVIP ? [255, 215, 0] : [100, 150, 200];
    this.size = this.isVIP ? 12 : 8;
    this.moneySpent = 0;
    this.requestType = null;
    this.requestFulfilled = false;
    
    // Assign a request
    this.assignRequest(p);
  }
  
  assignRequest(p) {
    const shopTypes = ['RESTAURANT', 'CINEMA', 'BOOKSTORE', 'CAFE', 'CLOTHING', 'ELECTRONICS'];
    this.requestType = shopTypes[Math.floor(p.random(shopTypes.length))];
  }
  
  update(p) {
    this.stateTimer++;
    
    switch (this.state) {
      case 'wandering':
        this.wander(p);
        break;
      case 'moving':
        this.moveToShop(p);
        break;
      case 'shopping':
        this.shop(p);
        break;
      case 'leaving':
        this.leave(p);
        break;
    }
  }
  
  wander(p) {
    // Look for a shop that matches request
    if (this.stateTimer > 60) {
      const matchingShops = gameState.shops.filter(s => s.type === this.requestType);
      
      if (matchingShops.length > 0) {
        this.targetShop = matchingShops[Math.floor(p.random(matchingShops.length))];
        this.state = 'moving';
        this.stateTimer = 0;
        this.requestFulfilled = true;
      } else if (this.stateTimer > 300) {
        // Leave if can't find requested shop after 5 seconds
        this.state = 'leaving';
        this.satisfaction -= 20;
        this.stateTimer = 0;
      }
    }
  }
  
  moveToShop(p) {
    if (!this.targetShop) {
      this.state = 'leaving';
      return;
    }
    
    const targetX = this.targetShop.x + this.targetShop.width / 2;
    const targetY = this.targetShop.y + this.targetShop.height / 2;
    
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < 5) {
      this.state = 'shopping';
      this.stateTimer = 0;
      this.shoppingTimer = 0;
    } else {
      this.x += (dx / dist) * this.speed;
      this.y += (dy / dist) * this.speed;
    }
  }
  
  shop(p) {
    this.shoppingTimer++;
    
    if (this.shoppingTimer >= 120) { // Shop for 2 seconds
      if (this.targetShop) {
        this.targetShop.serveCustomer();
        const earning = this.targetShop.revenue * (this.isVIP ? 2 : 1);
        gameState.money += earning;
        this.moneySpent += earning;
        
        if (this.requestFulfilled) {
          this.satisfaction += 30;
          gameState.satisfactionScore = Math.min(100, gameState.satisfactionScore + 2);
        } else {
          this.satisfaction += 10;
          gameState.satisfactionScore = Math.min(100, gameState.satisfactionScore + 1);
        }
      }
      
      gameState.totalCustomersServed++;
      this.state = 'leaving';
      this.stateTimer = 0;
    }
  }
  
  leave(p) {
    this.y += this.speed;
    if (this.y > CANVAS_HEIGHT + 20) {
      return true; // Mark for removal
    }
    return false;
  }
  
  render(p) {
    p.push();
    
    // Customer body
    p.fill(...this.color);
    p.stroke(0);
    p.strokeWeight(1);
    p.circle(this.x, this.y, this.size);
    
    // VIP crown
    if (this.isVIP) {
      p.fill(255, 215, 0);
      p.noStroke();
      p.triangle(
        this.x - 6, this.y - 6,
        this.x, this.y - 12,
        this.x + 6, this.y - 6
      );
    }
    
    // Request bubble (if not fulfilled and wandering)
    if (!this.requestFulfilled && this.state === 'wandering') {
      p.fill(255, 255, 255, 200);
      p.stroke(0);
      p.strokeWeight(1);
      p.rect(this.x - 15, this.y - 25, 30, 15, 3);
      p.fill(0);
      p.noStroke();
      p.textSize(6);
      p.textAlign(p.CENTER, p.CENTER);
      p.text('?', this.x, this.y - 17);
    }
    
    p.pop();
  }
}

export function spawnCustomer(p) {
  const isVIP = p.random() < gameState.vipChance;
  const customer = new Customer(p, isVIP);
  gameState.customers.push(customer);
  if (isVIP) {
    gameState.vipCustomers.push(customer);
  }
}

export function updateCustomers(p) {
  // Spawn new customers
  gameState.customerSpawnTimer++;
  if (gameState.customerSpawnTimer >= gameState.customerSpawnRate) {
    gameState.customerSpawnTimer = 0;
    if (gameState.customers.length < 20) { // Max 20 customers at once
      spawnCustomer(p);
    }
  }
  
  // Update existing customers
  for (let i = gameState.customers.length - 1; i >= 0; i--) {
    const customer = gameState.customers[i];
    customer.update(p);
    
    if (customer.leave(p) && customer.state === 'leaving') {
      gameState.customers.splice(i, 1);
      const vipIdx = gameState.vipCustomers.indexOf(customer);
      if (vipIdx !== -1) {
        gameState.vipCustomers.splice(vipIdx, 1);
      }
    }
  }
}

export function renderCustomers(p) {
  for (let customer of gameState.customers) {
    customer.render(p);
  }
}