// automated_testing_controller.js
import { gameState } from './globals.js';
import { CATEGORIES } from './globals.js';
import { calculateScore, countDice } from './dice.js';

let testState = {
  turnsCompleted: 0,
  lastAction: null,
  actionDelay: 0,
  targetCategory: null
};

function getTestBasicAction(state) {
  // Basic testing: random valid actions
  testState.actionDelay++;
  
  // Add delay between actions
  if (testState.actionDelay < 10) {
    return null;
  }
  testState.actionDelay = 0;
  
  const currentPlayer = state.players[state.currentPlayerIndex];
  if (currentPlayer.isAI) {
    return null; // Let AI handle its turn
  }
  
  if (state.mustSelectCategory || state.rollsLeft === 0) {
    // Select a random available category
    const available = currentPlayer.getAvailableCategories();
    if (available.length > 0) {
      const randomCat = available[Math.floor(Math.random() * available.length)];
      const targetIndex = CATEGORIES.findIndex(cat => cat.id === randomCat.id);
      
      if (state.selectedCategoryIndex !== targetIndex) {
        return { key: 'ArrowRight', keyCode: 39 };
      } else {
        testState.turnsCompleted++;
        return { key: 'z', keyCode: 90 };
      }
    }
  } else if (state.rollsLeft > 0) {
    // Randomly hold/unhold dice or roll
    const action = Math.random();
    if (action < 0.3 && state.selectedDiceIndex >= 0) {
      // Toggle hold on selected die
      return { key: ' ', keyCode: 32 };
    } else if (action < 0.5) {
      // Select different die
      return { key: 'ArrowDown', keyCode: 40 };
    } else {
      // Roll dice
      return { key: ' ', keyCode: 32 };
    }
  }
  
  return null;
}

function getTestWinAction(state) {
  // Optimal strategy to win
  testState.actionDelay++;
  
  if (testState.actionDelay < 8) {
    return null;
  }
  testState.actionDelay = 0;
  
  const currentPlayer = state.players[state.currentPlayerIndex];
  if (currentPlayer.isAI) {
    return null;
  }
  
  if (state.mustSelectCategory || state.rollsLeft === 0) {
    // Select best available category
    const available = currentPlayer.getAvailableCategories();
    if (available.length === 0) return null;
    
    // Calculate best category
    let bestCategory = available[0];
    let bestPriority = -1;
    
    available.forEach(cat => {
      const score = calculateScore(cat.id, state.diceValues);
      let priority = score;
      
      // Prioritize high-value categories
      if (cat.id === 'kniffel' && score > 0) priority += 100;
      if (cat.id === 'large_straight' && score > 0) priority += 50;
      if (cat.id === 'full_house' && score > 0) priority += 30;
      if (cat.id === 'four_kind' && score > 0) priority += 40;
      
      // Upper section strategy for bonus
      if (cat.upper && currentPlayer.upperSectionScore < 63) {
        if (score >= cat.id.includes('six') ? 12 : 9) {
          priority += 10;
        }
      }
      
      if (priority > bestPriority) {
        bestPriority = priority;
        bestCategory = cat;
      }
    });
    
    const targetIndex = CATEGORIES.findIndex(cat => cat.id === bestCategory.id);
    
    if (state.selectedCategoryIndex !== targetIndex) {
      return state.selectedCategoryIndex < targetIndex 
        ? { key: 'ArrowRight', keyCode: 39 }
        : { key: 'ArrowLeft', keyCode: 37 };
    } else {
      return { key: 'z', keyCode: 90 };
    }
  } else if (state.rollsLeft > 0) {
    // Intelligent hold strategy
    const counts = countDice(state.diceValues);
    let maxCount = 0;
    let maxValue = 0;
    
    for (let val in counts) {
      if (counts[val] > maxCount || (counts[val] === maxCount && parseInt(val) > maxValue)) {
        maxCount = counts[val];
        maxValue = parseInt(val);
      }
    }
    
    // Hold valuable dice
    if (maxCount >= 2) {
      // Find dice with max value and hold them
      for (let i = 0; i < state.diceValues.length; i++) {
        const shouldHold = state.diceValues[i] === maxValue;
        if (state.diceHeld[i] !== shouldHold) {
          if (state.selectedDiceIndex !== i) {
            return i > state.selectedDiceIndex 
              ? { key: 'ArrowDown', keyCode: 40 }
              : { key: 'ArrowUp', keyCode: 38 };
          } else {
            return { key: ' ', keyCode: 32 }; // Toggle hold
          }
        }
      }
    }
    
    // All dice properly held, roll
    return { key: ' ', keyCode: 32 };
  }
  
  return null;
}

export function get_automated_testing_action(state) {
  if (!state || state.gamePhase !== "PLAYING") {
    return null;
  }
  
  switch (state.controlMode) {
    case "TEST_1":
      return getTestBasicAction(state);
    case "TEST_2":
      return getTestWinAction(state);
    default:
      return null;
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;