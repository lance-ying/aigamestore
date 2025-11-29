import { gameState, SPACE_TYPES } from './globals.js';
import { getCurrentPlayer } from './game_logic.js';

function getTestWinAction(gameState) {
  const player = getCurrentPlayer();
  
  // If not human player's turn, wait
  if (player.isAI) {
    return null;
  }
  
  // Roll dice
  if (gameState.turnPhase === "ROLL" && !gameState.diceRolled) {
    return { key: ' ', keyCode: 32 };
  }
  
  // Buy property if available
  if (gameState.pendingAction === "BUY_PROPERTY") {
    const space = gameState.selectedProperty;
    if (player.cash >= space.price) {
      return { key: 'z', keyCode: 90 };
    } else {
      return { key: 'Shift', keyCode: 16 };
    }
  }
  
  // Build houses on monopolies
  if (gameState.turnPhase === "END") {
    const buildable = player.properties.filter(prop => {
      return prop.type === SPACE_TYPES.PROPERTY && 
             player.hasMonopoly(prop.group) && 
             prop.houses < 5 &&
             player.cash >= 100;
    });
    
    if (buildable.length > 0) {
      return { key: 'z', keyCode: 90 };
    } else {
      return { key: 'z', keyCode: 90 }; // End turn
    }
  }
  
  return null;
}

function getBasicTestAction(gameState) {
  const player = getCurrentPlayer();
  
  if (player.isAI) {
    return null;
  }
  
  // Roll dice
  if (gameState.turnPhase === "ROLL" && !gameState.diceRolled) {
    return { key: ' ', keyCode: 32 };
  }
  
  // Buy property if affordable
  if (gameState.pendingAction === "BUY_PROPERTY") {
    const space = gameState.selectedProperty;
    if (player.cash >= space.price && space.price < 200) {
      return { key: 'z', keyCode: 90 };
    } else {
      return { key: 'Shift', keyCode: 16 };
    }
  }
  
  // End turn
  if (gameState.turnPhase === "END") {
    return { key: 'z', keyCode: 90 };
  }
  
  return null;
}

function getRandomAction(gameState) {
  const actions = [
    { key: ' ', keyCode: 32 },
    { key: 'z', keyCode: 90 },
    { key: 'Shift', keyCode: 16 }
  ];
  return actions[Math.floor(Math.random() * actions.length)];
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