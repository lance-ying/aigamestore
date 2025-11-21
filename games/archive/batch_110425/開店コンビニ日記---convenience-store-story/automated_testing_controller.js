// automated_testing_controller.js - Automated testing functions

import { gameState, UI_MODES, GAME_PHASES, GRID_COLS, GRID_ROWS } from './globals.js';

let testState = {
  phase: "init",
  shelvesPlaced: 0,
  staffHired: 0,
  framesSinceAction: 0,
  targetShelves: 15,
  targetStaff: 3,
  lastRevenue: 0,
  stagnantFrames: 0
};

function getTestWinAction(gameState) {
  testState.framesSinceAction++;

  // Aggressive strategy to win
  if (testState.phase === "init") {
    testState.phase = "placing_shelves";
    testState.shelvesPlaced = 0;
    testState.framesSinceAction = 0;
  }

  // Place shelves aggressively near entrance
  if (testState.phase === "placing_shelves" && testState.shelvesPlaced < testState.targetShelves) {
    if (gameState.uiMode === UI_MODES.NORMAL && testState.framesSinceAction > 5) {
      testState.framesSinceAction = 0;
      return { keyCode: 49 }; // Press 1 to enter place shelf mode
    }
    
    if (gameState.uiMode === UI_MODES.PLACE_SHELF) {
      // Navigate to good shelf positions
      const targetPositions = [
        {x: 2, y: 4}, {x: 2, y: 5}, {x: 2, y: 6},
        {x: 3, y: 4}, {x: 3, y: 5}, {x: 3, y: 6},
        {x: 4, y: 4}, {x: 4, y: 5}, {x: 4, y: 6},
        {x: 5, y: 4}, {x: 5, y: 5}, {x: 5, y: 6},
        {x: 6, y: 4}, {x: 6, y: 5}, {x: 6, y: 6}
      ];
      
      const target = targetPositions[testState.shelvesPlaced];
      if (target) {
        if (gameState.cursorX < target.x) return { keyCode: 39 }; // RIGHT
        if (gameState.cursorX > target.x) return { keyCode: 37 }; // LEFT
        if (gameState.cursorY < target.y) return { keyCode: 40 }; // DOWN
        if (gameState.cursorY > target.y) return { keyCode: 38 }; // UP
        
        testState.shelvesPlaced++;
        return { keyCode: 32 }; // SPACE to place
      }
    }
    
    if (testState.shelvesPlaced >= testState.targetShelves) {
      testState.phase = "stocking";
      testState.framesSinceAction = 0;
    }
  }

  // Stock shelves with products
  if (testState.phase === "stocking") {
    const emptyOrLowShelves = gameState.shelves.filter(s => 
      !s.productType || s.products.length < 3
    );
    
    if (emptyOrLowShelves.length > 0 && gameState.money >= 3) {
      if (gameState.uiMode === UI_MODES.NORMAL && testState.framesSinceAction > 5) {
        testState.framesSinceAction = 0;
        return { keyCode: 50 }; // Press 2 to enter stock mode
      }
      
      if (gameState.uiMode === UI_MODES.STOCK_PRODUCT && !gameState.selectedShelf) {
        const target = emptyOrLowShelves[0];
        if (gameState.cursorX < target.x) return { keyCode: 39 };
        if (gameState.cursorX > target.x) return { keyCode: 37 };
        if (gameState.cursorY < target.y) return { keyCode: 40 };
        if (gameState.cursorY > target.y) return { keyCode: 38 };
        return { keyCode: 32 }; // Select shelf
      }
      
      if (gameState.uiMode === UI_MODES.STOCK_PRODUCT && gameState.selectedShelf) {
        return { keyCode: 32 }; // Stock with first available product
      }
    } else {
      testState.phase = "hiring";
      testState.framesSinceAction = 0;
    }
  }

  // Hire staff
  if (testState.phase === "hiring" && testState.staffHired < testState.targetStaff) {
    const hireCost = 50 + gameState.staffHireCount * 20;
    if (gameState.money >= hireCost) {
      if (gameState.uiMode === UI_MODES.NORMAL && testState.framesSinceAction > 5) {
        testState.framesSinceAction = 0;
        return { keyCode: 51 }; // Press 3 to hire staff
      }
      
      if (gameState.uiMode === UI_MODES.HIRE_STAFF) {
        testState.staffHired++;
        return { keyCode: 32 }; // SPACE to hire
      }
    } else {
      testState.phase = "running";
      testState.framesSinceAction = 0;
    }
  }

  // Running phase - maintain store and accelerate time
  if (testState.phase === "running") {
    // Check for stagnation
    if (gameState.totalRevenue === testState.lastRevenue) {
      testState.stagnantFrames++;
    } else {
      testState.stagnantFrames = 0;
      testState.lastRevenue = gameState.totalRevenue;
    }

    // If stagnant, try to fix by stocking
    if (testState.stagnantFrames > 200) {
      testState.phase = "stocking";
      testState.stagnantFrames = 0;
      return { keyCode: 90 }; // Z to cancel current mode
    }

    // Periodically restock shelves
    const lowStockShelves = gameState.shelves.filter(s => 
      s.productType && s.products.length < 2
    );
    
    if (lowStockShelves.length > 0 && gameState.money >= 10 && testState.framesSinceAction > 60) {
      testState.phase = "stocking";
      testState.framesSinceAction = 0;
    }

    // Speed up time
    return { keyCode: 16 }; // SHIFT to accelerate
  }

  return { keyCode: 16 }; // Default: hold shift to speed up
}

function getBasicTestAction(gameState) {
  // Simple test: place one shelf, stock it, hire one staff, then wait
  if (gameState.shelves.length === 0 && gameState.money >= 20) {
    if (gameState.uiMode === UI_MODES.NORMAL) {
      return { keyCode: 49 }; // Enter place shelf mode
    }
    if (gameState.uiMode === UI_MODES.PLACE_SHELF) {
      if (gameState.cursorX !== 3 || gameState.cursorY !== 5) {
        if (gameState.cursorX < 3) return { keyCode: 39 };
        if (gameState.cursorX > 3) return { keyCode: 37 };
        if (gameState.cursorY < 5) return { keyCode: 40 };
        if (gameState.cursorY > 5) return { keyCode: 38 };
      }
      return { keyCode: 32 }; // Place shelf
    }
  }

  if (gameState.shelves.length > 0) {
    const shelf = gameState.shelves[0];
    if (shelf.products.length < 3 && gameState.money >= 3) {
      if (gameState.uiMode === UI_MODES.NORMAL) {
        return { keyCode: 50 }; // Enter stock mode
      }
      if (gameState.uiMode === UI_MODES.STOCK_PRODUCT && !gameState.selectedShelf) {
        return { keyCode: 32 }; // Select shelf
      }
      if (gameState.uiMode === UI_MODES.STOCK_PRODUCT && gameState.selectedShelf) {
        return { keyCode: 32 }; // Stock product
      }
    }
  }

  if (gameState.staff.length === 0 && gameState.money >= 50) {
    if (gameState.uiMode === UI_MODES.NORMAL) {
      return { keyCode: 51 }; // Enter hire staff mode
    }
    if (gameState.uiMode === UI_MODES.HIRE_STAFF) {
      return { keyCode: 32 }; // Hire staff
    }
  }

  return { keyCode: 16 }; // Speed up time
}

function getExpandTestAction(gameState) {
  // Test expansion mechanics
  if (gameState.expandedTiles.length < 3 && gameState.money >= 100) {
    if (gameState.uiMode === UI_MODES.NORMAL) {
      return { keyCode: 52 }; // Enter expand mode
    }
    if (gameState.uiMode === UI_MODES.EXPAND_STORE) {
      // Try to expand tiles adjacent to existing store
      const targets = [{x: 1, y: 3}, {x: 1, y: 7}, {x: 10, y: 3}];
      const target = targets[gameState.expandedTiles.length];
      if (target) {
        if (gameState.cursorX < target.x) return { keyCode: 39 };
        if (gameState.cursorX > target.x) return { keyCode: 37 };
        if (gameState.cursorY < target.y) return { keyCode: 40 };
        if (gameState.cursorY > target.y) return { keyCode: 38 };
        return { keyCode: 32 }; // Expand
      }
    }
  }

  // Then place shelves in expanded areas
  if (gameState.shelves.length < 5 && gameState.money >= 20) {
    if (gameState.uiMode === UI_MODES.NORMAL) {
      return { keyCode: 49 };
    }
    if (gameState.uiMode === UI_MODES.PLACE_SHELF) {
      return { keyCode: 32 };
    }
  }

  return { keyCode: 16 };
}

function getRandomAction(gameState) {
  const actions = [
    { keyCode: 37 },  // LEFT
    { keyCode: 39 },  // RIGHT
    { keyCode: 38 },  // UP
    { keyCode: 40 },  // DOWN
    { keyCode: 32 },  // SPACE
    { keyCode: 90 },  // Z
    { keyCode: 49 },  // 1
    { keyCode: 50 },  // 2
    { keyCode: 16 }   // SHIFT
  ];
  return actions[Math.floor(Math.random() * actions.length)];
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
    case "TEST_3":
      return getExpandTestAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;