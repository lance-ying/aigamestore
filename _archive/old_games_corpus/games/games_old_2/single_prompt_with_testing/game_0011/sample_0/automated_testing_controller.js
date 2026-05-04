// automated_testing_controller.js
import { tryCombination, ELEMENT_RECIPES } from './globals.js';

// Test helper: Get all possible new combinations
function getAllPossibleCombinations(discoveredElements) {
  const combinations = [];
  
  for (let i = 0; i < discoveredElements.length; i++) {
    for (let j = i; j < discoveredElements.length; j++) {
      const elem1 = discoveredElements[i];
      const elem2 = discoveredElements[j];
      const result = tryCombination(elem1, elem2);
      
      if (result && !discoveredElements.includes(result)) {
        combinations.push({ elem1, elem2, result });
      }
    }
  }
  
  return combinations;
}

// TEST_1: Basic mechanics test
let test1State = {
  step: 0,
  targetCombinations: [
    { elem1: "Fire", elem2: "Earth", expected: "Lava" },
    { elem1: "Fire", elem2: "Wind", expected: "Energy" },
    { elem1: "Fire", elem2: "Water", expected: "Steam" },
    { elem1: "Earth", elem2: "Wind", expected: "Dust" },
    { elem1: "Earth", elem2: "Water", expected: "Mud" }
  ],
  currentCombination: null,
  waitFrames: 0
};

function getTest1Action(gameState) {
  const { step, targetCombinations, waitFrames } = test1State;
  
  // Wait between actions
  if (waitFrames > 0) {
    test1State.waitFrames--;
    return null;
  }
  
  // If we've completed all test combinations, just return null
  if (step >= targetCombinations.length) {
    return null;
  }
  
  const target = targetCombinations[step];
  
  // Navigate to first element
  if (!gameState.selectedSlots[0]) {
    const idx1 = gameState.discoveredElements.indexOf(target.elem1);
    if (gameState.elementCursor !== idx1) {
      if (gameState.elementCursor < idx1) {
        return { keyCode: 40, key: "ArrowDown" }; // Down
      } else {
        return { keyCode: 38, key: "ArrowUp" }; // Up
      }
    } else {
      return { keyCode: 32, key: " " }; // Select
    }
  }
  
  // Navigate to second element
  if (!gameState.selectedSlots[1]) {
    const idx2 = gameState.discoveredElements.indexOf(target.elem2);
    if (gameState.elementCursor !== idx2) {
      if (gameState.elementCursor < idx2) {
        return { keyCode: 40, key: "ArrowDown" };
      } else {
        return { keyCode: 38, key: "ArrowUp" };
      }
    } else {
      return { keyCode: 32, key: " " }; // Select and combine
    }
  }
  
  // Both slots filled, combine
  if (gameState.selectedSlots[0] && gameState.selectedSlots[1]) {
    test1State.step++;
    test1State.waitFrames = 30; // Wait 30 frames before next combination
    return { keyCode: 32, key: " " };
  }
  
  return null;
}

// TEST_2: Win condition test - discover all elements
let test2State = {
  initialized: false,
  allCombinations: [],
  currentTarget: null,
  lastElementCount: 4,
  stuckCounter: 0
};

function getTest2Action(gameState) {
  // Initialize or update combinations list
  if (!test2State.initialized || gameState.discoveredElements.length !== test2State.lastElementCount) {
    test2State.allCombinations = getAllPossibleCombinations(gameState.discoveredElements);
    test2State.lastElementCount = gameState.discoveredElements.length;
    test2State.initialized = true;
    test2State.currentTarget = null;
    test2State.stuckCounter = 0;
  }
  
  // Check if we're stuck
  if (test2State.stuckCounter > 200) {
    // Clear and try new combination
    if (gameState.selectedSlots[0] || gameState.selectedSlots[1]) {
      return { keyCode: 90, key: "z" }; // Clear
    }
    test2State.stuckCounter = 0;
    test2State.currentTarget = null;
  }
  
  test2State.stuckCounter++;
  
  // If we have combinations to try
  if (test2State.allCombinations.length > 0 && !test2State.currentTarget) {
    test2State.currentTarget = test2State.allCombinations.shift();
  }
  
  if (!test2State.currentTarget) {
    return null; // No more combinations
  }
  
  const target = test2State.currentTarget;
  
  // Navigate to first element
  if (!gameState.selectedSlots[0]) {
    const idx1 = gameState.discoveredElements.indexOf(target.elem1);
    if (idx1 === -1) {
      test2State.currentTarget = null;
      return null;
    }
    
    if (gameState.elementCursor !== idx1) {
      if (gameState.elementCursor < idx1) {
        return { keyCode: 40, key: "ArrowDown" };
      } else {
        return { keyCode: 38, key: "ArrowUp" };
      }
    } else {
      return { keyCode: 32, key: " " };
    }
  }
  
  // Navigate to second element
  if (!gameState.selectedSlots[1]) {
    const idx2 = gameState.discoveredElements.indexOf(target.elem2);
    if (idx2 === -1) {
      test2State.currentTarget = null;
      return { keyCode: 90, key: "z" }; // Clear
    }
    
    if (gameState.elementCursor !== idx2) {
      if (gameState.elementCursor < idx2) {
        return { keyCode: 40, key: "ArrowDown" };
      } else {
        return { keyCode: 38, key: "ArrowUp" };
      }
    } else {
      return { keyCode: 32, key: " " };
    }
  }
  
  // Both slots filled, combine
  if (gameState.selectedSlots[0] && gameState.selectedSlots[1]) {
    test2State.currentTarget = null;
    test2State.stuckCounter = 0;
    return { keyCode: 32, key: " " };
  }
  
  return null;
}

// TEST_3: Edge cases and error handling
let test3State = {
  step: 0,
  waitFrames: 0,
  testCases: [
    { type: "duplicate", elem1: "Fire", elem2: "Fire" },
    { type: "invalid", elem1: "Fire", elem2: "Fire" },
    { type: "clear", action: "clear" },
    { type: "navigate_bounds", action: "up_spam" },
    { type: "navigate_bounds", action: "down_spam" }
  ]
};

function getTest3Action(gameState) {
  if (test3State.waitFrames > 0) {
    test3State.waitFrames--;
    return null;
  }
  
  if (test3State.step >= test3State.testCases.length) {
    return null;
  }
  
  const testCase = test3State.testCases[test3State.step];
  
  if (testCase.type === "duplicate" || testCase.type === "invalid") {
    // Try to combine same element with itself
    if (!gameState.selectedSlots[0]) {
      const idx = gameState.discoveredElements.indexOf(testCase.elem1);
      if (gameState.elementCursor !== idx) {
        return gameState.elementCursor < idx ? 
          { keyCode: 40, key: "ArrowDown" } : 
          { keyCode: 38, key: "ArrowUp" };
      } else {
        return { keyCode: 32, key: " " };
      }
    }
    
    if (!gameState.selectedSlots[1]) {
      return { keyCode: 32, key: " " }; // Select same element
    }
    
    // Combine
    test3State.step++;
    test3State.waitFrames = 20;
    return { keyCode: 32, key: " " };
  }
  
  if (testCase.type === "clear") {
    test3State.step++;
    test3State.waitFrames = 10;
    return { keyCode: 90, key: "z" };
  }
  
  if (testCase.type === "navigate_bounds") {
    if (testCase.action === "up_spam") {
      if (test3State.waitFrames === 0) {
        test3State.waitFrames = 20;
      }
      return { keyCode: 38, key: "ArrowUp" };
    }
    
    if (testCase.action === "down_spam") {
      if (test3State.waitFrames === 0) {
        test3State.step++;
        test3State.waitFrames = 20;
      }
      return { keyCode: 40, key: "ArrowDown" };
    }
  }
  
  return null;
}

// Random action for default testing
function getRandomAction(gameState) {
  const actions = [
    { keyCode: 38, key: "ArrowUp" },
    { keyCode: 40, key: "ArrowDown" },
    { keyCode: 32, key: " " },
    { keyCode: 90, key: "z" }
  ];
  
  const randomIdx = Math.floor(Math.random() * actions.length);
  return actions[randomIdx];
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getTest1Action(gameState);
    case "TEST_2":
      return getTest2Action(gameState);
    case "TEST_3":
      return getTest3Action(gameState);
    default:
      return getRandomAction(gameState);
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;