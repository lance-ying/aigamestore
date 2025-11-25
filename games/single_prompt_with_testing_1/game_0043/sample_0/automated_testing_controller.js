// automated_testing_controller.js - Automated testing

import { gameState } from './globals.js';

function getTestWinAction(gameState) {
  // Optimal strategy to win the game
  
  // If choosing initial destinations, select all
  if (gameState.currentAction === "CHOOSE_INITIAL_DESTINATIONS") {
    if (gameState.destinationsDrawn && gameState.destinationsDrawn.length > 0) {
      const unselected = gameState.destinationsDrawn.find(d => !d.selected);
      if (unselected) {
        return { keyCode: 32 }; // SPACE to toggle
      } else {
        return { keyCode: 90 }; // Z to confirm
      }
    }
  }
  
  // If selecting destinations mid-game
  if (gameState.currentAction === "SELECTING_DESTINATIONS") {
    if (gameState.destinationsDrawn && gameState.destinationsDrawn.length > 0) {
      const selectedCount = gameState.destinationsDrawn.filter(d => d.selected).length;
      if (selectedCount < 1) {
        return { keyCode: 32 }; // SPACE to select first
      } else {
        return { keyCode: 90 }; // Z to confirm
      }
    }
  }
  
  // If no action chosen, prioritize claiming routes if we have cards
  if (!gameState.currentAction) {
    const unclaimedRoutes = gameState.routes.filter(r => !r.claimed);
    const claimableRoute = findBestClaimableRoute(gameState, unclaimedRoutes);
    
    if (claimableRoute) {
      // Navigate to claim route action
      if (gameState.menuSelection !== 1) {
        return { keyCode: 16 }; // SHIFT
      } else {
        return { keyCode: 32 }; // SPACE to select
      }
    } else {
      // Navigate to draw cards
      if (gameState.menuSelection !== 0) {
        return { keyCode: 16 }; // SHIFT
      } else {
        return { keyCode: 32 }; // SPACE to select
      }
    }
  }
  
  // Drawing cards
  if (gameState.currentAction === "DRAW_CARDS") {
    if (gameState.cardsDrawnThisTurn >= 2) {
      return { keyCode: 90 }; // Z to end turn (shouldn't happen)
    }
    
    // Prioritize collecting colors we need
    const targetColors = findNeededColors(gameState);
    
    // Check face-up cards
    for (let i = 0; i < 5; i++) {
      const card = gameState.faceUpCards[i];
      if (targetColors.includes(card)) {
        if (gameState.selectedCardIndex !== i) {
          return { keyCode: gameState.selectedCardIndex < i ? 39 : 37 }; // RIGHT or LEFT
        } else {
          return { keyCode: 32 }; // SPACE to draw
        }
      }
    }
    
    // Draw from deck
    if (gameState.selectedCardIndex !== 5) {
      return { keyCode: gameState.selectedCardIndex < 5 ? 39 : 37 }; // Navigate to deck
    } else {
      return { keyCode: 32 }; // SPACE to draw
    }
  }
  
  // Claiming routes
  if (gameState.currentAction === "CLAIM_ROUTE") {
    const unclaimedRoutes = gameState.routes.filter(r => !r.claimed);
    const claimableRoute = findBestClaimableRoute(gameState, unclaimedRoutes);
    
    if (claimableRoute) {
      const targetIndex = unclaimedRoutes.indexOf(claimableRoute);
      if (gameState.selectedRouteIndex !== targetIndex) {
        return { keyCode: gameState.selectedRouteIndex < targetIndex ? 40 : 38 }; // DOWN or UP
      } else {
        return { keyCode: 32 }; // SPACE to claim
      }
    } else {
      return { keyCode: 90 }; // Z to cancel
    }
  }
  
  return { keyCode: 32 }; // Default
}

function findNeededColors(gameState) {
  const colorPriority = {};
  
  // Count cards we have
  const cardCounts = {};
  gameState.playerHand.forEach(card => {
    cardCounts[card] = (cardCounts[card] || 0) + 1;
  });
  
  // Check unclaimed routes we can potentially claim
  const unclaimedRoutes = gameState.routes.filter(r => !r.claimed);
  unclaimedRoutes.forEach(route => {
    const color = route.color;
    if (color !== 'GRAY') {
      const need = route.length - (cardCounts[color] || 0) - (cardCounts['RAINBOW'] || 0);
      if (need <= 3 && need > 0) {
        colorPriority[color] = (colorPriority[color] || 0) + route.getPoints();
      }
    }
  });
  
  // Return colors sorted by priority
  return Object.keys(colorPriority)
    .sort((a, b) => colorPriority[b] - colorPriority[a])
    .concat(['RAINBOW']);
}

function findBestClaimableRoute(gameState, unclaimedRoutes) {
  const cardCounts = {};
  gameState.playerHand.forEach(card => {
    cardCounts[card] = (cardCounts[card] || 0) + 1;
  });
  
  const wildCount = cardCounts['RAINBOW'] || 0;
  
  let bestRoute = null;
  let bestValue = 0;
  
  unclaimedRoutes.forEach(route => {
    if (gameState.trainsRemaining < route.length) return;
    
    const colorNeeded = route.color;
    let canClaim = false;
    
    if (colorNeeded === 'GRAY') {
      // Check any color
      for (let color in cardCounts) {
        if (color !== 'RAINBOW') {
          if (cardCounts[color] + wildCount >= route.length) {
            canClaim = true;
            break;
          }
        }
      }
      if (!canClaim && wildCount >= route.length) {
        canClaim = true;
      }
    } else {
      const specificCount = cardCounts[colorNeeded] || 0;
      if (specificCount + wildCount >= route.length) {
        canClaim = true;
      }
    }
    
    if (canClaim) {
      const value = route.getPoints();
      if (value > bestValue) {
        bestValue = value;
        bestRoute = route;
      }
    }
  });
  
  return bestRoute;
}

function getBasicTestAction(gameState) {
  // Basic test: just try different actions
  
  if (gameState.currentAction === "CHOOSE_INITIAL_DESTINATIONS") {
    const selected = gameState.destinationsDrawn.filter(d => d.selected).length;
    if (selected < 1) {
      return { keyCode: 32 }; // Select first
    } else {
      return { keyCode: 90 }; // Confirm
    }
  }
  
  if (gameState.currentAction === "SELECTING_DESTINATIONS") {
    const selected = gameState.destinationsDrawn.filter(d => d.selected).length;
    if (selected < 1) {
      return { keyCode: 32 };
    } else {
      return { keyCode: 90 };
    }
  }
  
  if (!gameState.currentAction) {
    return { keyCode: 32 }; // Select current menu option
  }
  
  if (gameState.currentAction === "DRAW_CARDS") {
    if (gameState.cardsDrawnThisTurn < 2) {
      return { keyCode: 32 }; // Draw current card
    }
  }
  
  if (gameState.currentAction === "CLAIM_ROUTE") {
    return { keyCode: 32 }; // Try to claim
  }
  
  return { keyCode: 32 };
}

function getRandomAction(gameState) {
  const actions = [37, 38, 39, 40, 32, 16, 90]; // Arrow keys, space, shift, z
  return { keyCode: actions[Math.floor(Math.random() * actions.length)] };
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;