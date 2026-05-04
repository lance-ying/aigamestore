// automated_testing_controller.js - Automated testing

import {
  gameState,
  PHASE_PLAYING,
  MODE_BUILD,
  MODE_RESEARCH,
  MODE_EXPAND,
  ATTRACTIONS,
  RESEARCH_TREE,
  GRID_COLS,
  GRID_ROWS
} from './globals.js';

import {
  canPlaceAttraction,
  canResearch,
  canExpandLand,
  canScoutMascot
} from './game_logic.js';

// Test 1: Basic functionality test
function getBasicTestAction(gameState) {
  const gs = gameState;
  
  // Random mode switching every 100 frames
  if (gs.framesSinceLastAction > 100) {
    return { keyCode: 16 }; // SHIFT
  }
  
  if (gs.currentMode === MODE_BUILD) {
    // Try to place attractions randomly
    if (Math.random() < 0.1) {
      return { keyCode: 32 }; // SPACE
    }
    
    // Navigate menu
    if (Math.random() < 0.3) {
      return { keyCode: Math.random() < 0.5 ? 38 : 40 }; // UP/DOWN
    }
    
    // Move cursor
    const dirs = [37, 38, 39, 40];
    return { keyCode: dirs[Math.floor(Math.random() * dirs.length)] };
  }
  
  if (gs.currentMode === MODE_RESEARCH) {
    if (Math.random() < 0.1) {
      return { keyCode: 32 }; // SPACE
    }
    return { keyCode: Math.random() < 0.5 ? 38 : 40 }; // UP/DOWN
  }
  
  if (gs.currentMode === MODE_EXPAND) {
    if (Math.random() < 0.05) {
      return { keyCode: 32 }; // SPACE
    }
    return { keyCode: 16 }; // SHIFT back to build
  }
  
  return null;
}

// Test 2: Win strategy
function getWinStrategyAction(gameState) {
  const gs = gameState;
  
  // Strategy phases
  const totalScore = gs.satisfaction + gs.popularity;
  
  // Phase 1: Build initial attractions (score < 100)
  if (totalScore < 100) {
    if (gs.currentMode !== MODE_BUILD) {
      return { keyCode: 16 }; // Switch to BUILD
    }
    
    // Select cheapest unlocked attraction
    const unlockedAttractions = Object.entries(ATTRACTIONS)
      .filter(([key, config]) => config.unlocked)
      .sort((a, b) => a[1].cost - b[1].cost);
    
    if (unlockedAttractions.length > 0) {
      const targetType = unlockedAttractions[0][0];
      
      if (gs.selectedAttractionType !== targetType) {
        // Navigate to target attraction
        const attractionKeys = Object.keys(ATTRACTIONS);
        const currentIndex = attractionKeys.indexOf(gs.selectedAttractionType);
        const targetIndex = attractionKeys.indexOf(targetType);
        
        return { keyCode: targetIndex > currentIndex ? 40 : 38 }; // DOWN/UP
      }
      
      // Try to place attraction
      if (canPlaceAttraction(targetType, gs.cursorX, gs.cursorY)) {
        return { keyCode: 32 }; // SPACE to place
      }
      
      // Move cursor to find valid spot
      if (gs.cursorX < gs.gridWidth - 1) {
        return { keyCode: 39 }; // RIGHT
      } else if (gs.cursorY < gs.gridHeight - 1) {
        gs.cursorX = 0;
        return { keyCode: 40 }; // DOWN and reset X
      } else {
        gs.cursorX = 0;
        gs.cursorY = 0;
      }
    }
  }
  
  // Phase 2: Research and expand (score 100-400)
  if (totalScore >= 100 && totalScore < 400) {
    // Expand land if needed and affordable
    if (gs.gridWidth < 8 || gs.gridHeight < 8) {
      if (gs.currentMode !== MODE_EXPAND) {
        return { keyCode: 16 }; // Switch to EXPAND
      }
      
      if (canExpandLand()) {
        return { keyCode: 32 }; // SPACE to expand
      }
    }
    
    // Research new attractions
    const unresearchedItems = Object.entries(RESEARCH_TREE)
      .filter(([key, _]) => !gs.researchedItems.includes(key))
      .sort((a, b) => a[1].cost - b[1].cost);
    
    if (unresearchedItems.length > 0) {
      if (gs.currentMode !== MODE_RESEARCH) {
        return { keyCode: 16 }; // Switch to RESEARCH
      }
      
      const targetResearch = unresearchedItems[0][0];
      if (gs.selectedResearch !== targetResearch) {
        const researchKeys = Object.keys(RESEARCH_TREE);
        const currentIndex = researchKeys.indexOf(gs.selectedResearch);
        const targetIndex = researchKeys.indexOf(targetResearch);
        
        return { keyCode: targetIndex > currentIndex ? 40 : 38 }; // DOWN/UP
      }
      
      if (canResearch(targetResearch)) {
        return { keyCode: 32 }; // SPACE to research
      }
    }
    
    // Build more attractions
    return getBuildAttractionAction(gs);
  }
  
  // Phase 3: Build advanced attractions and scout mascots (score 400-800)
  if (totalScore >= 400 && totalScore < 800) {
    // Scout mascots if available
    if (gs.canScoutMascot && gs.mascots.length < 4) {
      if (gs.currentMode !== MODE_EXPAND) {
        return { keyCode: 16 }; // Switch to EXPAND
      }
      
      if (canScoutMascot(gs.mascots.length)) {
        return { keyCode: 32 }; // SPACE to scout
      }
    }
    
    // Build expensive attractions
    return getBuildAttractionAction(gs, true);
  }
  
  // Phase 4: Final push to rank 1 (score >= 800)
  if (totalScore >= 800) {
    // Keep building and maintaining
    return getBuildAttractionAction(gs, true);
  }
  
  return null;
}

function getBuildAttractionAction(gs, preferExpensive = false) {
  if (gs.currentMode !== MODE_BUILD) {
    return { keyCode: 16 }; // Switch to BUILD
  }
  
  // Get best affordable attraction
  const affordableAttractions = Object.entries(ATTRACTIONS)
    .filter(([key, config]) => config.unlocked && gs.money >= config.cost)
    .sort((a, b) => preferExpensive ? b[1].cost - a[1].cost : a[1].cost - b[1].cost);
  
  if (affordableAttractions.length === 0) {
    // No money, switch mode or wait
    return { keyCode: 16 };
  }
  
  const targetType = affordableAttractions[0][0];
  const targetConfig = affordableAttractions[0][1];
  
  if (gs.selectedAttractionType !== targetType) {
    const attractionKeys = Object.keys(ATTRACTIONS);
    const currentIndex = attractionKeys.indexOf(gs.selectedAttractionType);
    const targetIndex = attractionKeys.indexOf(targetType);
    
    return { keyCode: targetIndex > currentIndex ? 40 : 38 }; // DOWN/UP
  }
  
  // Find valid placement location
  for (let y = 0; y < gs.gridHeight; y++) {
    for (let x = 0; x < gs.gridWidth; x++) {
      if (canPlaceAttraction(targetType, x, y)) {
        // Navigate to this position
        if (gs.cursorX < x) {
          return { keyCode: 39 }; // RIGHT
        } else if (gs.cursorX > x) {
          return { keyCode: 37 }; // LEFT
        } else if (gs.cursorY < y) {
          return { keyCode: 40 }; // DOWN
        } else if (gs.cursorY > y) {
          return { keyCode: 38 }; // UP
        } else {
          // At correct position
          return { keyCode: 32 }; // SPACE to place
        }
      }
    }
  }
  
  // No valid spot found, might need expansion
  return { keyCode: 16 }; // Switch to EXPAND mode
}

export function get_automated_testing_action(gameState) {
  if (gameState.gamePhase !== PHASE_PLAYING) {
    return null;
  }
  
  gameState.framesSinceLastAction++;
  
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getWinStrategyAction(gameState);
    default:
      return null;
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;