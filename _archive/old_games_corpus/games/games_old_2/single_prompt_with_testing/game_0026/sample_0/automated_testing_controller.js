// automated_testing_controller.js - Automated testing
import { gameState, GAME_PHASES } from './globals.js';

function getTestWinAction(gameState) {
  // TEST_2: Optimal strategy to win
  
  // During card selection
  if (gameState.turnPhase === "SELECT_CARDS") {
    // Strategy: Select high-damage cards, prioritize attack over defense
    if (gameState.selectedCards.length < 3 && gameState.hand.length > 0) {
      // Find best card to play
      let bestCardIndex = -1;
      let bestScore = -1;
      
      for (let i = 0; i < gameState.hand.length; i++) {
        const card = gameState.hand[i];
        if (!gameState.selectedCards.includes(card)) {
          // Score cards: damage is most important, defense secondary
          let score = card.getDisplayDamage() * 2 + card.getDisplayDefense();
          
          // Boost heal cards if heroes are low on health
          if (card.special === "HEAL") {
            const avgHealth = gameState.heroes.reduce((sum, h) => sum + h.health, 0) / gameState.heroes.length;
            if (avgHealth < 50) {
              score += 30;
            }
          }
          
          // Boost AOE if multiple enemies
          if (card.special === "AOE" && gameState.enemies.length > 1) {
            score += 20;
          }
          
          if (score > bestScore) {
            bestScore = score;
            bestCardIndex = i;
          }
        }
      }
      
      if (bestCardIndex >= 0) {
        // Navigate to card
        if (gameState.selectedHandIndex < bestCardIndex) {
          return { keyCode: 39 }; // Right arrow
        } else if (gameState.selectedHandIndex > bestCardIndex) {
          return { keyCode: 37 }; // Left arrow
        } else {
          return { keyCode: 32 }; // Space to select
        }
      }
    } else if (gameState.selectedCards.length === 3) {
      // Execute turn
      return { keyCode: 32 }; // Space
    }
  }
  
  // In shop: buy powerful cards
  if (gameState.shopOpen) {
    if (gameState.availableCards.length === 0) {
      return { keyCode: 90 }; // Z to close shop
    }
    
    // Try to buy the most expensive card we can afford
    let bestCardIndex = -1;
    let bestValue = -1;
    
    for (let i = 0; i < gameState.availableCards.length; i++) {
      const card = gameState.availableCards[i];
      if (card.cost <= gameState.gold) {
        const value = card.damage * 2 + card.defense + (card.special ? 15 : 0);
        if (value > bestValue) {
          bestValue = value;
          bestCardIndex = i;
        }
      }
    }
    
    if (bestCardIndex >= 0) {
      if (gameState.selectedShopIndex < bestCardIndex) {
        return { keyCode: 39 }; // Right
      } else if (gameState.selectedShopIndex > bestCardIndex) {
        return { keyCode: 37 }; // Left
      } else {
        return { keyCode: 32 }; // Buy
      }
    } else {
      return { keyCode: 90 }; // Can't afford anything, close shop
    }
  }
  
  return null;
}

function getBasicTestAction(gameState) {
  // TEST_1: Basic random card playing
  
  if (gameState.turnPhase === "SELECT_CARDS") {
    if (gameState.selectedCards.length < 3 && gameState.hand.length > 0) {
      // Randomly navigate and select
      const actions = [37, 39, 32]; // Left, Right, Space
      return { keyCode: actions[Math.floor(Math.random() * actions.length)] };
    } else if (gameState.selectedCards.length === 3) {
      return { keyCode: 32 }; // Execute
    }
  }
  
  if (gameState.shopOpen) {
    // Random shop behavior
    const actions = [37, 39, 32, 90];
    return { keyCode: actions[Math.floor(Math.random() * actions.length)] };
  }
  
  return null;
}

function getDeckTestAction(gameState) {
  // TEST_3: Test deck building
  
  if (gameState.shopOpen) {
    // Buy cards systematically
    if (gameState.availableCards.length > 0 && gameState.gold >= gameState.availableCards[gameState.selectedShopIndex].cost) {
      return { keyCode: 32 }; // Buy current card
    } else if (gameState.selectedShopIndex < gameState.availableCards.length - 1) {
      return { keyCode: 39 }; // Try next card
    } else {
      return { keyCode: 90 }; // Close shop
    }
  }
  
  // During combat, play cards quickly
  if (gameState.turnPhase === "SELECT_CARDS") {
    if (gameState.selectedCards.length < 3 && gameState.selectedHandIndex < gameState.hand.length) {
      const card = gameState.hand[gameState.selectedHandIndex];
      if (!gameState.selectedCards.includes(card)) {
        return { keyCode: 32 }; // Select
      } else {
        return { keyCode: 39 }; // Next card
      }
    } else if (gameState.selectedCards.length === 3) {
      return { keyCode: 32 }; // Execute
    } else {
      return { keyCode: 37 }; // Go back
    }
  }
  
  return null;
}

function getRandomAction(gameState) {
  const actions = [37, 39, 32, 90]; // Arrow keys, space, Z
  return { keyCode: actions[Math.floor(Math.random() * actions.length)] };
}

export function get_automated_testing_action(gameState) {
  // Don't act during non-gameplay phases
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return null;
  }
  
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getDeckTestAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;