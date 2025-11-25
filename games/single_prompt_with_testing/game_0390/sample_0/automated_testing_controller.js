// automated_testing_controller.js - Automated testing

import { gameState, PLAY_PHASES } from './globals.js';

let actionHistory = [];
let stuckCounter = 0;
let lastGold = 0;

function getTestWinAction(gameState) {
  // Strategy: Brew high-quality potions and negotiate optimally
  
  // Track if we're stuck
  if (gameState.gold === lastGold) {
    stuckCounter++;
  } else {
    stuckCounter = 0;
    lastGold = gameState.gold;
  }
  
  // If stuck, try random action
  if (stuckCounter > 30) {
    stuckCounter = 0;
    return getRandomAction(gameState);
  }
  
  if (gameState.playPhase === PLAY_PHASES.SHOP_MENU) {
    // Priority: brew potions when we have ingredients
    const hasIngredients = gameState.ingredients.some(i => i.count >= 3);
    if (hasIngredients && gameState.potions.length < 3) {
      // Select "Brew Potion"
      const targetSelection = 0;
      if (gameState.menuSelection !== targetSelection) {
        return gameState.menuSelection < targetSelection ? 40 : 38; // DOWN or UP
      }
      return 32; // SPACE to confirm
    }
    
    // If we have potions, sell them
    if (gameState.potions.length > 0) {
      const targetSelection = 1; // Sell to customer
      if (gameState.menuSelection !== targetSelection) {
        return gameState.menuSelection < targetSelection ? 40 : 38;
      }
      return 32;
    }
    
    // If we have money, upgrade ingredients or buy more
    if (gameState.gold > 100) {
      // Try upgrading
      const targetSelection = 3;
      if (gameState.menuSelection !== targetSelection) {
        return gameState.menuSelection < targetSelection ? 40 : 38;
      }
      return 32;
    } else if (gameState.gold > 30) {
      // Buy ingredients
      const targetSelection = 2;
      if (gameState.menuSelection !== targetSelection) {
        return gameState.menuSelection < targetSelection ? 40 : 38;
      }
      return 32;
    }
    
    // Pay debt when we have good profit margin
    if (gameState.gold > 200) {
      const targetSelection = 4;
      if (gameState.menuSelection !== targetSelection) {
        return gameState.menuSelection < targetSelection ? 40 : 38;
      }
      return 32;
    }
    
    // Otherwise advance day
    const targetSelection = 5;
    if (gameState.menuSelection !== targetSelection) {
      return gameState.menuSelection < targetSelection ? 40 : 38;
    }
    return 32;
  }
  
  if (gameState.playPhase === PLAY_PHASES.BREWING) {
    // Fill all slots with ingredients
    const emptySlots = gameState.brewingSlots.filter(s => s === null).length;
    if (emptySlots > 0) {
      // Press space to add ingredient
      return 32;
    }
    // All slots filled, brew the potion
    return 32;
  }
  
  if (gameState.playPhase === PLAY_PHASES.NEGOTIATION) {
    // Smart negotiation: play low-stress cards when customer stress is high
    if (gameState.negotiationCards.length > 0) {
      const customerStressRatio = gameState.customerStress / gameState.currentCustomer.patience;
      const playerStressRatio = gameState.playerStress / 100;
      
      // If customer is highly stressed, play a calm card if available
      if (customerStressRatio > 0.6) {
        const calmCardIdx = gameState.negotiationCards.findIndex(c => c.type === "CALM");
        if (calmCardIdx >= 0 && gameState.selectedCard !== calmCardIdx) {
          return gameState.selectedCard < calmCardIdx ? 39 : 37; // RIGHT or LEFT
        }
      }
      
      // If we're stressed, play charm/calm
      if (playerStressRatio > 0.5) {
        const goodCardIdx = gameState.negotiationCards.findIndex(c => c.type === "CHARM" || c.type === "CALM");
        if (goodCardIdx >= 0 && gameState.selectedCard !== goodCardIdx) {
          return gameState.selectedCard < goodCardIdx ? 39 : 37;
        }
      }
      
      // Otherwise play highest value card
      let maxValue = -1;
      let maxIdx = 0;
      gameState.negotiationCards.forEach((card, idx) => {
        if (card.getValue() > maxValue) {
          maxValue = card.getValue();
          maxIdx = idx;
        }
      });
      
      if (gameState.selectedCard !== maxIdx) {
        return gameState.selectedCard < maxIdx ? 39 : 37;
      }
      
      return 32; // Play card
    }
  }
  
  return 32; // Default: press space
}

function getBasicTestAction(gameState) {
  // Simple test: navigate menus and perform basic actions
  if (gameState.playPhase === PLAY_PHASES.SHOP_MENU) {
    // Cycle through menu
    if (Math.random() < 0.3) return 40; // DOWN
    if (Math.random() < 0.5) return 32; // SPACE
    return 38; // UP
  }
  
  if (gameState.playPhase === PLAY_PHASES.BREWING) {
    if (Math.random() < 0.7) return 32; // SPACE
    return Math.random() < 0.5 ? 37 : 39; // LEFT or RIGHT
  }
  
  if (gameState.playPhase === PLAY_PHASES.NEGOTIATION) {
    if (Math.random() < 0.7) return 32; // SPACE
    return Math.random() < 0.5 ? 37 : 39; // LEFT or RIGHT
  }
  
  return 32;
}

function getRandomAction(gameState) {
  const actions = [37, 38, 39, 40, 32]; // Arrow keys and space
  return actions[Math.floor(Math.random() * actions.length)];
}

export function get_automated_testing_action(gameState) {
  actionHistory.push(Date.now());
  if (actionHistory.length > 100) actionHistory.shift();
  
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;