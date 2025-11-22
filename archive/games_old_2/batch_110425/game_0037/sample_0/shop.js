// shop.js - Shop entity and management

import { gameState, SHOP_TYPES } from './globals.js';

export class Shop {
  constructor(type, floorIndex, position) {
    const shopData = SHOP_TYPES[type];
    this.type = type;
    this.name = shopData.name;
    this.floorIndex = floorIndex;
    this.x = position;
    this.y = 0; // Will be set based on floor
    this.width = shopData.width;
    this.height = 40;
    this.color = shopData.color;
    this.appeal = shopData.appeal;
    this.revenue = shopData.revenue;
    this.customersServed = 0;
    this.revenueGenerated = 0;
    this.revenueTimer = 0;
    this.isActive = true;
  }
  
  update(p) {
    // Generate revenue over time
    this.revenueTimer++;
    if (this.revenueTimer >= 180) { // Every 3 seconds
      this.revenueTimer = 0;
      const earnings = this.revenue;
      this.revenueGenerated += earnings;
      gameState.money += earnings;
      gameState.revenue += earnings;
    }
  }
  
  render(p) {
    p.push();
    p.fill(...this.color);
    p.stroke(0);
    p.strokeWeight(2);
    p.rect(this.x, this.y, this.width, this.height, 5);
    
    // Shop name
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(8);
    p.text(this.name, this.x + this.width / 2, this.y + this.height / 2);
    
    // Hover effect
    if (gameState.hoveredShop === this) {
      p.noFill();
      p.stroke(255, 255, 0);
      p.strokeWeight(3);
      p.rect(this.x, this.y, this.width, this.height, 5);
    }
    
    p.pop();
  }
  
  serveCustomer() {
    this.customersServed++;
  }
}

export function canPlaceShop(floorIndex, shopType) {
  const floor = gameState.floors[floorIndex];
  if (!floor) return false;
  
  const shopData = SHOP_TYPES[shopType];
  if (gameState.money < shopData.cost) return false;
  
  if (floor.shops.length >= floor.capacity) return false;
  
  return true;
}

export function placeShop(floorIndex, shopType) {
  if (!canPlaceShop(floorIndex, shopType)) return null;
  
  const floor = gameState.floors[floorIndex];
  const shopData = SHOP_TYPES[shopType];
  
  // Calculate position for the shop
  const spacing = 10;
  let xPos = spacing;
  for (let shop of floor.shops) {
    xPos = Math.max(xPos, shop.x + shop.width + spacing);
  }
  
  // Create new shop
  const shop = new Shop(shopType, floorIndex, xPos);
  shop.y = floor.y;
  
  floor.shops.push(shop);
  gameState.shops.push(shop);
  gameState.money -= shopData.cost;
  
  return shop;
}

export function removeShop(shop) {
  if (!shop) return;
  
  // Remove from floor
  const floor = gameState.floors[shop.floorIndex];
  if (floor) {
    const idx = floor.shops.indexOf(shop);
    if (idx !== -1) {
      floor.shops.splice(idx, 1);
    }
  }
  
  // Remove from global shops
  const globalIdx = gameState.shops.indexOf(shop);
  if (globalIdx !== -1) {
    gameState.shops.splice(globalIdx, 1);
  }
  
  // Refund 50% of shop cost
  const shopData = SHOP_TYPES[shop.type];
  gameState.money += Math.floor(shopData.cost * 0.5);
}

export function updateShops(p) {
  for (let shop of gameState.shops) {
    shop.update(p);
  }
}

export function renderShops(p) {
  for (let shop of gameState.shops) {
    shop.render(p);
  }
}