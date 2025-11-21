// automated_testing_controller.js - Automated testing

import { gameState, GAME_PHASES, PLAY_PHASES, GLOBAL_TARGETS, STANDARD_PROJECTS } from './globals.js';

function getTestWinAction(gameState) {
  // Strategy: Maximize global parameter increases efficiently
  
  if (gameState.playPhase === PLAY_PHASES.RESEARCH) {
    // Select cards that increase global parameters
    if (gameState.hand.length > 0) {
      return { keyCode: 32, key: ' ' }; // Select current card
    }
  } else if (gameState.playPhase === PLAY_PHASES.ACTION) {
    if (!gameState.actionType) {
      // Prioritize playing cards if we have affordable ones
      if (gameState.hand.length > 0) {
        const affordableCards = gameState.hand.filter(c => c.cost <= gameState.mc);
        if (affordableCards.length > 0) {
          return { keyCode: 32, key: ' ' }; // Play card from hand
        }
      }
      
      // Check if we can afford any standard projects
      if (gameState.mc >= STANDARD_PROJECTS.OCEAN.cost && gameState.oceans < GLOBAL_TARGETS.OCEANS) {
        return { keyCode: 40 }; // Down to standard project
      } else if (gameState.mc >= STANDARD_PROJECTS.TEMP.cost && gameState.temperature < GLOBAL_TARGETS.TEMPERATURE) {
        return { keyCode: 40 }; // Down to standard project
      } else if (gameState.mc >= STANDARD_PROJECTS.OXYGEN.cost && gameState.oxygen < GLOBAL_TARGETS.OXYGEN) {
        return { keyCode: 40 }; // Down to standard project
      }
      
      // End generation
      return { keyCode: 40 }; // Navigate down
    } else if (gameState.actionType === "card") {
      // Find best card to play
      let bestIndex = -1;
      let bestScore = -1;
      
      for (let i = 0; i < gameState.hand.length; i++) {
        const card = gameState.hand[i];
        if (card.cost <= gameState.mc) {
          let score = 0;
          const effect = card.effect;
          
          // Prioritize cards that increase needed parameters
          if (effect.type === "ocean" && gameState.oceans < GLOBAL_TARGETS.OCEANS) {
            score += effect.value * 10;
          }
          if (effect.type === "temp" && gameState.temperature < GLOBAL_TARGETS.TEMPERATURE) {
            score += effect.value * 8;
          }
          if (effect.type === "oxygen" && gameState.oxygen < GLOBAL_TARGETS.OXYGEN) {
            score += effect.value * 8;
          }
          if (effect.type === "combo") {
            score += 15;
          }
          
          // Consider production value
          if (effect.type === "mcProduction") {
            score += effect.value * 3;
          }
          
          if (score > bestScore) {
            bestScore = score;
            bestIndex = i;
          }
        }
      }
      
      if (bestIndex >= 0) {
        // Navigate to best card
        if (gameState.selectedCardIndex < bestIndex) {
          return { keyCode: 39 }; // Right
        } else if (gameState.selectedCardIndex > bestIndex) {
          return { keyCode: 37 }; // Left
        } else {
          return { keyCode: 32, key: ' ' }; // Play
        }
      } else {
        return { keyCode: 90, key: 'z' }; // Back
      }
    } else if (gameState.actionType === "standard_project") {
      // Choose best standard project
      const needsOcean = gameState.oceans < GLOBAL_TARGETS.OCEANS;
      const needsTemp = gameState.temperature < GLOBAL_TARGETS.TEMPERATURE;
      const needsOxygen = gameState.oxygen < GLOBAL_TARGETS.OXYGEN;
      
      let targetProject = -1;
      
      if (needsOcean && gameState.mc >= STANDARD_PROJECTS.OCEAN.cost) {
        targetProject = 0;
      } else if (needsTemp && gameState.mc >= STANDARD_PROJECTS.TEMP.cost) {
        targetProject = 3;
      } else if (needsOxygen && gameState.mc >= STANDARD_PROJECTS.OXYGEN.cost) {
        targetProject = 4;
      } else {
        return { keyCode: 90, key: 'z' }; // Back
      }
      
      if (gameState.menuSelection < targetProject) {
        return { keyCode: 40 }; // Down
      } else if (gameState.menuSelection > targetProject) {
        return { keyCode: 38 }; // Up
      } else {
        return { keyCode: 32, key: ' ' }; // Build
      }
    }
  } else if (gameState.playPhase === PLAY_PHASES.PRODUCTION) {
    return { keyCode: 32, key: ' ' }; // Continue
  }
  
  return { keyCode: 32, key: ' ' }; // Default: space
}

function getBasicTestAction(gameState) {
  // Basic testing: just play through the game
  
  if (gameState.playPhase === PLAY_PHASES.RESEARCH) {
    return { keyCode: 32, key: ' ' }; // Accept card
  } else if (gameState.playPhase === PLAY_PHASES.ACTION) {
    if (!gameState.actionType) {
      // Randomly choose action
      if (Math.random() < 0.5 && gameState.hand.length > 0) {
        return { keyCode: 32, key: ' ' }; // Play card
      } else {
        return { keyCode: 40 }; // Navigate down
      }
    } else if (gameState.actionType === "card") {
      if (gameState.hand.length > 0 && gameState.hand[gameState.selectedCardIndex].cost <= gameState.mc) {
        return { keyCode: 32, key: ' ' }; // Play
      } else {
        return { keyCode: 90, key: 'z' }; // Back
      }
    } else if (gameState.actionType === "standard_project") {
      return { keyCode: 90, key: 'z' }; // Back
    }
  } else if (gameState.playPhase === PLAY_PHASES.PRODUCTION) {
    return { keyCode: 32, key: ' ' }; // Continue
  }
  
  return { keyCode: 32, key: ' ' };
}

export function get_automated_testing_action(gameState) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return null;
  }
  
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