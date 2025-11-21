// entities.js - Game entities (shelves, customers, staff, products)

import { gameState, GRID_SIZE, PRODUCT_TYPES } from './globals.js';

export class Shelf {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.products = [];
    this.maxProducts = 6;
    this.productType = null;
  }

  addProduct(productType) {
    if (this.products.length < this.maxProducts) {
      if (!this.productType) {
        this.productType = productType;
      }
      if (this.productType === productType) {
        this.products.push(new Product(productType, this.x, this.y));
        return true;
      }
    }
    return false;
  }

  removeProduct() {
    return this.products.shift();
  }

  isFull() {
    return this.products.length >= this.maxProducts;
  }

  isEmpty() {
    return this.products.length === 0;
  }
}

export class Product {
  constructor(type, shelfX, shelfY) {
    this.type = type;
    this.shelfX = shelfX;
    this.shelfY = shelfY;
    this.data = PRODUCT_TYPES[type];
  }
}

export class Customer {
  constructor(p) {
    this.p = p;
    this.x = gameState.entrancePos.x * GRID_SIZE + GRID_SIZE / 2;
    this.y = gameState.entrancePos.y * GRID_SIZE + GRID_SIZE / 2;
    this.gridX = gameState.entrancePos.x;
    this.gridY = gameState.entrancePos.y;
    this.state = "entering"; // entering, browsing, checkout, leaving
    this.targetShelf = null;
    this.path = [];
    this.pathIndex = 0;
    this.speed = 0.5;
    this.desiredProduct = this.chooseDesiredProduct();
    this.hasPurchased = false;
    this.patience = 300 + p.random(200);
    this.originalPatience = this.patience;
    this.satisfaction = 100;
  }

  chooseDesiredProduct() {
    const available = gameState.unlockedProducts.filter(p => p);
    if (available.length === 0) return "ONIGIRI";
    return available[Math.floor(this.p.random() * available.length)];
  }

  update() {
    this.patience -= gameState.timeScale;

    if (this.patience <= 0 && !this.hasPurchased) {
      this.state = "leaving";
      this.satisfaction = 0;
    }

    switch (this.state) {
      case "entering":
        this.moveTowardTarget(gameState.entrancePos.x + 2, gameState.entrancePos.y);
        if (this.atTarget()) {
          this.state = "browsing";
          this.findProductShelf();
        }
        break;

      case "browsing":
        if (this.targetShelf) {
          this.moveTowardTarget(this.targetShelf.x, this.targetShelf.y);
          if (this.atTarget()) {
            if (!this.targetShelf.isEmpty()) {
              const product = this.targetShelf.removeProduct();
              gameState.money += product.data.price;
              gameState.totalRevenue += product.data.price;
              gameState.score += product.data.price;
              this.hasPurchased = true;
              this.satisfaction = Math.min(100, 50 + (this.patience / this.originalPatience) * 50);
              this.state = "checkout";
            } else {
              this.findProductShelf();
              if (!this.targetShelf) {
                this.state = "leaving";
                this.satisfaction = 20;
              }
            }
          }
        } else {
          this.state = "leaving";
          this.satisfaction = 10;
        }
        break;

      case "checkout":
        this.moveTowardTarget(gameState.cashRegisterPos.x - 1, gameState.cashRegisterPos.y);
        if (this.atTarget()) {
          this.state = "leaving";
        }
        break;

      case "leaving":
        this.moveTowardTarget(gameState.entrancePos.x, gameState.entrancePos.y);
        if (this.atTarget()) {
          this.remove();
        }
        break;
    }
  }

  findProductShelf() {
    const shelves = gameState.shelves.filter(s => 
      s.productType === this.desiredProduct && !s.isEmpty()
    );
    
    if (shelves.length > 0) {
      // Find closest shelf
      let closest = shelves[0];
      let minDist = this.distToShelf(closest);
      for (let shelf of shelves) {
        const dist = this.distToShelf(shelf);
        if (dist < minDist) {
          minDist = dist;
          closest = shelf;
        }
      }
      this.targetShelf = closest;
    } else {
      this.targetShelf = null;
    }
  }

  distToShelf(shelf) {
    const dx = shelf.x - this.gridX;
    const dy = shelf.y - this.gridY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  moveTowardTarget(targetX, targetY) {
    const targetPixelX = targetX * GRID_SIZE + GRID_SIZE / 2;
    const targetPixelY = targetY * GRID_SIZE + GRID_SIZE / 2;

    const dx = targetPixelX - this.x;
    const dy = targetPixelY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 1) {
      const moveSpeed = this.speed * gameState.timeScale;
      this.x += (dx / dist) * moveSpeed;
      this.y += (dy / dist) * moveSpeed;
      this.gridX = Math.floor(this.x / GRID_SIZE);
      this.gridY = Math.floor(this.y / GRID_SIZE);
    }
  }

  atTarget() {
    if (!this.targetShelf && this.state === "browsing") return false;
    
    let targetX, targetY;
    if (this.state === "entering") {
      targetX = gameState.entrancePos.x + 2;
      targetY = gameState.entrancePos.y;
    } else if (this.state === "browsing") {
      targetX = this.targetShelf.x;
      targetY = this.targetShelf.y;
    } else if (this.state === "checkout") {
      targetX = gameState.cashRegisterPos.x - 1;
      targetY = gameState.cashRegisterPos.y;
    } else if (this.state === "leaving") {
      targetX = gameState.entrancePos.x;
      targetY = gameState.entrancePos.y;
    }

    const targetPixelX = targetX * GRID_SIZE + GRID_SIZE / 2;
    const targetPixelY = targetY * GRID_SIZE + GRID_SIZE / 2;
    const dist = Math.sqrt((this.x - targetPixelX) ** 2 + (this.y - targetPixelY) ** 2);
    return dist < 2;
  }

  remove() {
    const index = gameState.customers.indexOf(this);
    if (index > -1) {
      gameState.customers.splice(index, 1);
    }
    
    // Update customer satisfaction
    if (this.hasPurchased) {
      gameState.customerSatisfaction = Math.min(100, gameState.customerSatisfaction + 0.5);
    } else {
      gameState.customerSatisfaction = Math.max(0, gameState.customerSatisfaction - 2);
    }
  }

  render(p) {
    p.push();
    
    // Customer body
    const hue = this.hasPurchased ? 120 : (this.patience / this.originalPatience) * 60;
    p.fill(hue, 180, 200);
    p.noStroke();
    p.circle(this.x, this.y, 12);
    
    // Head
    p.fill(255, 220, 180);
    p.circle(this.x, this.y - 8, 8);
    
    // Patience indicator
    if (this.patience < this.originalPatience * 0.5 && !this.hasPurchased) {
      p.fill(255, 0, 0);
      p.circle(this.x, this.y - 15, 4);
    }
    
    p.pop();
  }
}

export class Staff {
  constructor(p) {
    this.p = p;
    this.x = gameState.entrancePos.x * GRID_SIZE + GRID_SIZE / 2;
    this.y = gameState.entrancePos.y * GRID_SIZE + GRID_SIZE / 2;
    this.gridX = gameState.entrancePos.x;
    this.gridY = gameState.entrancePos.y;
    this.state = "idle"; // idle, stocking, moving
    this.targetShelf = null;
    this.speed = 0.7;
    this.efficiency = 0.5 + p.random(0.3);
    this.experience = 0;
    this.stockingProgress = 0;
    this.color = [100 + p.random(100), 100 + p.random(100), 200 + p.random(55)];
  }

  update() {
    this.experience += 0.01 * gameState.timeScale;
    this.efficiency = Math.min(1.5, 0.5 + this.experience * 0.01);

    switch (this.state) {
      case "idle":
        this.findShelfToStock();
        break;

      case "moving":
        if (this.targetShelf) {
          this.moveTowardTarget(this.targetShelf.x, this.targetShelf.y);
          if (this.atTarget()) {
            this.state = "stocking";
            this.stockingProgress = 0;
          }
        } else {
          this.state = "idle";
        }
        break;

      case "stocking":
        if (this.targetShelf && this.targetShelf.productType) {
          this.stockingProgress += this.efficiency * gameState.timeScale;
          if (this.stockingProgress >= 60) {
            if (!this.targetShelf.isFull()) {
              const productType = this.targetShelf.productType;
              const cost = PRODUCT_TYPES[productType].cost;
              if (gameState.money >= cost) {
                gameState.money -= cost;
                this.targetShelf.addProduct(productType);
              }
            }
            this.stockingProgress = 0;
            if (this.targetShelf.isFull()) {
              this.targetShelf = null;
              this.state = "idle";
            }
          }
        } else {
          this.state = "idle";
          this.targetShelf = null;
        }
        break;
    }
  }

  findShelfToStock() {
    const shelves = gameState.shelves.filter(s => 
      s.productType && !s.isFull()
    );

    if (shelves.length > 0) {
      let closest = shelves[0];
      let minDist = this.distToShelf(closest);
      for (let shelf of shelves) {
        const dist = this.distToShelf(shelf);
        if (dist < minDist) {
          minDist = dist;
          closest = shelf;
        }
      }
      this.targetShelf = closest;
      this.state = "moving";
    }
  }

  distToShelf(shelf) {
    const dx = shelf.x - this.gridX;
    const dy = shelf.y - this.gridY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  moveTowardTarget(targetX, targetY) {
    const targetPixelX = targetX * GRID_SIZE + GRID_SIZE / 2;
    const targetPixelY = targetY * GRID_SIZE + GRID_SIZE / 2;

    const dx = targetPixelX - this.x;
    const dy = targetPixelY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 1) {
      const moveSpeed = this.speed * gameState.timeScale;
      this.x += (dx / dist) * moveSpeed;
      this.y += (dy / dist) * moveSpeed;
      this.gridX = Math.floor(this.x / GRID_SIZE);
      this.gridY = Math.floor(this.y / GRID_SIZE);
    }
  }

  atTarget() {
    if (!this.targetShelf) return false;
    const targetPixelX = this.targetShelf.x * GRID_SIZE + GRID_SIZE / 2;
    const targetPixelY = this.targetShelf.y * GRID_SIZE + GRID_SIZE / 2;
    const dist = Math.sqrt((this.x - targetPixelX) ** 2 + (this.y - targetPixelY) ** 2);
    return dist < 3;
  }

  render(p) {
    p.push();
    
    // Staff body
    p.fill(...this.color);
    p.noStroke();
    p.circle(this.x, this.y, 12);
    
    // Head
    p.fill(255, 220, 180);
    p.circle(this.x, this.y - 8, 8);
    
    // Hat (uniform indicator)
    p.fill(50, 50, 150);
    p.rect(this.x - 5, this.y - 13, 10, 3);
    
    // Stocking indicator
    if (this.state === "stocking") {
      p.fill(0, 255, 0);
      p.circle(this.x + 8, this.y - 8, 5);
    }
    
    p.pop();
  }
}