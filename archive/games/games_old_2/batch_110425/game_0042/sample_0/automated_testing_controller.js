// automated_testing_controller.js - Automated testing

import { 
  gameState,
  TRAP_DART,
  TRAP_SPRING,
  TRAP_LAVA,
  TRAP_SUMMON,
  TRAP_DATA,
  GRID_COLS,
  GRID_ROWS,
  PHASE_PLAYING
} from './globals.js';

const TRAP_TYPES = [TRAP_DART, TRAP_SPRING, TRAP_LAVA, TRAP_SUMMON];

let testState = {
  actionQueue: [],
  lastAction: null,
  actionCooldown: 0,
  strategy: null,
  placedTrapsCount: 0
};

function resetTestState() {
  testState = {
    actionQueue: [],
    lastAction: null,
    actionCooldown: 0,
    strategy: null,
    placedTrapsCount: 0
  };
}

// TEST_1: Basic gameplay testing
function getTest1Action(gs) {
  if (gs.gamePhase !== PHASE_PLAYING) return null;
  
  if (testState.actionCooldown > 0) {
    testState.actionCooldown--;
    return null;
  }
  
  // Strategy: Place a few traps and observe
  if (testState.placedTrapsCount < 3) {
    if (!gs.selectedTrapType) {
      // Select dart trap
      testState.actionCooldown = 5;
      return { keyCode: 32, key: ' ' }; // Space to select
    } else {
      // Place trap
      const validPos = findValidPlacementPosition(gs);
      if (validPos) {
        // Navigate to position
        if (gs.cursorPos.x !== validPos.x) {
          return { keyCode: gs.cursorPos.x < validPos.x ? 39 : 37, key: 'Arrow' };
        }
        if (gs.cursorPos.y !== validPos.y) {
          return { keyCode: gs.cursorPos.y < validPos.y ? 40 : 38, key: 'Arrow' };
        }
        // Place trap
        testState.placedTrapsCount++;
        testState.actionCooldown = 10;
        return { keyCode: 32, key: ' ' };
      }
    }
  }
  
  return null;
}

// TEST_2: Win strategy
function getTest2Action(gs) {
  if (gs.gamePhase !== PHASE_PLAYING) {
    resetTestState();
    return null;
  }
  
  if (testState.actionCooldown > 0) {
    testState.actionCooldown--;
    return null;
  }
  
  // Initialize strategy
  if (!testState.strategy) {
    testState.strategy = planOptimalTrapPlacement(gs);
    testState.currentTrapIndex = 0;
  }
  
  // Execute planned placement
  if (testState.currentTrapIndex < testState.strategy.length) {
    const plan = testState.strategy[testState.currentTrapIndex];
    
    // Check if we need to upgrade existing traps
    if (gs.gold > 300 && gs.traps.length > 0) {
      const trapToUpgrade = gs.traps.find(t => t.canUpgrade() && gs.gold >= t.getUpgradeCost());
      if (trapToUpgrade && !gs.upgradingTrap) {
        // Navigate to trap
        if (gs.cursorPos.x !== trapToUpgrade.gridX || gs.cursorPos.y !== trapToUpgrade.gridY) {
          if (gs.cursorPos.x !== trapToUpgrade.gridX) {
            return { keyCode: gs.cursorPos.x < trapToUpgrade.gridX ? 39 : 37, key: 'Arrow' };
          }
          if (gs.cursorPos.y !== trapToUpgrade.gridY) {
            return { keyCode: gs.cursorPos.y < trapToUpgrade.gridY ? 40 : 38, key: 'Arrow' };
          }
        }
        // Enter upgrade mode
        if (!gs.upgradingTrap) {
          testState.actionCooldown = 5;
          return { keyCode: 90, key: 'z' }; // Z to enter upgrade
        }
      }
      
      if (gs.upgradingTrap) {
        testState.actionCooldown = 5;
        return { keyCode: 32, key: ' ' }; // Space to confirm upgrade
      }
    }
    
    // Place new trap
    if (!gs.selectedTrapType && gs.gold >= plan.cost) {
      // Select trap type
      const trapIndex = TRAP_TYPES.indexOf(plan.type);
      if (gs.menuIndex !== trapIndex) {
        return { keyCode: gs.menuIndex < trapIndex ? 39 : 37, key: 'Arrow' };
      }
      testState.actionCooldown = 5;
      return { keyCode: 32, key: ' ' }; // Space to select
    } else if (gs.selectedTrapType) {
      // Navigate to position
      if (gs.cursorPos.x !== plan.x) {
        return { keyCode: gs.cursorPos.x < plan.x ? 39 : 37, key: 'Arrow' };
      }
      if (gs.cursorPos.y !== plan.y) {
        return { keyCode: gs.cursorPos.y < plan.y ? 40 : 38, key: 'Arrow' };
      }
      // Place trap
      testState.currentTrapIndex++;
      testState.actionCooldown = 10;
      return { keyCode: 32, key: ' ' };
    }
  }
  
  return null;
}

// TEST_3: Lose condition testing
function getTest3Action(gs) {
  if (gs.gamePhase !== PHASE_PLAYING) return null;
  
  // Do nothing - let enemies through
  return null;
}

// TEST_4: Upgrade mechanics testing
function getTest4Action(gs) {
  if (gs.gamePhase !== PHASE_PLAYING) {
    resetTestState();
    return null;
  }
  
  if (testState.actionCooldown > 0) {
    testState.actionCooldown--;
    return null;
  }
  
  // Place one trap and keep upgrading it
  if (gs.traps.length === 0) {
    if (!gs.selectedTrapType) {
      testState.actionCooldown = 5;
      return { keyCode: 32, key: ' ' }; // Select trap
    } else {
      const validPos = findValidPlacementPosition(gs);
      if (validPos) {
        if (gs.cursorPos.x !== validPos.x) {
          return { keyCode: gs.cursorPos.x < validPos.x ? 39 : 37, key: 'Arrow' };
        }
        if (gs.cursorPos.y !== validPos.y) {
          return { keyCode: gs.cursorPos.y < validPos.y ? 40 : 38, key: 'Arrow' };
        }
        testState.actionCooldown = 10;
        return { keyCode: 32, key: ' ' };
      }
    }
  } else {
    const trap = gs.traps[0];
    if (trap.canUpgrade() && gs.gold >= trap.getUpgradeCost()) {
      if (!gs.upgradingTrap) {
        // Navigate to trap
        if (gs.cursorPos.x !== trap.gridX || gs.cursorPos.y !== trap.gridY) {
          if (gs.cursorPos.x !== trap.gridX) {
            return { keyCode: gs.cursorPos.x < trap.gridX ? 39 : 37, key: 'Arrow' };
          }
          if (gs.cursorPos.y !== trap.gridY) {
            return { keyCode: gs.cursorPos.y < trap.gridY ? 40 : 38, key: 'Arrow' };
          }
        }
        testState.actionCooldown = 5;
        return { keyCode: 90, key: 'z' };
      } else {
        testState.actionCooldown = 10;
        return { keyCode: 32, key: ' ' };
      }
    }
  }
  
  return null;
}

// TEST_5: Multiple trap type testing
function getTest5Action(gs) {
  if (gs.gamePhase !== PHASE_PLAYING) {
    resetTestState();
    return null;
  }
  
  if (testState.actionCooldown > 0) {
    testState.actionCooldown--;
    return null;
  }
  
  // Place one of each trap type
  const targetTrapCount = 4;
  const currentType = Math.min(gs.traps.length, targetTrapCount - 1);
  
  if (gs.traps.length < targetTrapCount) {
    const targetTrapType = TRAP_TYPES[currentType];
    const cost = TRAP_DATA[targetTrapType].baseCost;
    
    if (gs.gold < cost) return null;
    
    if (!gs.selectedTrapType) {
      // Navigate menu to correct trap type
      if (gs.menuIndex !== currentType) {
        return { keyCode: gs.menuIndex < currentType ? 39 : 37, key: 'Arrow' };
      }
      testState.actionCooldown = 5;
      return { keyCode: 32, key: ' ' };
    } else {
      const validPos = findValidPlacementPosition(gs);
      if (validPos) {
        if (gs.cursorPos.x !== validPos.x) {
          return { keyCode: gs.cursorPos.x < validPos.x ? 39 : 37, key: 'Arrow' };
        }
        if (gs.cursorPos.y !== validPos.y) {
          return { keyCode: gs.cursorPos.y < validPos.y ? 40 : 38, key: 'Arrow' };
        }
        testState.actionCooldown = 15;
        return { keyCode: 32, key: ' ' };
      }
    }
  }
  
  return null;
}

// Helper: Find valid placement position near path
function findValidPlacementPosition(gs) {
  // Look for positions adjacent to path
  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLS; x++) {
      if (gs.grid[y][x] === null && !gs.pathCells.has(`${x},${y}`)) {
        // Check if adjacent to path
        const adjacentToPath = 
          gs.pathCells.has(`${x-1},${y}`) ||
          gs.pathCells.has(`${x+1},${y}`) ||
          gs.pathCells.has(`${x},${y-1}`) ||
          gs.pathCells.has(`${x},${y+1}`);
        
        if (adjacentToPath) {
          return { x, y };
        }
      }
    }
  }
  
  // Fallback: any valid position
  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLS; x++) {
      if (gs.grid[y][x] === null && !gs.pathCells.has(`${x},${y}`)) {
        return { x, y };
      }
    }
  }
  
  return null;
}

// Helper: Plan optimal trap placement
function planOptimalTrapPlacement(gs) {
  const plan = [];
  
  // Strategic positions along the path
  const strategicPositions = [
    { x: 2, y: 4, type: TRAP_DART },
    { x: 2, y: 6, type: TRAP_DART },
    { x: 4, y: 2, type: TRAP_SPRING },
    { x: 6, y: 3, type: TRAP_LAVA },
    { x: 8, y: 2, type: TRAP_DART },
    { x: 8, y: 7, type: TRAP_DART },
    { x: 10, y: 6, type: TRAP_SPRING },
    { x: 12, y: 7, type: TRAP_SUMMON },
    { x: 12, y: 5, type: TRAP_DART },
    { x: 13, y: 4, type: TRAP_LAVA }
  ];
  
  strategicPositions.forEach(pos => {
    plan.push({
      x: pos.x,
      y: pos.y,
      type: pos.type,
      cost: TRAP_DATA[pos.type].baseCost
    });
  });
  
  return plan;
}

export function get_automated_testing_action(gs) {
  switch (gs.controlMode) {
    case "TEST_1":
      return getTest1Action(gs);
    case "TEST_2":
      return getTest2Action(gs);
    case "TEST_3":
      return getTest3Action(gs);
    case "TEST_4":
      return getTest4Action(gs);
    case "TEST_5":
      return getTest5Action(gs);
    default:
      return null;
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;