// automated_testing_controller.js - Automated testing

import { 
  gameState, 
  TURN_STATE_CHOOSE_ACTION,
  TURN_STATE_CHOOSE_TARGET,
  TURN_STATE_ANIMATING,
  ITEM_MAGNIFYING_GLASS,
  ITEM_CIGARETTES,
  ITEM_HANDSAW,
  ITEM_BEER
} from './globals.js';
import { countRemainingLive, countRemainingBlank } from './shotgun.js';

function getTestWinAction(gameState) {
  if (gameState.currentTurn !== "PLAYER") return null;
  if (gameState.turnState === TURN_STATE_ANIMATING) return null;
  
  if (gameState.turnState === TURN_STATE_CHOOSE_ACTION) {
    // Strategic item usage
    if (gameState.playerItems.length > 0) {
      // Use magnifying glass if available and don't know next shell
      if (gameState.playerItems.includes(ITEM_MAGNIFYING_GLASS) && !gameState.knownNextShell) {
        const index = gameState.playerItems.indexOf(ITEM_MAGNIFYING_GLASS);
        gameState.menuSelection = index + 1;
        return { keyCode: 32 }; // SPACE to use item
      }
      
      // Use cigarettes if low health
      if (gameState.playerItems.includes(ITEM_CIGARETTES) && gameState.player.health <= 2) {
        const index = gameState.playerItems.indexOf(ITEM_CIGARETTES);
        gameState.menuSelection = index + 1;
        return { keyCode: 32 };
      }
      
      // Use handsaw if we know next is live
      if (gameState.playerItems.includes(ITEM_HANDSAW) && gameState.knownNextShell === "LIVE") {
        const index = gameState.playerItems.indexOf(ITEM_HANDSAW);
        gameState.menuSelection = index + 1;
        return { keyCode: 32 };
      }
      
      // Use beer if we know next is blank
      if (gameState.playerItems.includes(ITEM_BEER) && gameState.knownNextShell === "BLANK") {
        const index = gameState.playerItems.indexOf(ITEM_BEER);
        gameState.menuSelection = index + 1;
        return { keyCode: 32 };
      }
    }
    
    // Decide to shoot
    if (gameState.knownNextShell === "BLANK") {
      // Shoot self to get extra turn
      return { keyCode: 90 }; // Z
    } else if (gameState.knownNextShell === "LIVE") {
      // Shoot dealer
      return { keyCode: 16 }; // SHIFT
    } else {
      // Probabilistic decision
      const liveCount = countRemainingLive();
      const blankCount = countRemainingBlank();
      
      if (blankCount > liveCount) {
        return { keyCode: 90 }; // More likely blank, shoot self
      } else {
        return { keyCode: 16 }; // More likely live, shoot dealer
      }
    }
  } else if (gameState.turnState === TURN_STATE_CHOOSE_TARGET) {
    // Should not reach here with quick keys, but handle anyway
    gameState.targetSelection = 1; // Target dealer
    return { keyCode: 32 };
  }
  
  return null;
}

function getRandomAction(gameState) {
  if (gameState.currentTurn !== "PLAYER") return null;
  if (gameState.turnState === TURN_STATE_ANIMATING) return null;
  
  if (gameState.turnState === TURN_STATE_CHOOSE_ACTION) {
    const hasItems = gameState.playerItems.length > 0;
    const rand = Math.random();
    
    if (hasItems && rand < 0.3) {
      // Use random item
      const itemIndex = Math.floor(Math.random() * gameState.playerItems.length);
      gameState.menuSelection = itemIndex + 1;
      return { keyCode: 32 };
    } else {
      // Shoot random target
      if (Math.random() < 0.5) {
        return { keyCode: 90 }; // Shoot self
      } else {
        return { keyCode: 16 }; // Shoot dealer
      }
    }
  } else if (gameState.turnState === TURN_STATE_CHOOSE_TARGET) {
    gameState.targetSelection = Math.random() < 0.5 ? 0 : 1;
    return { keyCode: 32 };
  }
  
  return null;
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getRandomAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    default:
      return null;
  }
}

if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;