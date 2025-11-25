// day_management.js - Day progression

import { gameState, GAME_PHASES } from './globals.js';

export function advanceDay() {
  gameState.day++;
  
  // Pay daily interest on debt (5%)
  const interest = Math.floor(gameState.debt * 0.05);
  gameState.debt += interest;
  
  // Restock basic ingredients
  for (const ing of gameState.ingredients) {
    ing.count = Math.min(ing.count + 2, 20);
  }
  
  checkGameOver();
}

export function checkGameOver() {
  if (gameState.debt <= 0) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
    return true;
  }
  
  if (gameState.day > gameState.maxDays) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
    return true;
  }
  
  return false;
}

export function payDebt(amount) {
  const payment = Math.min(amount, gameState.gold, gameState.debt);
  gameState.gold -= payment;
  gameState.debt -= payment;
  
  checkGameOver();
  return payment;
}