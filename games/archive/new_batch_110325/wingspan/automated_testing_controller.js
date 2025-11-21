// automated_testing_controller.js
import { gameState, ACTIONS, HABITATS, FOOD_TYPES } from './globals.js';
import { canAffordBird } from './game_logic.js';

let framesSinceLastAction = 0;
let lastActionType = null;
let actionCooldown = 0;

function getTestWinAction(gameState) {
  framesSinceLastAction++;
  
  // Wait for animations and messages
  if (gameState.animating || gameState.showingMessage || actionCooldown > 0) {
    actionCooldown--;
    return null;
  }
  
  // Need some delay between actions
  if (framesSinceLastAction < 20) {
    return null;
  }
  
  const phase = gameState.actionPhase;
  
  if (phase === "SELECT_ACTION") {
    framesSinceLastAction = 0;
    actionCooldown = 15;
    
    // Strategy: Prioritize gaining food early, then play birds, then lay eggs
    const totalFood = Object.values(gameState.food).reduce((a, b) => a + b, 0);
    const handSize = gameState.handCards.length;
    const totalBirds = Object.values(gameState.board).reduce((acc, birds) => acc + birds.length, 0);
    
    // Early game: gain food
    if (totalFood < 6 && gameState.round <= 2) {
      lastActionType = ACTIONS.GAIN_FOOD;
      return { keyCode: 37 }; // LEFT for GAIN_FOOD
    }
    
    // Mid game: play birds if we have food
    if (handSize > 0 && totalFood >= 2) {
      const affordableBirds = gameState.handCards.filter(bird => canAffordBird(bird));
      if (affordableBirds.length > 0) {
        lastActionType = ACTIONS.PLAY_BIRD;
        return { keyCode: 38 }; // UP for PLAY_BIRD
      }
    }
    
    // Lay eggs if we have birds
    if (totalBirds > 0) {
      lastActionType = ACTIONS.LAY_EGGS;
      return { keyCode: 40 }; // DOWN for LAY_EGGS
    }
    
    // Draw cards if hand is small
    if (handSize < 3) {
      lastActionType = ACTIONS.DRAW_CARDS;
      return { keyCode: 39 }; // RIGHT for DRAW_CARDS
    }
    
    // Default: gain food
    lastActionType = ACTIONS.GAIN_FOOD;
    return { keyCode: 37 }; // LEFT
    
  } else if (phase === "SELECT_CARD") {
    // Find cheapest affordable bird
    let bestIndex = -1;
    let lowestCost = 999;
    
    for (let i = 0; i < gameState.handCards.length; i++) {
      const bird = gameState.handCards[i];
      if (canAffordBird(bird) && bird.foodCost.length < lowestCost) {
        lowestCost = bird.foodCost.length;
        bestIndex = i;
      }
    }
    
    if (bestIndex === -1) {
      // Can't afford any, cancel
      return { keyCode: 90 }; // Z
    }
    
    // Navigate to best card
    if (gameState.selectedCardIndex < bestIndex) {
      return { keyCode: 39 }; // RIGHT
    } else if (gameState.selectedCardIndex > bestIndex) {
      return { keyCode: 37 }; // LEFT
    } else {
      framesSinceLastAction = 0;
      return { keyCode: 32 }; // SPACE to confirm
    }
    
  } else if (phase === "SELECT_SLOT") {
    // Place at end (rightmost position)
    const habitat = gameState.selectedHabitat;
    const maxSlot = gameState.board[habitat].length;
    
    if (gameState.selectedBirdSlot < maxSlot) {
      return { keyCode: 39 }; // RIGHT
    } else {
      framesSinceLastAction = 0;
      actionCooldown = 15;
      return { keyCode: 32 }; // SPACE to confirm
    }
  }
  
  return null;
}

function getBasicTestAction(gameState) {
  framesSinceLastAction++;
  
  if (gameState.animating || gameState.showingMessage || actionCooldown > 0) {
    actionCooldown--;
    return null;
  }
  
  if (framesSinceLastAction < 25) {
    return null;
  }
  
  const phase = gameState.actionPhase;
  
  if (phase === "SELECT_ACTION") {
    framesSinceLastAction = 0;
    actionCooldown = 15;
    
    // Cycle through actions
    const turn = gameState.turnsThisRound % 4;
    
    if (turn === 0) return { keyCode: 37 }; // GAIN_FOOD
    if (turn === 1) return { keyCode: 39 }; // DRAW_CARDS
    if (turn === 2) return { keyCode: 40 }; // LAY_EGGS
    if (turn === 3) {
      if (gameState.handCards.length > 0) {
        return { keyCode: 38 }; // PLAY_BIRD
      } else {
        return { keyCode: 37 }; // GAIN_FOOD
      }
    }
    
  } else if (phase === "SELECT_CARD") {
    // Select first affordable bird
    for (let i = 0; i < gameState.handCards.length; i++) {
      if (canAffordBird(gameState.handCards[i])) {
        if (gameState.selectedCardIndex < i) {
          return { keyCode: 39 }; // RIGHT
        } else if (gameState.selectedCardIndex > i) {
          return { keyCode: 37 }; // LEFT
        } else {
          framesSinceLastAction = 0;
          return { keyCode: 32 }; // SPACE
        }
      }
    }
    return { keyCode: 90 }; // Z cancel if can't afford
    
  } else if (phase === "SELECT_SLOT") {
    framesSinceLastAction = 0;
    actionCooldown = 15;
    return { keyCode: 32 }; // SPACE - place at current position
  }
  
  return null;
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    default:
      return null;
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;