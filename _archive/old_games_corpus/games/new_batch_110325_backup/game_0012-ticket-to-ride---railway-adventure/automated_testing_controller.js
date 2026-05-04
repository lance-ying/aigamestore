// automated_testing_controller.js - Automated testing strategies

import { gameState, GAME_PHASES, COLORS } from './globals.js';
import { canClaimRoute } from './game_logic.js';

function getTestWinAction(gameState) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return null;
  }
  
  // Strategy: Focus on claiming short routes and completing tickets
  
  // If we can claim a route, try to do so
  if (gameState.uiMode === "CLAIM_ROUTE") {
    // Look for the shortest claimable route
    let bestRoute = -1;
    let shortestLength = Infinity;
    
    for (let i = 0; i < gameState.routes.length; i++) {
      if (canClaimRoute(i)) {
        const route = gameState.routes[i];
        if (route.length < shortestLength) {
          shortestLength = route.length;
          bestRoute = i;
        }
      }
    }
    
    if (bestRoute !== -1) {
      // Navigate to the route
      if (gameState.selectedRouteIndex < bestRoute) {
        return { key: 'ArrowDown', keyCode: 40 };
      } else if (gameState.selectedRouteIndex > bestRoute) {
        return { key: 'ArrowUp', keyCode: 38 };
      } else {
        // Claim it
        return { key: ' ', keyCode: 32 };
      }
    }
    
    // Can't claim anything, switch to drawing
    return { key: 'Shift', keyCode: 16 };
  }
  
  // If in draw mode, draw cards
  if (gameState.uiMode === "DRAW_CARDS") {
    if (gameState.cardsDrawnThisTurn < 2) {
      // Try to draw from face-up cards that match our needs
      // Look at what colors we need for short routes
      const neededColors = {};
      for (let i = 0; i < gameState.routes.length; i++) {
        if (!gameState.claimedRoutes.includes(i)) {
          const route = gameState.routes[i];
          if (route.length <= 4) {
            neededColors[route.color] = (neededColors[route.color] || 0) + 1;
          }
        }
      }
      
      // Find a face-up card we need
      for (let i = 0; i < gameState.faceUpCards.length; i++) {
        const card = gameState.faceUpCards[i];
        if (neededColors[card] || card === COLORS.WILD) {
          if (gameState.selectedCardIndex !== i) {
            if (gameState.selectedCardIndex < i) {
              return { key: 'ArrowRight', keyCode: 39 };
            } else {
              return { key: 'ArrowLeft', keyCode: 37 };
            }
          } else {
            return { key: ' ', keyCode: 32 };
          }
        }
      }
      
      // Otherwise draw from deck
      if (gameState.selectedCardIndex !== 5) {
        return { key: 'ArrowRight', keyCode: 39 };
      } else {
        return { key: ' ', keyCode: 32 };
      }
    } else {
      // Drawn enough cards, try to claim
      return { key: 'Shift', keyCode: 16 };
    }
  }
  
  return null;
}

function getBasicTestAction(gameState) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return null;
  }
  
  // Simple test: Draw cards and occasionally try to claim
  const rand = Math.random();
  
  if (gameState.uiMode === "DRAW_CARDS") {
    if (gameState.cardsDrawnThisTurn < 2) {
      if (rand < 0.8) {
        return { key: ' ', keyCode: 32 }; // Draw card
      } else {
        return { key: 'ArrowRight', keyCode: 39 }; // Move selection
      }
    } else {
      if (rand < 0.3) {
        return { key: 'Shift', keyCode: 16 }; // Try to claim
      }
    }
  } else if (gameState.uiMode === "CLAIM_ROUTE") {
    if (rand < 0.3) {
      return { key: ' ', keyCode: 32 }; // Try to claim
    } else if (rand < 0.5) {
      return { key: 'ArrowDown', keyCode: 40 }; // Navigate
    } else if (rand < 0.7) {
      return { key: 'ArrowUp', keyCode: 38 }; // Navigate
    } else {
      return { key: 'Shift', keyCode: 16 }; // Back to drawing
    }
  }
  
  // Occasionally view tickets
  if (rand < 0.05) {
    return { key: 'z', keyCode: 90 };
  }
  
  return null;
}

function getRouteClaimTestAction(gameState) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return null;
  }
  
  // Test route claiming mechanics
  if (gameState.uiMode !== "CLAIM_ROUTE") {
    return { key: 'Shift', keyCode: 16 };
  }
  
  // Try to navigate through all routes
  if (Math.random() < 0.5) {
    return { key: 'ArrowDown', keyCode: 40 };
  } else if (Math.random() < 0.5) {
    return { key: 'ArrowUp', keyCode: 38 };
  } else {
    // Try to claim
    return { key: ' ', keyCode: 32 };
  }
}

function getRandomAction(gameState) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return null;
  }
  
  const actions = [
    { key: ' ', keyCode: 32 },
    { key: 'Shift', keyCode: 16 },
    { key: 'ArrowLeft', keyCode: 37 },
    { key: 'ArrowRight', keyCode: 39 },
    { key: 'ArrowUp', keyCode: 38 },
    { key: 'ArrowDown', keyCode: 40 }
  ];
  
  return actions[Math.floor(Math.random() * actions.length)];
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getRouteClaimTestAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

// Expose globally
window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;