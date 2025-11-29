// automated_testing_controller.js - Automated testing

import { getCategorizedElements, getRecipeResult, ELEMENT_RECIPES } from './elements.js';

// Helper to find next undiscovered combination
function findNextCombination(gameState) {
  const discovered = Array.from(gameState.discoveredElements);
  
  // Try all pairs of discovered elements
  for (let i = 0; i < discovered.length; i++) {
    for (let j = i; j < discovered.length; j++) {
      const result = getRecipeResult(discovered[i], discovered[j]);
      if (result && !gameState.discoveredElements.has(result)) {
        return { elem1: discovered[i], elem2: discovered[j], result };
      }
    }
  }
  
  return null;
}

// Helper to navigate to specific element
function navigateToElement(gameState, targetElement) {
  const categorized = getCategorizedElements(gameState.discoveredElements);
  const categories = Object.keys(categorized).sort();
  
  // Find category and index
  let targetCategory = -1;
  let targetIndex = -1;
  
  for (let i = 0; i < categories.length; i++) {
    const elements = categorized[categories[i]];
    const idx = elements.indexOf(targetElement);
    if (idx !== -1) {
      targetCategory = i;
      targetIndex = idx;
      break;
    }
  }
  
  if (targetCategory === -1) return null;
  
  // Determine navigation
  const currentCat = gameState.selectedCategory;
  const currentIdx = gameState.selectedElementIndex;
  
  if (currentCat < targetCategory) {
    return { key: 'ArrowRight', keyCode: 39 };
  } else if (currentCat > targetCategory) {
    return { key: 'ArrowLeft', keyCode: 37 };
  } else {
    // Same category
    if (currentIdx < targetIndex) {
      return { key: 'ArrowDown', keyCode: 40 };
    } else if (currentIdx > targetIndex) {
      return { key: 'ArrowUp', keyCode: 38 };
    } else {
      // At target
      return { key: ' ', keyCode: 32 };
    }
  }
}

function getTestWinAction(gameState) {
  // Strategy: Systematically discover all elements
  
  // If we have a selection, navigate to the second element
  if (gameState.firstSelectedElement && gameState._testTarget) {
    const action = navigateToElement(gameState, gameState._testTarget.elem2);
    if (action && action.keyCode === 32) {
      delete gameState._testTarget;
    }
    return action;
  }
  
  // Find next combination to try
  const combo = findNextCombination(gameState);
  if (combo) {
    gameState._testTarget = combo;
    return navigateToElement(gameState, combo.elem1);
  }
  
  // No more combinations found
  return { key: ' ', keyCode: 32 }; // Keep pressing space
}

function getBasicTestAction(gameState) {
  // Test basic navigation and combination
  if (!gameState._testStep) {
    gameState._testStep = 0;
  }
  
  const categorized = getCategorizedElements(gameState.discoveredElements);
  const categories = Object.keys(categorized).sort();
  
  // Simple pattern: try combining first few elements
  const actions = [
    { key: ' ', keyCode: 32 },  // Select first
    { key: 'ArrowDown', keyCode: 40 },
    { key: ' ', keyCode: 32 },  // Select second
    { key: 'ArrowDown', keyCode: 40 },
    { key: ' ', keyCode: 32 },
    { key: 'ArrowDown', keyCode: 40 },
    { key: ' ', keyCode: 32 },
    { key: 'ArrowRight', keyCode: 39 }
  ];
  
  const action = actions[gameState._testStep % actions.length];
  gameState._testStep++;
  
  return action;
}

function getNavigationTestAction(gameState) {
  // Test all navigation directions
  if (!gameState._navTestStep) {
    gameState._navTestStep = 0;
  }
  
  const actions = [
    { key: 'ArrowDown', keyCode: 40 },
    { key: 'ArrowDown', keyCode: 40 },
    { key: 'ArrowUp', keyCode: 38 },
    { key: 'ArrowRight', keyCode: 39 },
    { key: 'ArrowLeft', keyCode: 37 },
    { key: ' ', keyCode: 32 },
    { key: 'ArrowLeft', keyCode: 37 } // Cancel selection
  ];
  
  const action = actions[gameState._navTestStep % actions.length];
  gameState._navTestStep++;
  
  return action;
}

function getRandomAction(gameState) {
  const actions = [
    { key: 'ArrowUp', keyCode: 38 },
    { key: 'ArrowDown', keyCode: 40 },
    { key: 'ArrowLeft', keyCode: 37 },
    { key: 'ArrowRight', keyCode: 39 },
    { key: ' ', keyCode: 32 }
  ];
  
  const randomIndex = Math.floor(Math.random() * actions.length);
  return actions[randomIndex];
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getNavigationTestAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;