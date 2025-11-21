// automated_testing_controller.js - Automated testing

import { gameState, PHASE_PLAYING } from './globals.js';
import { HABITAT_FOREST, HABITAT_GRASSLAND, HABITAT_WETLAND } from './globals.js';
import { FOOD_SEED, FOOD_BERRY, FOOD_FISH, FOOD_RODENT } from './globals.js';

let actionHistory = [];
let stuckCounter = 0;

function getTestWinAction(gameState) {
  if (gameState.gamePhase !== PHASE_PLAYING) return null;
  
  // Strategy: Build engine in Forest for food, then play high-value birds
  
  if (gameState.uiMode === "ACTION_SELECT") {
    // Priority: Play bird > Gain food > Draw cards > Lay eggs
    
    // Check if we have playable birds
    const playableBirds = getPlayableBirds();
    
    if (playableBirds.length > 0 && gameState.currentRound <= 3) {
      // Select Play Bird action
      const targetIndex = 0; // Play Bird is first
      if (gameState.menuIndex !== targetIndex) {
        return { keyCode: gameState.menuIndex < targetIndex ? 40 : 38 }; // DOWN or UP
      }
      return { keyCode: 32 }; // SPACE to confirm
    }
    
    // Check if we need food
    const totalFood = gameState.foodSupply[FOOD_SEED] + 
                     gameState.foodSupply[FOOD_BERRY] + 
                     gameState.foodSupply[FOOD_FISH] + 
                     gameState.foodSupply[FOOD_RODENT];
    
    if (totalFood < 3) {
      // Select Gain Food
      const targetIndex = 1;
      if (gameState.menuIndex !== targetIndex) {
        return { keyCode: gameState.menuIndex < targetIndex ? 40 : 38 };
      }
      return { keyCode: 32 };
    }
    
    // Draw cards if hand is small
    if (gameState.hand.length < 3) {
      const targetIndex = 3; // Draw Cards
      if (gameState.menuIndex !== targetIndex) {
        return { keyCode: gameState.menuIndex < targetIndex ? 40 : 38 };
      }
      return { keyCode: 32 };
    }
    
    // Lay eggs on valuable birds
    const birdsWithSpace = getBirdsWithEggSpace();
    if (birdsWithSpace.length > 0) {
      const targetIndex = 2; // Lay Eggs
      if (gameState.menuIndex !== targetIndex) {
        return { keyCode: gameState.menuIndex < targetIndex ? 40 : 38 };
      }
      return { keyCode: 32 };
    }
    
    // Default: Draw cards
    const targetIndex = 3;
    if (gameState.menuIndex !== targetIndex) {
      return { keyCode: gameState.menuIndex < targetIndex ? 40 : 38 };
    }
    return { keyCode: 32 };
  }
  
  if (gameState.uiMode === "HABITAT_SELECT") {
    // Prioritize Forest for engine building
    const targetHabitat = HABITAT_FOREST;
    const habitats = [HABITAT_FOREST, HABITAT_GRASSLAND, HABITAT_WETLAND];
    const targetIndex = habitats.indexOf(targetHabitat);
    
    if (gameState.menuIndex !== targetIndex) {
      return { keyCode: gameState.menuIndex < targetIndex ? 39 : 37 }; // RIGHT or LEFT
    }
    return { keyCode: 32 };
  }
  
  if (gameState.uiMode === "CARD_SELECT") {
    // Find best card to play in selected habitat
    const bestCardIndex = findBestCardForHabitat(gameState.selectedHabitat);
    
    if (bestCardIndex === -1) {
      return { keyCode: 90 }; // Z to cancel
    }
    
    if (gameState.menuIndex !== bestCardIndex) {
      return { keyCode: gameState.menuIndex < bestCardIndex ? 39 : 37 };
    }
    return { keyCode: 32 };
  }
  
  if (gameState.uiMode === "FOOD_SELECT") {
    // Prefer SEED early game, then diversify
    const foods = [FOOD_SEED, FOOD_BERRY, FOOD_FISH, FOOD_RODENT];
    let targetIndex = 0; // Default to SEED
    
    if (gameState.currentRound > 2) {
      // Later game, pick what we need most
      const counts = foods.map(f => gameState.foodSupply[f]);
      targetIndex = counts.indexOf(Math.min(...counts));
    }
    
    if (gameState.menuIndex !== targetIndex) {
      return { keyCode: gameState.menuIndex < targetIndex ? 39 : 37 };
    }
    return { keyCode: 32 };
  }
  
  if (gameState.uiMode === "EGG_SELECT") {
    // Lay egg on highest value bird with space
    const birds = getBirdsWithEggSpace();
    if (birds.length === 0) {
      return { keyCode: 90 }; // Cancel
    }
    
    // Just confirm first available
    return { keyCode: 32 };
  }
  
  return null;
}

function getPlayableBirds() {
  const playable = [];
  
  for (const card of gameState.hand) {
    const foodNeeded = {};
    for (const food of card.foodCost) {
      foodNeeded[food] = (foodNeeded[food] || 0) + 1;
    }
    
    let canAfford = true;
    for (const food in foodNeeded) {
      if (gameState.foodSupply[food] < foodNeeded[food]) {
        canAfford = false;
        break;
      }
    }
    
    if (canAfford) {
      playable.push(card);
    }
  }
  
  return playable;
}

function findBestCardForHabitat(habitat) {
  for (let i = 0; i < gameState.hand.length; i++) {
    const card = gameState.hand[i];
    if (card.habitat !== habitat) continue;
    
    const foodNeeded = {};
    for (const food of card.foodCost) {
      foodNeeded[food] = (foodNeeded[food] || 0) + 1;
    }
    
    let canAfford = true;
    for (const food in foodNeeded) {
      if (gameState.foodSupply[food] < foodNeeded[food]) {
        canAfford = false;
        break;
      }
    }
    
    if (canAfford) {
      return i;
    }
  }
  
  return -1;
}

function getBirdsWithEggSpace() {
  const birds = [];
  for (const habitat in gameState.habitats) {
    for (const bird of gameState.habitats[habitat]) {
      if (bird.eggs < bird.maxEggs) {
        birds.push(bird);
      }
    }
  }
  return birds;
}

function getBasicTestAction(gameState) {
  if (gameState.gamePhase !== PHASE_PLAYING) return null;
  
  // Simple testing: cycle through actions
  if (gameState.uiMode === "ACTION_SELECT") {
    // Cycle actions with down arrow and select
    if (Math.random() < 0.3) {
      return { keyCode: 40 }; // DOWN
    }
    return { keyCode: 32 }; // SPACE
  }
  
  if (gameState.uiMode === "HABITAT_SELECT") {
    if (Math.random() < 0.3) {
      return { keyCode: 39 }; // RIGHT
    }
    return { keyCode: 32 };
  }
  
  if (gameState.uiMode === "CARD_SELECT") {
    if (gameState.hand.length === 0) {
      return { keyCode: 90 }; // Cancel
    }
    if (Math.random() < 0.5) {
      return { keyCode: 32 }; // Try to play
    }
    return { keyCode: 90 }; // Cancel
  }
  
  if (gameState.uiMode === "FOOD_SELECT") {
    return { keyCode: 32 };
  }
  
  if (gameState.uiMode === "EGG_SELECT") {
    return { keyCode: 32 };
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

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;