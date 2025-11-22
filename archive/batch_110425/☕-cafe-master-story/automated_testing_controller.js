// automated_testing_controller.js - Automated testing

import {
  gameState,
  PHASE_PLAYING,
  KEY_SPACE,
  KEY_SHIFT,
  KEY_LEFT,
  KEY_RIGHT,
  KEY_UP,
  KEY_DOWN,
  KEY_Z,
  FURNITURE_TYPES,
  INGREDIENTS
} from './globals.js';
import { getAvailableIngredients, getAvailableFurniture } from './cafe_management.js';

// Test 1: Basic functionality test
function getTest1Action(state) {
  if (state.gamePhase !== PHASE_PLAYING) return null;
  
  state.testFrameCount++;
  
  // Phase 1: Create recipes (frames 0-300)
  if (state.testFrameCount < 300) {
    if (!state.menuOpen && state.testFrameCount % 60 === 10) {
      return { keyCode: KEY_SHIFT };
    }
    
    if (state.menuOpen) {
      if (state.selectedMenuTab !== 0) {
        return { keyCode: KEY_LEFT };
      }
      
      if (state.testFrameCount % 60 === 20) {
        return { keyCode: KEY_DOWN }; // Select base
      }
      if (state.testFrameCount % 60 === 30) {
        return { keyCode: KEY_RIGHT }; // Add addition
      }
      if (state.testFrameCount % 60 === 40) {
        return { keyCode: KEY_SPACE }; // Create recipe
      }
      if (state.testFrameCount % 60 === 50) {
        return { keyCode: KEY_SHIFT }; // Close menu
      }
    }
  }
  
  // Phase 2: Place furniture (frames 300-600)
  if (state.testFrameCount >= 300 && state.testFrameCount < 600) {
    if (!state.menuOpen && state.testFrameCount % 60 === 10) {
      return { keyCode: KEY_SHIFT };
    }
    
    if (state.menuOpen && !state.placementMode) {
      if (state.selectedMenuTab !== 1) {
        return { keyCode: KEY_RIGHT };
      }
      
      if (state.testFrameCount % 60 === 20) {
        return { keyCode: KEY_DOWN }; // Select furniture
      }
      if (state.testFrameCount % 60 === 30 && state.selectedFurniture) {
        return { keyCode: KEY_SPACE }; // Enter placement mode
      }
    }
    
    if (state.placementMode) {
      if (state.testFrameCount % 60 === 35) {
        return { keyCode: KEY_RIGHT };
      }
      if (state.testFrameCount % 60 === 40) {
        return { keyCode: KEY_DOWN };
      }
      if (state.testFrameCount % 60 === 45) {
        return { keyCode: KEY_SPACE }; // Place
      }
      if (state.testFrameCount % 60 === 50) {
        return { keyCode: KEY_SHIFT }; // Close menu
      }
    }
  }
  
  // Phase 3: Serve customers (frames 600+)
  if (state.testFrameCount >= 600) {
    if (state.customers.length > 0 && state.testFrameCount % 30 === 0) {
      return { keyCode: KEY_SPACE }; // Try to serve
    }
  }
  
  return null;
}

// Test 2: Win condition test - optimal strategy
function getTest2Action(state) {
  if (state.gamePhase !== PHASE_PLAYING) return null;
  
  state.testFrameCount++;
  
  // Aggressive strategy: Create recipes, place furniture, serve customers
  const available = getAvailableIngredients();
  const availableFurniture = getAvailableFurniture();
  
  // Step 1: Create diverse recipes quickly (frames 0-500)
  if (state.testFrameCount < 500 && state.menu.length < 10) {
    if (!state.menuOpen && state.testFrameCount % 40 === 5) {
      return { keyCode: KEY_SHIFT };
    }
    
    if (state.menuOpen) {
      if (state.selectedMenuTab !== 0) {
        return { keyCode: KEY_LEFT };
      }
      
      const cycle = state.testFrameCount % 40;
      if (cycle === 10) return { keyCode: KEY_DOWN };
      if (cycle === 15) return { keyCode: KEY_RIGHT };
      if (cycle === 20) return { keyCode: KEY_RIGHT };
      if (cycle === 25) return { keyCode: KEY_SPACE };
      if (cycle === 30) return { keyCode: KEY_SHIFT };
    }
  }
  
  // Step 2: Place high-atmosphere furniture (frames 500-1500)
  if (state.testFrameCount >= 500 && state.testFrameCount < 1500 && state.furniture.length < 15) {
    if (!state.menuOpen && state.testFrameCount % 50 === 5) {
      return { keyCode: KEY_SHIFT };
    }
    
    if (state.menuOpen && !state.placementMode) {
      if (state.selectedMenuTab !== 1) {
        return { keyCode: KEY_RIGHT };
      }
      
      const cycle = state.testFrameCount % 50;
      if (cycle === 10) return { keyCode: KEY_DOWN };
      if (cycle === 15 && state.selectedFurniture) return { keyCode: KEY_SPACE };
    }
    
    if (state.placementMode) {
      const cycle = state.testFrameCount % 50;
      if (cycle === 20) return { keyCode: KEY_RIGHT };
      if (cycle === 25) return { keyCode: KEY_DOWN };
      if (cycle === 30) return { keyCode: KEY_SPACE };
      if (cycle === 35) return { keyCode: KEY_SHIFT };
    }
  }
  
  // Step 3: Continuously serve customers
  if (state.testFrameCount >= 500) {
    if (state.customers.length > 0 && state.testFrameCount % 20 === 0) {
      return { keyCode: KEY_SPACE };
    }
  }
  
  // Occasionally create more recipes as new ingredients unlock
  if (state.testFrameCount >= 1500 && state.testFrameCount % 200 === 0 && state.menu.length < 20) {
    if (!state.menuOpen) {
      return { keyCode: KEY_SHIFT };
    }
  }
  
  return null;
}

// Test 3: Recipe variety test
function getTest3Action(state) {
  if (state.gamePhase !== PHASE_PLAYING) return null;
  
  state.testFrameCount++;
  
  // Systematically create recipes with different combinations
  if (state.menu.length < 20) {
    if (!state.menuOpen && state.testFrameCount % 50 === 5) {
      return { keyCode: KEY_SHIFT };
    }
    
    if (state.menuOpen) {
      if (state.selectedMenuTab !== 0) {
        return { keyCode: KEY_LEFT };
      }
      
      const cycle = state.testFrameCount % 50;
      
      // Cycle through bases
      if (cycle === 10) {
        return { keyCode: KEY_DOWN };
      }
      
      // Add varying numbers of additions
      const numAdditions = (Math.floor(state.testFrameCount / 50) % 3) + 1;
      for (let i = 0; i < numAdditions; i++) {
        if (cycle === 15 + i * 3) {
          return { keyCode: KEY_RIGHT };
        }
      }
      
      if (cycle === 30) {
        return { keyCode: KEY_SPACE };
      }
      
      if (cycle === 40) {
        return { keyCode: KEY_SHIFT };
      }
    }
  }
  
  // Once recipes are created, serve customers
  if (state.menu.length >= 10) {
    if (state.customers.length > 0 && state.testFrameCount % 25 === 0) {
      return { keyCode: KEY_SPACE };
    }
  }
  
  return null;
}

// Random action for fallback
function getRandomAction(state) {
  if (state.gamePhase !== PHASE_PLAYING) return null;
  
  const actions = [
    { keyCode: KEY_SPACE },
    { keyCode: KEY_SHIFT },
    { keyCode: KEY_LEFT },
    { keyCode: KEY_RIGHT },
    { keyCode: KEY_UP },
    { keyCode: KEY_DOWN }
  ];
  
  if (Math.random() < 0.1) {
    return actions[Math.floor(Math.random() * actions.length)];
  }
  
  return null;
}

export function get_automated_testing_action(state) {
  switch (state.controlMode) {
    case "TEST_1":
      return getTest1Action(state);
    case "TEST_2":
      return getTest2Action(state);
    case "TEST_3":
      return getTest3Action(state);
    default:
      return getRandomAction(state);
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;