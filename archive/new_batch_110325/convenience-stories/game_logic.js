// game_logic.js - Core game logic and updates

import { gameState, PHASE_PLAYING, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE } from './globals.js';
import { updateEmployees, calculateEmployeeCosts } from './employees.js';
import { spawnCustomer } from './entities.js';
import { addMessage } from './products.js';

let lastUpdateTime = 0;
let customerSpawnTimer = 0;
let hourTimer = 0;
let rivalUpdateTimer = 0;

export function updateGameLogic(p) {
  if (gameState.gamePhase !== PHASE_PLAYING) return;
  
  const currentTime = p.millis() / 1000;
  const deltaTime = lastUpdateTime === 0 ? 0 : currentTime - lastUpdateTime;
  lastUpdateTime = currentTime;
  
  gameState.gameTime += deltaTime;
  hourTimer += deltaTime;
  
  // Update hour and day
  if (hourTimer >= 10) { // 10 seconds = 1 game hour
    hourTimer = 0;
    gameState.hour++;
    if (gameState.hour >= 24) {
      gameState.hour = 0;
      gameState.day++;
      
      // Daily employee costs
      const dailyCost = calculateEmployeeCosts() * 24;
      gameState.money -= dailyCost;
      addMessage(`Daily wages: -$${dailyCost.toFixed(0)}`);
    }
  }
  
  // Spawn customers
  customerSpawnTimer += deltaTime;
  if (customerSpawnTimer >= 3) {
    customerSpawnTimer = 0;
    spawnCustomer(p);
  }
  
  // Update customers
  for (let i = gameState.customers.length - 1; i >= 0; i--) {
    const customer = gameState.customers[i];
    const shouldRemove = customer.update(deltaTime, p);
    if (shouldRemove) {
      // Update satisfaction
      gameState.customerSatisfaction = gameState.customerSatisfaction * 0.9 + customer.satisfaction * 0.1;
      gameState.customers.splice(i, 1);
    }
  }
  
  // Update employees
  updateEmployees(deltaTime);
  
  // Update store rating based on satisfaction
  const targetRating = 1 + (gameState.customerSatisfaction / 100) * 4;
  gameState.storeRating += (targetRating - gameState.storeRating) * deltaTime * 0.1;
  gameState.storeRating = Math.max(1, Math.min(5, gameState.storeRating));
  
  // Update market share based on performance
  rivalUpdateTimer += deltaTime;
  if (rivalUpdateTimer >= 20) {
    rivalUpdateTimer = 0;
    updateRivals();
  }
  
  // Update market share gradually
  const targetMarketShare = 10 + (gameState.storeRating - 1) * 10 + (gameState.shelves.length * 2);
  gameState.marketShare += (targetMarketShare - gameState.marketShare) * deltaTime * 0.05;
  gameState.marketShare = Math.max(0, Math.min(100, gameState.marketShare));
  
  // Clean old messages
  gameState.messageQueue = gameState.messageQueue.filter(m => gameState.gameTime - m.time < 3);
  
  // Check win condition
  if (gameState.storeRating >= gameState.targetRating && 
      gameState.marketShare >= gameState.targetMarketShare &&
      gameState.totalProfit >= gameState.targetProfit) {
    gameState.gamePhase = PHASE_GAME_OVER_WIN;
    p.logs.game_info.push({
      data: { phase: PHASE_GAME_OVER_WIN, reason: "win_condition_met" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  // Check lose condition
  if (gameState.money < -500) {
    gameState.gamePhase = PHASE_GAME_OVER_LOSE;
    p.logs.game_info.push({
      data: { phase: PHASE_GAME_OVER_LOSE, reason: "bankruptcy" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

function updateRivals() {
  // Simulate rival store performance
  gameState.rivalStores.forEach(rival => {
    rival.rating += (Math.random() - 0.5) * 0.2;
    rival.rating = Math.max(1, Math.min(5, rival.rating));
    rival.marketShare += (Math.random() - 0.5) * 2;
    rival.marketShare = Math.max(5, Math.min(30, rival.marketShare));
  });
  
  // Initialize rivals if none exist
  if (gameState.rivalStores.length === 0) {
    gameState.rivalStores = [
      { name: "QuickStop", rating: 2.5, marketShare: 25 },
      { name: "Corner Store", rating: 2.0, marketShare: 20 },
      { name: "24/7 Mart", rating: 3.0, marketShare: 25 }
    ];
  }
}

export function resetGameLogic() {
  lastUpdateTime = 0;
  customerSpawnTimer = 0;
  hourTimer = 0;
  rivalUpdateTimer = 0;
}