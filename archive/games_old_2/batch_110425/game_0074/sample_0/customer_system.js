// customer_system.js - Customer spawning and management

import { gameState, CUSTOMER_TYPES, CANVAS_WIDTH, CAFE_OFFSET_Y } from './globals.js';
import { Customer } from './entities.js';

export function getAvailableCustomerTypes() {
  return CUSTOMER_TYPES.filter(ct => ct.minPopularity <= gameState.popularity);
}

export function spawnCustomer(p) {
  const availableTypes = getAvailableCustomerTypes();
  if (availableTypes.length === 0) return;
  
  // Select customer type based on popularity
  const weights = availableTypes.map((ct, idx) => {
    return Math.max(1, availableTypes.length - idx);
  });
  
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let random = p.random() * totalWeight;
  let selectedType = availableTypes[0];
  
  for (let i = 0; i < availableTypes.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      selectedType = availableTypes[i];
      break;
    }
  }
  
  // Spawn position
  const spawnX = CANVAS_WIDTH + 50;
  const spawnY = CAFE_OFFSET_Y + 100 + p.random(-30, 30);
  const targetX = 100 + p.random(-20, 20);
  const targetY = spawnY;
  
  const customer = new Customer(p, selectedType, spawnX, spawnY);
  customer.targetX = targetX;
  customer.targetY = targetY;
  
  gameState.customers.push(customer);
}

export function updateCustomers() {
  for (let i = gameState.customers.length - 1; i >= 0; i--) {
    const customer = gameState.customers[i];
    const shouldRemove = customer.update();
    
    if (shouldRemove) {
      gameState.customers.splice(i, 1);
    }
  }
}

export function findNearestWaitingCustomer(x, y, maxDist = 100) {
  let nearest = null;
  let minDist = maxDist;
  
  for (const customer of gameState.customers) {
    if (customer.state === "waiting") {
      const dx = customer.x - x;
      const dy = customer.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < minDist) {
        minDist = dist;
        nearest = customer;
      }
    }
  }
  
  return nearest;
}

export function serveNearestCustomer(playerX, playerY) {
  const customer = findNearestWaitingCustomer(playerX, playerY, 80);
  if (customer) {
    return customer.serve();
  }
  return false;
}