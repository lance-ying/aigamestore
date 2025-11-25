// dealer_ai.js - Dealer AI logic

import { gameState, ITEM_MAGNIFYING_GLASS, ITEM_CIGARETTES, ITEM_HANDSAW, ITEM_BEER } from './globals.js';
import { countRemainingLive, countRemainingBlank } from './shotgun.js';
import { useItem, removeItem } from './items.js';
import { shoot, checkRoundEnd, switchTurn, startAnimation } from './game_logic.js';

export function executeDealerTurn(p) {
  // Dealer AI logic
  if (gameState.dealerItems.length > 0) {
    // Use items strategically
    const hasHandsaw = gameState.dealerItems.includes(ITEM_HANDSAW);
    const hasMagnifier = gameState.dealerItems.includes(ITEM_MAGNIFYING_GLASS);
    const hasCigarettes = gameState.dealerItems.includes(ITEM_CIGARETTES);
    const hasBeer = gameState.dealerItems.includes(ITEM_BEER);
    
    // Use magnifying glass if available
    if (hasMagnifier && !gameState.knownNextShell) {
      const index = gameState.dealerItems.indexOf(ITEM_MAGNIFYING_GLASS);
      const message = useItem(ITEM_MAGNIFYING_GLASS, gameState.dealer, gameState.dealer);
      removeItem(gameState.dealerItems, index);
      startAnimation(message, 45);
      return;
    }
    
    // Use cigarettes if low health
    if (hasCigarettes && gameState.dealer.health <= 2) {
      const index = gameState.dealerItems.indexOf(ITEM_CIGARETTES);
      const message = useItem(ITEM_CIGARETTES, gameState.dealer, gameState.dealer);
      removeItem(gameState.dealerItems, index);
      startAnimation(message, 45);
      return;
    }
    
    // Use handsaw if we know it's live
    if (hasHandsaw && gameState.knownNextShell === "LIVE") {
      const index = gameState.dealerItems.indexOf(ITEM_HANDSAW);
      const message = useItem(ITEM_HANDSAW, gameState.dealer, gameState.dealer);
      removeItem(gameState.dealerItems, index);
      startAnimation(message, 45);
      return;
    }
    
    // Use beer if we know it's blank
    if (hasBeer && gameState.knownNextShell === "BLANK") {
      const index = gameState.dealerItems.indexOf(ITEM_BEER);
      const message = useItem(ITEM_BEER, gameState.dealer, gameState.dealer);
      removeItem(gameState.dealerItems, index);
      startAnimation(message, 45);
      return;
    }
  }
  
  // Decide whether to shoot self or player
  const liveCount = countRemainingLive();
  const blankCount = countRemainingBlank();
  
  let shootSelf = false;
  
  if (gameState.knownNextShell === "BLANK") {
    shootSelf = true;
  } else if (gameState.knownNextShell === "LIVE") {
    shootSelf = false;
  } else {
    // Probabilistic decision
    const blankProbability = blankCount / (liveCount + blankCount);
    shootSelf = p.random() < blankProbability;
  }
  
  const target = shootSelf ? gameState.dealer : gameState.player;
  const result = shoot(gameState.dealer, target);
  
  startAnimation(result.message, 60);
  
  setTimeout(() => {
    if (checkRoundEnd(p)) {
      return;
    }
    
    // If shot self with blank, get another turn
    if (result.targetWasSelf && !result.wasLive) {
      gameState.currentTurn = "DEALER";
      gameState.turnState = "CHOOSE_ACTION";
    } else {
      switchTurn();
    }
  }, 1000);
}