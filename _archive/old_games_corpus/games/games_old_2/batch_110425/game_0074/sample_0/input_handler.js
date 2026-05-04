// input_handler.js - Input handling

import {
  gameState,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE,
  KEY_ENTER,
  KEY_ESC,
  KEY_SPACE,
  KEY_SHIFT,
  KEY_R,
  KEY_Z,
  KEY_LEFT,
  KEY_UP,
  KEY_RIGHT,
  KEY_DOWN,
  CONTROL_HUMAN
} from './globals.js';
import { createRecipe, placeFurniture, getAvailableIngredients, getAvailableFurniture } from './cafe_management.js';
import { serveNearestCustomer } from './customer_system.js';
import { startGame, restartGame, togglePause } from './game_state.js';

export function handleKeyPressed(p, keyCode) {
  // Log the input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: p.key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Game phase transitions
  if (keyCode === KEY_ENTER && gameState.gamePhase === PHASE_START) {
    startGame(p);
    return;
  }
  
  if (keyCode === KEY_ESC && (gameState.gamePhase === PHASE_PLAYING || gameState.gamePhase === PHASE_PAUSED)) {
    togglePause(p);
    return;
  }
  
  if (keyCode === KEY_R && (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === PHASE_GAME_OVER_LOSE)) {
    restartGame(p);
    return;
  }
  
  // Gameplay inputs (only in PLAYING phase and HUMAN mode)
  if (gameState.gamePhase !== PHASE_PLAYING) return;
  if (gameState.controlMode !== CONTROL_HUMAN) return;
  
  handleGameplayInput(p, keyCode);
}

function handleGameplayInput(p, keyCode) {
  // Menu toggle
  if (keyCode === KEY_SHIFT) {
    gameState.menuOpen = !gameState.menuOpen;
    if (!gameState.menuOpen) {
      gameState.placementMode = false;
    }
    return;
  }
  
  // Menu navigation
  if (gameState.menuOpen) {
    handleMenuInput(p, keyCode);
    return;
  }
  
  // Serve customer
  if (keyCode === KEY_SPACE) {
    // Try to serve nearest customer
    const served = serveNearestCustomer(200, 200); // Center of cafe area
    if (served) {
      // Customer served
    }
  }
}

function handleMenuInput(p, keyCode) {
  // Placement mode
  if (gameState.placementMode) {
    handlePlacementInput(p, keyCode);
    return;
  }
  
  // Tab navigation
  if (keyCode === KEY_LEFT && gameState.selectedMenuTab > 0) {
    gameState.selectedMenuTab--;
    return;
  }
  if (keyCode === KEY_RIGHT && gameState.selectedMenuTab < 2) {
    gameState.selectedMenuTab++;
    return;
  }
  
  // Tab-specific input
  if (gameState.selectedMenuTab === 0) {
    handleResearchInput(p, keyCode);
  } else if (gameState.selectedMenuTab === 1) {
    handleFurnitureInput(p, keyCode);
  }
}

function handleResearchInput(p, keyCode) {
  const available = getAvailableIngredients();
  
  if (keyCode === KEY_SPACE) {
    // Create recipe
    if (gameState.selectedRecipeBase && gameState.selectedRecipeAdditions.length > 0) {
      const created = createRecipe(gameState.selectedRecipeBase, gameState.selectedRecipeAdditions);
      if (created) {
        // Reset selection
        gameState.selectedRecipeBase = null;
        gameState.selectedRecipeAdditions = [];
      }
    }
    return;
  }
  
  if (keyCode === KEY_Z) {
    // Cancel/clear selection
    if (gameState.selectedRecipeAdditions.length > 0) {
      gameState.selectedRecipeAdditions.pop();
    } else {
      gameState.selectedRecipeBase = null;
    }
    return;
  }
  
  // Navigate bases
  if (keyCode === KEY_UP || keyCode === KEY_DOWN) {
    const currentIndex = available.bases.indexOf(gameState.selectedRecipeBase);
    let newIndex = currentIndex;
    
    if (keyCode === KEY_UP) {
      newIndex = currentIndex > 0 ? currentIndex - 1 : available.bases.length - 1;
    } else {
      newIndex = currentIndex < available.bases.length - 1 ? currentIndex + 1 : 0;
    }
    
    gameState.selectedRecipeBase = available.bases[newIndex];
    return;
  }
  
  // Add additions
  if ((keyCode === KEY_LEFT || keyCode === KEY_RIGHT) && available.additions.length > 0) {
    if (gameState.selectedRecipeAdditions.length < 3) {
      // Find an addition not already selected
      for (const addition of available.additions) {
        if (!gameState.selectedRecipeAdditions.includes(addition)) {
          gameState.selectedRecipeAdditions.push(addition);
          break;
        }
      }
    }
  }
}

function handleFurnitureInput(p, keyCode) {
  const available = getAvailableFurniture();
  
  if (keyCode === KEY_SPACE) {
    if (gameState.selectedFurniture && !gameState.placementMode) {
      // Enter placement mode
      gameState.placementMode = true;
      gameState.placementX = 0;
      gameState.placementY = 0;
    }
    return;
  }
  
  if (keyCode === KEY_Z) {
    gameState.selectedFurniture = null;
    return;
  }
  
  // Navigate furniture
  if (keyCode === KEY_UP || keyCode === KEY_DOWN || keyCode === KEY_LEFT || keyCode === KEY_RIGHT) {
    const currentIndex = available.indexOf(gameState.selectedFurniture);
    let newIndex = currentIndex;
    
    if (keyCode === KEY_UP && currentIndex >= 2) {
      newIndex = currentIndex - 2;
    } else if (keyCode === KEY_DOWN && currentIndex < available.length - 2) {
      newIndex = currentIndex + 2;
    } else if (keyCode === KEY_LEFT && currentIndex > 0) {
      newIndex = currentIndex - 1;
    } else if (keyCode === KEY_RIGHT && currentIndex < available.length - 1) {
      newIndex = currentIndex + 1;
    }
    
    gameState.selectedFurniture = available[Math.max(0, Math.min(available.length - 1, newIndex))];
  }
}

function handlePlacementInput(p, keyCode) {
  if (keyCode === KEY_SPACE) {
    // Try to place furniture
    const placed = placeFurniture(gameState.selectedFurniture, gameState.placementX, gameState.placementY);
    if (placed) {
      gameState.placementMode = false;
      gameState.selectedFurniture = null;
    }
    return;
  }
  
  if (keyCode === KEY_Z) {
    // Cancel placement
    gameState.placementMode = false;
    return;
  }
  
  // Move placement cursor
  if (keyCode === KEY_LEFT && gameState.placementX > 0) {
    gameState.placementX--;
  }
  if (keyCode === KEY_RIGHT) {
    gameState.placementX++;
  }
  if (keyCode === KEY_UP && gameState.placementY > 0) {
    gameState.placementY--;
  }
  if (keyCode === KEY_DOWN) {
    gameState.placementY++;
  }
}

export function processAutomatedAction(p, action) {
  if (action && action.keyCode) {
    handleKeyPressed(p, action.keyCode);
  }
}