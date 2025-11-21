// automated_testing_controller.js - Automated testing
import { gameState, SUBPHASE_AGENT_PLACEMENT, PHASE_PLAYING } from './globals.js';

let moveHistory = [];
let stuckCounter = 0;

function getTestWinAction(gameState) {
  if (gameState.gamePhase !== PHASE_PLAYING) {
    return null;
  }
  
  if (gameState.subPhase !== SUBPHASE_AGENT_PLACEMENT) {
    return null;
  }
  
  if (gameState.currentPlayer !== 0) {
    return null;
  }
  
  const player = gameState.player;
  
  // Strategy: Focus on VP and combat
  
  // If no card selected, select one with agent effect
  if (gameState.selectedCardIndex < 0) {
    for (let i = 0; i < player.hand.length; i++) {
      if (player.hand[i].agentEffect) {
        return { keyCode: 39 }; // RIGHT to navigate
      }
    }
    return { keyCode: 39 };
  }
  
  // If card selected but no location, find best location
  if (gameState.selectedLocationIndex < 0) {
    return { keyCode: 40 }; // DOWN to select location
  }
  
  // If in market, try to buy best card
  const loc = gameState.locations[gameState.selectedLocationIndex];
  if (loc && loc.type === "market") {
    // Find most valuable affordable card
    let bestValue = -1;
    let bestIdx = -1;
    
    for (let i = 0; i < gameState.marketCards.length; i++) {
      const card = gameState.marketCards[i];
      if (player.canAffordCard(card)) {
        const value = card.combat * 3 + (card.agentEffect ? 2 : 0) + (card.revealEffect ? 1 : 0);
        if (value > bestValue) {
          bestValue = value;
          bestIdx = i;
        }
      }
    }
    
    if (bestIdx >= 0 && gameState.selectedCardIndex === bestIdx) {
      return { keyCode: 32 }; // SPACE to buy
    } else if (bestIdx >= 0) {
      return { keyCode: 39 }; // Navigate to best card
    } else {
      return { keyCode: 90 }; // Z to cancel if can't afford anything
    }
  }
  
  // Confirm placement
  if (gameState.selectedCardIndex >= 0 && gameState.selectedLocationIndex >= 0) {
    const card = player.hand[gameState.selectedCardIndex];
    const location = gameState.locations[gameState.selectedLocationIndex];
    
    // Prefer combat locations
    if (location.isCombat) {
      return { keyCode: 32 }; // SPACE to confirm
    }
    
    // Otherwise accept any valid location
    if (card.agentEffect && !location.occupied) {
      return { keyCode: 32 }; // SPACE to confirm
    }
    
    // Try different location
    return { keyCode: 39 }; // RIGHT to try next location
  }
  
  return null;
}

function getBasicTestAction(gameState) {
  if (gameState.gamePhase !== PHASE_PLAYING) {
    return null;
  }
  
  if (gameState.subPhase !== SUBPHASE_AGENT_PLACEMENT) {
    return null;
  }
  
  if (gameState.currentPlayer !== 0) {
    return null;
  }
  
  // Random valid actions
  const actions = [37, 38, 39, 40, 32]; // Arrow keys and space
  const randomKey = actions[Math.floor(Math.random() * actions.length)];
  
  return { keyCode: randomKey };
}

export function get_automated_testing_action(gameState) {
  if (!gameState) return null;
  
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    default:
      return null;
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;