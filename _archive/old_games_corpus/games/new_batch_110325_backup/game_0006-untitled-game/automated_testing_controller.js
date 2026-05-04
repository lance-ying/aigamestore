import { gameState, GAME_PHASES } from './globals.js';

let lastAction = null;
let actionCooldown = 0;
let stuckCounter = 0;
let lastPosition = 0;
let decisionHistory = [];

function getTestWinAction(gameState) {
  // Cooldown for actions
  if (actionCooldown > 0) {
    actionCooldown--;
    return null;
  }
  
  // Handle minigame
  if (gameState.inMinigame) {
    if (gameState.minigameComplete) {
      return null;
    }
    
    // Perform well in minigames
    if (Math.random() > 0.2) { // 80% success rate
      actionCooldown = 2;
      return { keyCode: 32 }; // Space
    } else {
      actionCooldown = 2;
      return { keyCode: 90 }; // Z
    }
  }
  
  // Handle decisions - choose optimal options
  if (gameState.awaitingDecision) {
    const options = gameState.decisionOptions;
    if (options && options.length > 0) {
      // Strategy: Pick best financial option
      let bestOption = 0;
      
      // Analyze options
      const optionTexts = options.map(o => o.text.toLowerCase());
      
      // Education: Choose college if we can afford it
      if (optionTexts.some(t => t.includes('college'))) {
        if (gameState.money >= 5000) {
          bestOption = optionTexts.findIndex(t => t.includes('college'));
        } else {
          bestOption = optionTexts.findIndex(t => t.includes('trade'));
        }
      }
      // Career: Choose highest level we qualify for
      else if (optionTexts.some(t => t.includes('career') || t.includes('job'))) {
        if (gameState.careerLevel >= 2) {
          bestOption = optionTexts.findIndex(t => t.includes('high level'));
        } else if (gameState.hasCollege) {
          bestOption = optionTexts.findIndex(t => t.includes('mid career'));
        } else {
          bestOption = optionTexts.findIndex(t => t.includes('entry'));
        }
      }
      // Investment: Choose safe if low money, risky if high money
      else if (optionTexts.some(t => t.includes('investment'))) {
        if (gameState.money >= 10000) {
          bestOption = optionTexts.findIndex(t => t.includes('risky'));
        } else if (gameState.money >= 2000) {
          bestOption = optionTexts.findIndex(t => t.includes('safe'));
        } else {
          bestOption = optionTexts.findIndex(t => t.includes('skip'));
        }
      }
      
      // Navigate to best option
      if (gameState.selectedOption < bestOption) {
        actionCooldown = 5;
        return { keyCode: 40 }; // Down
      } else if (gameState.selectedOption > bestOption) {
        actionCooldown = 5;
        return { keyCode: 38 }; // Up
      } else {
        actionCooldown = 10;
        return { keyCode: 32 }; // Space to confirm
      }
    }
  }
  
  // Spin if ready
  if (!gameState.isSpinning && !gameState.isMoving && !gameState.awaitingDecision) {
    actionCooldown = 60;
    return { keyCode: 32 }; // Space to spin
  }
  
  return null;
}

function getBasicTestAction(gameState) {
  // Cooldown for actions
  if (actionCooldown > 0) {
    actionCooldown--;
    return null;
  }
  
  // Handle minigame with random inputs
  if (gameState.inMinigame && !gameState.minigameComplete) {
    actionCooldown = 3;
    return Math.random() > 0.5 ? { keyCode: 32 } : { keyCode: 90 };
  }
  
  // Handle decisions - choose randomly
  if (gameState.awaitingDecision) {
    const rand = Math.random();
    if (rand < 0.3) {
      actionCooldown = 5;
      return { keyCode: 40 }; // Down
    } else if (rand < 0.6) {
      actionCooldown = 5;
      return { keyCode: 38 }; // Up
    } else {
      actionCooldown = 10;
      return { keyCode: 32 }; // Confirm
    }
  }
  
  // Spin
  if (!gameState.isSpinning && !gameState.isMoving) {
    actionCooldown = 50;
    return { keyCode: 32 };
  }
  
  return null;
}

function getPoorDecisionAction(gameState) {
  // Similar to basic test but deliberately makes poor choices
  if (actionCooldown > 0) {
    actionCooldown--;
    return null;
  }
  
  // Handle minigame poorly
  if (gameState.inMinigame && !gameState.minigameComplete) {
    // Only 30% success rate
    if (Math.random() > 0.7) {
      actionCooldown = 3;
      return { keyCode: 32 };
    }
    actionCooldown = 5;
    return null;
  }
  
  // Handle decisions - choose worst options
  if (gameState.awaitingDecision) {
    const options = gameState.decisionOptions;
    if (options && options.length > 0) {
      const optionTexts = options.map(o => o.text.toLowerCase());
      
      let worstOption = 0;
      
      // Choose skip or cheapest option
      const skipIdx = optionTexts.findIndex(t => t.includes('skip'));
      if (skipIdx >= 0) {
        worstOption = skipIdx;
      }
      
      if (gameState.selectedOption < worstOption) {
        actionCooldown = 5;
        return { keyCode: 40 };
      } else if (gameState.selectedOption > worstOption) {
        actionCooldown = 5;
        return { keyCode: 38 };
      } else {
        actionCooldown = 10;
        return { keyCode: 32 };
      }
    }
  }
  
  // Spin
  if (!gameState.isSpinning && !gameState.isMoving) {
    actionCooldown = 50;
    return { keyCode: 32 };
  }
  
  return null;
}

export function get_automated_testing_action(gameState) {
  // Don't act during game over or start
  if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
      gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE ||
      gameState.gamePhase === GAME_PHASES.START) {
    return null;
  }
  
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getPoorDecisionAction(gameState);
    default:
      return null;
  }
}

// Expose globally
window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;