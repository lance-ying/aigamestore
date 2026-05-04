// entities.js - Game entities (shelves, customers, etc.)

import { gameState } from './globals.js';
import { TILE_SIZE, GRID_OFFSET_X, GRID_OFFSET_Y } from './globals.js';

export class Shelf {
  constructor(x, y, product) {
    this.x = x;
    this.y = y;
    this.product = product;
    this.capacity = 20;
    this.stock = 20;
    this.type = "shelf";
  }
  
  canRestock() {
    return this.stock < this.capacity;
  }
  
  restock(amount) {
    const restocked = Math.min(amount, this.capacity - this.stock);
    this.stock += restocked;
    return restocked;
  }
  
  sell() {
    if (this.stock > 0) {
      this.stock--;
      return true;
    }
    return false;
  }
}

export class Register {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.type = "register";
    this.queue = [];
  }
}

export class Customer {
  constructor(id, p) {
    this.id = id;
    this.x = GRID_OFFSET_X + TILE_SIZE * gameState.gridWidth / 2;
    this.y = GRID_OFFSET_Y + TILE_SIZE * gameState.gridHeight + 20;
    this.targetX = this.x;
    this.targetY = this.y;
    this.state = "shopping"; // "shopping", "checkout", "leaving"
    this.shoppingList = [];
    this.satisfaction = 80;
    this.patience = 100;
    this.timeInStore = 0;
    
    // Generate shopping list
    const numItems = Math.floor(p.random(1, 4));
    const availableProducts = gameState.shelves.filter(s => s.stock > 0);
    for (let i = 0; i < numItems && availableProducts.length > 0; i++) {
      const randomShelf = availableProducts[Math.floor(p.random(availableProducts.length))];
      this.shoppingList.push(randomShelf);
    }
    
    if (this.shoppingList.length > 0) {
      this.currentTarget = 0;
      this.targetX = GRID_OFFSET_X + this.shoppingList[0].x * TILE_SIZE + TILE_SIZE / 2;
      this.targetY = GRID_OFFSET_Y + this.shoppingList[0].y * TILE_SIZE + TILE_SIZE / 2;
    }
  }
  
  update(deltaTime, p) {
    this.timeInStore += deltaTime;
    this.patience -= deltaTime * 2;
    
    if (this.patience <= 0) {
      this.state = "leaving";
      this.satisfaction = Math.max(0, this.satisfaction - 30);
    }
    
    // Move towards target
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 2) {
      const speed = 60 * deltaTime;
      this.x += (dx / dist) * speed;
      this.y += (dy / dist) * speed;
    } else {
      // Reached target
      if (this.state === "shopping" && this.currentTarget < this.shoppingList.length) {
        const shelf = this.shoppingList[this.currentTarget];
        if (shelf.sell()) {
          gameState.money += shelf.product.price;
          gameState.totalProfit += shelf.product.profit;
          this.satisfaction += 5;
        } else {
          this.satisfaction -= 10;
        }
        
        this.currentTarget++;
        if (this.currentTarget >= this.shoppingList.length) {
          this.state = "checkout";
          // Find register
          const registers = gameState.shelves.filter(s => s.type === "register");
          if (registers.length > 0) {
            const reg = registers[0];
            this.targetX = GRID_OFFSET_X + reg.x * TILE_SIZE + TILE_SIZE / 2;
            this.targetY = GRID_OFFSET_Y + reg.y * TILE_SIZE + TILE_SIZE / 2;
          } else {
            this.state = "leaving";
          }
        } else {
          this.targetX = GRID_OFFSET_X + this.shoppingList[this.currentTarget].x * TILE_SIZE + TILE_SIZE / 2;
          this.targetY = GRID_OFFSET_Y + this.shoppingList[this.currentTarget].y * TILE_SIZE + TILE_SIZE / 2;
        }
      } else if (this.state === "checkout") {
        this.state = "leaving";
        this.targetY = GRID_OFFSET_Y + TILE_SIZE * gameState.gridHeight + 40;
      }
    }
    
    return this.state === "leaving" && Math.abs(this.y - this.targetY) < 5;
  }
}

export function spawnCustomer(p) {
  if (gameState.customers.length < 8 && gameState.shelves.length > 0) {
    const customer = new Customer(gameState.customers.length, p);
    gameState.customers.push(customer);
  }
}