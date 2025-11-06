// progression.js - Game progression and upgrades

import { gameState, PHASE_GAME_OVER_WIN } from './globals.js';

export function updateCafeRating() {
  const reputationThresholds = [0, 50, 150, 300, 500];
  
  for (let i = 5; i >= 1; i--) {
    if (gameState.reputation >= reputationThresholds[i - 1]) {
      gameState.cafeRating = i;
      break;
    }
  }
  
  // Win condition: 5-star rating
  if (gameState.cafeRating >= 5 && gameState.totalRevenue >= 1000) {
    gameState.gamePhase = PHASE_GAME_OVER_WIN;
  }
}

export function updateUpgradeTier() {
  const revenueThresholds = [0, 200, 500, 1000, 2000];
  
  for (let i = 5; i >= 1; i--) {
    if (gameState.totalRevenue >= revenueThresholds[i - 1]) {
      if (gameState.upgradeTier < i) {
        gameState.upgradeTier = i;
        
        // Unlock benefits
        if (i === 2) {
          gameState.maxCustomers = 3;
          gameState.customerSpawnDelay = 150;
        } else if (i === 3) {
          gameState.maxCustomers = 4;
          gameState.customerSpawnDelay = 120;
        } else if (i === 4) {
          gameState.maxCustomers = 5;
          gameState.customerSpawnDelay = 100;
        } else if (i === 5) {
          gameState.maxCustomers = 6;
          gameState.customerSpawnDelay = 80;
        }
      }
      break;
    }
  }
}

export function checkGameProgress() {
  updateCafeRating();
  updateUpgradeTier();
}