// automated_testing_controller.js - Automated testing

import { gameState } from './globals.js';

let moveHistory = [];
let stuckCounter = 0;

function getTestWinAction(gameState) {
  const player = gameState.players[gameState.currentPlayerIndex];
  
  // Strategy: Try to claim routes first, then draw cards
  if (gameState.turnPhase === "CHOOSE_ACTION") {
    // Check if we can claim any route
    const unclaimedRoutes = gameState.routes
      .map((route, index) => ({ route, index }))
      .filter(item => item.route.claimedBy === -1);
    
    let canClaimRoute = false;
    for (const { route } of unclaimedRoutes) {
      const requiredColor = route.color === "GRAY" ? findBestColorForClaim(player, route.length) : route.color;
      if (requiredColor && player.getCardCount(requiredColor) >= route.length && player.trainPieces >= route.length) {
        canClaimRoute = true;
        break;
      }
    }
    
    if (canClaimRoute) {
      // Select "Claim Route" (index 1)
      if (gameState.menuSelection !== 1) {
        return { keyCode: 40 }; // DOWN
      } else {
        return { keyCode: 32 }; // SPACE
      }
    } else {
      // Select "Draw Cards" (index 0)
      if (gameState.menuSelection !== 0) {
        return { keyCode: 38 }; // UP
      } else {
        return { keyCode: 32 }; // SPACE
      }
    }
  } else if (gameState.turnPhase === "DRAWING_CARDS") {
    // Draw from deck
    const deckIndex = gameState.visibleCards.length;
    if (gameState.menuSelection < deckIndex) {
      return { keyCode: 39 }; // RIGHT
    } else {
      return { keyCode: 32 }; // SPACE
    }
  } else if (gameState.turnPhase === "CLAIMING_ROUTE") {
    // Find best route to claim
    const unclaimedRoutes = gameState.routes
      .map((route, index) => ({ route, index }))
      .filter(item => item.route.claimedBy === -1);
    
    let bestRouteMenuIndex = -1;
    let bestScore = -1;
    
    unclaimedRoutes.forEach((item, menuIndex) => {
      const { route } = item;
      const requiredColor = route.color === "GRAY" ? findBestColorForClaim(player, route.length) : route.color;
      
      if (requiredColor && player.getCardCount(requiredColor) >= route.length && player.trainPieces >= route.length) {
        // Prioritize longer routes for more points
        const score = route.points;
        if (score > bestScore) {
          bestScore = score;
          bestRouteMenuIndex = menuIndex;
        }
      }
    });
    
    if (bestRouteMenuIndex !== -1) {
      if (gameState.menuSelection < bestRouteMenuIndex) {
        return { keyCode: 40 }; // DOWN
      } else if (gameState.menuSelection > bestRouteMenuIndex) {
        return { keyCode: 38 }; // UP
      } else {
        return { keyCode: 32 }; // SPACE - Claim
      }
    } else {
      return { keyCode: 90 }; // Z - Cancel if can't claim
    }
  } else if (gameState.turnPhase === "CHOOSING_DESTINATIONS") {
    // Select all destinations
    if (gameState.selectedCardIndices.length < gameState.tempDestinations.length) {
      if (!gameState.selectedCardIndices.includes(gameState.menuSelection)) {
        return { keyCode: 32 }; // SPACE - Select
      } else {
        return { keyCode: 40 }; // DOWN - Move to next
      }
    } else {
      return { keyCode: 90 }; // Z - Confirm
    }
  }
  
  return getRandomAction(gameState);
}

function findBestColorForClaim(player, length) {
  for (const cardGroup of player.trainCards) {
    if (cardGroup.count >= length) {
      return cardGroup.color;
    }
  }
  return null;
}

function getBasicTestAction(gameState) {
  // Simple test: draw cards and occasionally try to claim routes
  if (gameState.turnPhase === "CHOOSE_ACTION") {
    const action = Math.random() < 0.3 ? 1 : 0; // 30% claim route, 70% draw cards
    if (gameState.menuSelection !== action) {
      return { keyCode: action === 0 ? 38 : 40 };
    } else {
      return { keyCode: 32 };
    }
  } else if (gameState.turnPhase === "DRAWING_CARDS") {
    // Random card selection
    const maxIndex = gameState.visibleCards.length;
    const targetIndex = Math.floor(Math.random() * (maxIndex + 1));
    if (gameState.menuSelection < targetIndex) {
      return { keyCode: 39 };
    } else if (gameState.menuSelection > targetIndex) {
      return { keyCode: 37 };
    } else {
      return { keyCode: 32 };
    }
  } else if (gameState.turnPhase === "CLAIMING_ROUTE") {
    const unclaimedRoutes = gameState.routes.filter(r => r.claimedBy === -1);
    if (unclaimedRoutes.length > 0 && Math.random() < 0.5) {
      return { keyCode: 32 }; // Try to claim
    } else {
      return { keyCode: 90 }; // Cancel
    }
  } else if (gameState.turnPhase === "CHOOSING_DESTINATIONS") {
    if (gameState.selectedCardIndices.length === 0) {
      return { keyCode: 32 }; // Select first
    } else {
      return { keyCode: 90 }; // Confirm
    }
  }
  
  return { keyCode: 32 };
}

function getRandomAction(gameState) {
  const actions = [37, 38, 39, 40, 32, 90]; // Arrow keys, Space, Z
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

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;