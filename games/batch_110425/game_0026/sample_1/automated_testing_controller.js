// automated_testing_controller.js - Automated testing strategies

import { gameState, ATTRACTION_TYPES, RESEARCH_TREE, MASCOTS } from './globals.js';

function getTestWinAction(gameState) {
  // Optimal strategy to win: Build attractions, research upgrades, recruit mascots
  
  // Priority 1: Open menu if closed
  if (!gameState.menuOpen && !gameState.selectedAttractionType) {
    return { keyCode: 32 }; // SPACE to open menu
  }
  
  // Priority 2: If in placement mode, find spot and place
  if (gameState.selectedAttractionType) {
    const data = ATTRACTION_TYPES[gameState.selectedAttractionType];
    
    // Find available spot
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 15; x++) {
        if (gameState.grid.canPlace(x, y, data.size)) {
          // Navigate to position
          if (gameState.hoveredCell.x < x) return { keyCode: 39 }; // RIGHT
          if (gameState.hoveredCell.x > x) return { keyCode: 37 }; // LEFT
          if (gameState.hoveredCell.y < y) return { keyCode: 40 }; // DOWN
          if (gameState.hoveredCell.y > y) return { keyCode: 38 }; // UP
          
          // Place it
          return { keyCode: 32 }; // SPACE
        }
      }
    }
    
    // Can't place, cancel
    return { keyCode: 90 }; // Z
  }
  
  // Priority 3: Select what to build/research based on strategy
  if (gameState.menuOpen) {
    const attractionKeys = Object.keys(ATTRACTION_TYPES);
    const numAttractions = attractionKeys.length;
    const numResearch = RESEARCH_TREE.length;
    
    // Early game: Build cheap attractions
    if (gameState.attractions.length < 5 && gameState.money >= 150) {
      const targetIndex = attractionKeys.findIndex(key => 
        gameState.unlockedAttractions.includes(key) && 
        ATTRACTION_TYPES[key].cost <= gameState.money
      );
      
      if (targetIndex >= 0) {
        if (gameState.menuIndex < targetIndex) return { keyCode: 40 }; // DOWN
        if (gameState.menuIndex > targetIndex) return { keyCode: 38 }; // UP
        return { keyCode: 32 }; // SPACE to select
      }
    }
    
    // Mid game: Research upgrades
    if (gameState.money >= 200) {
      const unresearchedIndex = RESEARCH_TREE.findIndex(r => 
        !gameState.researchedItems.includes(r.id) && r.cost <= gameState.money
      );
      
      if (unresearchedIndex >= 0) {
        const targetIndex = numAttractions + unresearchedIndex;
        if (gameState.menuIndex < targetIndex) return { keyCode: 40 }; // DOWN
        if (gameState.menuIndex > targetIndex) return { keyCode: 38 }; // UP
        return { keyCode: 32 }; // SPACE to purchase
      }
    }
    
    // Late game: Recruit mascots
    if (gameState.year >= 2 && gameState.money >= 400) {
      const unrecruitedIndex = MASCOTS.findIndex(m => 
        !gameState.mascots.some(recruited => recruited.id === m.id) && 
        m.cost <= gameState.money
      );
      
      if (unrecruitedIndex >= 0) {
        const targetIndex = numAttractions + numResearch + unrecruitedIndex;
        if (gameState.menuIndex < targetIndex) return { keyCode: 40 }; // DOWN
        if (gameState.menuIndex > targetIndex) return { keyCode: 38 }; // UP
        return { keyCode: 32 }; // SPACE to recruit
      }
    }
    
    // Continue building attractions if we have money
    if (gameState.money >= 100) {
      const targetIndex = attractionKeys.findIndex(key => 
        gameState.unlockedAttractions.includes(key) && 
        ATTRACTION_TYPES[key].cost <= gameState.money
      );
      
      if (targetIndex >= 0) {
        if (gameState.menuIndex < targetIndex) return { keyCode: 40 }; // DOWN
        if (gameState.menuIndex > targetIndex) return { keyCode: 38 }; // UP
        return { keyCode: 32 }; // SPACE to select
      }
    }
  }
  
  // Default: Hold shift to fast forward
  return { keyCode: 16 }; // SHIFT
}

function getBasicTestAction(gameState) {
  // Simple test: Place a few attractions and wait
  
  if (gameState.attractions.length >= 3) {
    return { keyCode: 16 }; // Fast forward
  }
  
  if (!gameState.menuOpen && !gameState.selectedAttractionType) {
    return { keyCode: 32 }; // Open menu
  }
  
  if (gameState.selectedAttractionType) {
    // Try to place
    if (Math.random() > 0.5) {
      return { keyCode: 32 }; // Try to place
    } else {
      const direction = Math.floor(Math.random() * 4);
      return { keyCode: [37, 38, 39, 40][direction] }; // Move cursor
    }
  }
  
  if (gameState.menuOpen) {
    if (gameState.menuIndex < 2 && Math.random() > 0.3) {
      return { keyCode: 32 }; // Select attraction
    } else if (Math.random() > 0.5) {
      return { keyCode: 40 }; // Navigate down
    } else {
      return { keyCode: 38 }; // Navigate up
    }
  }
  
  return { keyCode: 16 }; // Fast forward
}

function getExplorationAction(gameState) {
  // Test rapid expansion
  
  if (!gameState.menuOpen && !gameState.selectedAttractionType) {
    return { keyCode: 32 }; // Open menu
  }
  
  if (gameState.selectedAttractionType) {
    // Quickly place
    return { keyCode: 32 };
  }
  
  if (gameState.menuOpen) {
    // Alternate between attractions and research
    if (gameState.attractions.length > gameState.researchedItems.length * 2) {
      // Do research
      const targetIndex = Object.keys(ATTRACTION_TYPES).length;
      if (gameState.menuIndex < targetIndex) return { keyCode: 40 };
      return { keyCode: 32 };
    } else {
      // Build attraction
      if (gameState.menuIndex > 2) return { keyCode: 38 };
      return { keyCode: 32 };
    }
  }
  
  return { keyCode: 16 }; // Fast forward
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getExplorationAction(gameState);
    default:
      return null;
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;