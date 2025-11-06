// automated_testing_controller.js - Automated testing strategies

import { gameState } from './globals.js';

let testState = {
  initialized: false,
  actionQueue: [],
  waitCounter: 0,
  phase: "init",
  shelvesPlaced: 0,
  employeesHired: 0,
  productsExpanded: false
};

function resetTestState() {
  testState = {
    initialized: false,
    actionQueue: [],
    waitCounter: 0,
    phase: "init",
    shelvesPlaced: 0,
    employeesHired: 0,
    productsExpanded: false
  };
}

function getTestWinAction(gameState) {
  // Optimal strategy to win the game
  if (!testState.initialized) {
    resetTestState();
    testState.initialized = true;
  }
  
  // Wait for game state to stabilize
  if (testState.waitCounter < 5) {
    testState.waitCounter++;
    return null;
  }
  
  // Phase 1: Place shelves to generate revenue
  if (testState.phase === "init" && testState.shelvesPlaced < 15) {
    if (gameState.money >= 30) {
      // Position cursor and place shelf
      if (testState.actionQueue.length === 0) {
        const targetX = testState.shelvesPlaced % gameState.gridWidth;
        const targetY = Math.floor(testState.shelvesPlaced / gameState.gridWidth);
        
        // Move to position
        while (gameState.cursorX < targetX) {
          testState.actionQueue.push(39); // RIGHT
        }
        while (gameState.cursorX > targetX) {
          testState.actionQueue.push(37); // LEFT
        }
        while (gameState.cursorY < targetY) {
          testState.actionQueue.push(40); // DOWN
        }
        while (gameState.cursorY > targetY) {
          testState.actionQueue.push(38); // UP
        }
        
        testState.actionQueue.push(32); // SPACE to place
        testState.shelvesPlaced++;
      }
      
      if (testState.actionQueue.length > 0) {
        return testState.actionQueue.shift();
      }
    }
    
    if (testState.shelvesPlaced >= 15) {
      testState.phase = "hire";
      testState.waitCounter = 0;
    }
  }
  
  // Phase 2: Hire employees
  if (testState.phase === "hire" && testState.employeesHired < 3) {
    if (gameState.money >= 100) {
      if (testState.actionQueue.length === 0) {
        testState.actionQueue.push(16); // SHIFT to employee view
        testState.actionQueue.push(32); // SPACE to hire
        testState.employeesHired++;
      }
      
      if (testState.actionQueue.length > 0) {
        return testState.actionQueue.shift();
      }
    }
    
    if (testState.employeesHired >= 3) {
      testState.phase = "assign";
      testState.waitCounter = 0;
    }
  }
  
  // Phase 3: Assign employees
  if (testState.phase === "assign") {
    if (testState.actionQueue.length === 0) {
      // Assign first employee to stocking
      testState.actionQueue.push(38); // UP to select
      testState.actionQueue.push(39); // RIGHT to change assignment
      testState.actionQueue.push(40); // DOWN
      testState.actionQueue.push(39); // RIGHT
      testState.actionQueue.push(40); // DOWN
      testState.actionQueue.push(39); // RIGHT
      testState.phase = "expand";
    }
    
    if (testState.actionQueue.length > 0) {
      return testState.actionQueue.shift();
    }
  }
  
  // Phase 4: Expand and unlock products
  if (testState.phase === "expand") {
    if (gameState.money >= 300 && !testState.productsExpanded) {
      if (testState.actionQueue.length === 0) {
        testState.actionQueue.push(16); // SHIFT to inventory view
        testState.actionQueue.push(90); // Z to unlock products
        testState.productsExpanded = true;
      }
      
      if (testState.actionQueue.length > 0) {
        return testState.actionQueue.shift();
      }
    }
    
    if (gameState.money >= 300 && testState.productsExpanded) {
      if (testState.actionQueue.length === 0) {
        testState.actionQueue.push(16); // SHIFT to store view
        testState.actionQueue.push(90); // Z to expand grid
        testState.phase = "optimize";
      }
      
      if (testState.actionQueue.length > 0) {
        return testState.actionQueue.shift();
      }
    }
  }
  
  // Phase 5: Continue optimizing
  if (testState.phase === "optimize") {
    // Buy more products
    if (gameState.money >= 50) {
      if (testState.actionQueue.length === 0) {
        testState.actionQueue.push(16); // SHIFT to inventory
        testState.actionQueue.push(32); // Buy
        testState.actionQueue.push(40); // Down
        testState.actionQueue.push(32); // Buy
        testState.actionQueue.push(16); // Back to store
        testState.waitCounter = 0;
      }
      
      if (testState.actionQueue.length > 0) {
        return testState.actionQueue.shift();
      }
    }
    
    // Place more shelves if we have money and space
    if (gameState.money >= 50 && gameState.shelves.length < 30) {
      if (testState.actionQueue.length === 0) {
        const emptyTile = findEmptyTile();
        if (emptyTile) {
          // Move to position
          while (gameState.cursorX < emptyTile.x) {
            testState.actionQueue.push(39); // RIGHT
          }
          while (gameState.cursorX > emptyTile.x) {
            testState.actionQueue.push(37); // LEFT
          }
          while (gameState.cursorY < emptyTile.y) {
            testState.actionQueue.push(40); // DOWN
          }
          while (gameState.cursorY > emptyTile.y) {
            testState.actionQueue.push(38); // UP
          }
          testState.actionQueue.push(32); // Place
        }
      }
      
      if (testState.actionQueue.length > 0) {
        return testState.actionQueue.shift();
      }
    }
  }
  
  return null;
}

function findEmptyTile() {
  for (let y = 0; y < gameState.gridHeight; y++) {
    for (let x = 0; x < gameState.gridWidth; x++) {
      if (!gameState.grid[y][x].occupied && gameState.grid[y][x].type === "floor") {
        return { x, y };
      }
    }
  }
  return null;
}

function getBasicTestAction(gameState) {
  // Basic interaction testing
  if (!testState.initialized) {
    resetTestState();
    testState.initialized = true;
  }
  
  if (testState.waitCounter < 3) {
    testState.waitCounter++;
    return null;
  }
  
  if (testState.actionQueue.length === 0) {
    // Simple test sequence
    testState.actionQueue = [
      39, 39, 40, 40, // Move cursor
      32, // Place shelf
      16, // Switch to inventory
      40, 40, // Navigate
      32, // Buy product
      16, // Switch to employees
      32, // Hire
      16, // Back to store
      38, 38, 37, 37 // Move around
    ];
  }
  
  if (testState.actionQueue.length > 0) {
    return testState.actionQueue.shift();
  }
  
  return null;
}

function getRandomAction(gameState) {
  const actions = [37, 38, 39, 40, 32, 16, 90];
  return actions[Math.floor(Math.random() * actions.length)];
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;