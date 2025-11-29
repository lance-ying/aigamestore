// automated_testing_controller.js - Automated testing logic

import { gameState, getGridPosition, GRID_ROWS, GRID_COLS, GRID_OFFSET_X, GRID_OFFSET_Y, CELL_WIDTH, CELL_HEIGHT } from './globals.js';
import { getPlantCost } from './game_logic.js';

let testState = {
  phase: 'INIT',
  targetPlant: null,
  plantingQueue: [],
  sunCollectTarget: null,
  actionCooldown: 0,
  plantPlacementAttempts: 0,
  sunCollectionAttempts: 0
};

// TEST_1: Basic plant placement and sun collection
function getTest1Action(gameState) {
  if (gameState.gamePhase !== "PLAYING") {
    if (gameState.gamePhase === "START") {
      return { keyCode: 13 }; // ENTER to start
    }
    return null;
  }
  
  // Cooldown between actions
  if (testState.actionCooldown > 0) {
    testState.actionCooldown--;
    return null;
  }
  
  // Priority 1: Collect sun if available and close
  if (gameState.sunDrops.length > 0) {
    const nearestSun = findNearestSun(gameState);
    if (nearestSun) {
      // Move cursor to sun position
      const targetRow = Math.floor((nearestSun.y - GRID_OFFSET_Y) / CELL_HEIGHT);
      const targetCol = Math.floor((nearestSun.x - GRID_OFFSET_X) / CELL_WIDTH);
      
      if (Math.abs(gameState.cursorRow - targetRow) > 0) {
        testState.actionCooldown = 3;
        return { keyCode: gameState.cursorRow < targetRow ? 40 : 38 }; // DOWN or UP
      }
      if (Math.abs(gameState.cursorCol - targetCol) > 0) {
        testState.actionCooldown = 3;
        return { keyCode: gameState.cursorCol < targetCol ? 39 : 37 }; // RIGHT or LEFT
      }
      
      // At position, collect
      testState.actionCooldown = 5;
      testState.sunCollectionAttempts++;
      return { keyCode: 32 }; // SPACE to collect
    }
  }
  
  // Priority 2: Plant sunflowers for economy
  if (gameState.sun >= 50 && testState.plantPlacementAttempts < 5) {
    // Select sunflower if not selected (index 0)
    if (gameState.selectedPlantIndex !== 0) {
      testState.actionCooldown = 5;
      return { keyCode: 90 }; // Z to cycle plants
    }
    
    // Find empty spot in back rows (better for economy)
    const targetSpot = findEmptySpot([3, 4, 2], [0, 1, 2, 3]);
    if (targetSpot) {
      // Move cursor to target
      if (gameState.cursorRow !== targetSpot.row) {
        testState.actionCooldown = 3;
        return { keyCode: gameState.cursorRow < targetSpot.row ? 40 : 38 };
      }
      if (gameState.cursorCol !== targetSpot.col) {
        testState.actionCooldown = 3;
        return { keyCode: gameState.cursorCol < targetSpot.col ? 39 : 37 };
      }
      
      // Place plant
      testState.actionCooldown = 10;
      testState.plantPlacementAttempts++;
      return { keyCode: 32 }; // SPACE to place
    }
  }
  
  // Random exploration
  const actions = [37, 38, 39, 40, 90];
  testState.actionCooldown = 5;
  return { keyCode: actions[Math.floor(Math.random() * actions.length)] };
}

// TEST_2: Win strategy
function getTest2Action(gameState) {
  if (gameState.gamePhase !== "PLAYING") {
    if (gameState.gamePhase === "START") {
      return { keyCode: 13 }; // ENTER to start
    }
    return null;
  }
  
  // Cooldown between actions
  if (testState.actionCooldown > 0) {
    testState.actionCooldown--;
    return null;
  }
  
  // Priority 1: Collect all sun aggressively
  if (gameState.sunDrops.length > 0) {
    const nearestSun = findNearestSun(gameState);
    if (nearestSun) {
      const targetRow = Math.max(0, Math.min(GRID_ROWS - 1, Math.floor((nearestSun.y - GRID_OFFSET_Y) / CELL_HEIGHT)));
      const targetCol = Math.max(0, Math.min(GRID_COLS - 1, Math.floor((nearestSun.x - GRID_OFFSET_X) / CELL_WIDTH)));
      
      if (Math.abs(gameState.cursorRow - targetRow) > 0) {
        testState.actionCooldown = 2;
        return { keyCode: gameState.cursorRow < targetRow ? 40 : 38 };
      }
      if (Math.abs(gameState.cursorCol - targetCol) > 0) {
        testState.actionCooldown = 2;
        return { keyCode: gameState.cursorCol < targetCol ? 39 : 37 };
      }
      
      testState.actionCooldown = 3;
      return { keyCode: 32 }; // SPACE to collect
    }
  }
  
  // Priority 2: Build economy (sunflowers in back)
  const sunflowerCount = countPlantsOfType('SUNFLOWER');
  if (sunflowerCount < 8 && gameState.sun >= 50) {
    return buildPlant(0, [3, 4, 2], [0, 1, 2, 3, 4]); // Index 0 is sunflower
  }
  
  // Priority 3: Defend lanes with zombies
  const threatenedLanes = getThreatenedLanes(gameState);
  if (threatenedLanes.length > 0 && gameState.sun >= 100) {
    // Place peashooters in threatened lanes
    const lane = threatenedLanes[0];
    const targetSpot = findEmptySpotInRow(lane, [2, 3, 4, 5]);
    if (targetSpot) {
      return placePlantAt(1, targetSpot.row, targetSpot.col); // Index 1 is peashooter
    }
  }
  
  // Priority 4: General defense (peashooters in all lanes)
  if (gameState.sun >= 100) {
    const defenseSpot = findEmptySpot([0, 1, 2, 3, 4], [2, 3, 4]);
    if (defenseSpot) {
      return placePlantAt(1, defenseSpot.row, defenseSpot.col);
    }
  }
  
  // Priority 5: Place wallnuts as shields
  if (gameState.sun >= 50 && gameState.zombies.length > 3) {
    const shieldSpot = findEmptySpot([0, 1, 2, 3, 4], [5, 6]);
    if (shieldSpot) {
      return placePlantAt(2, shieldSpot.row, shieldSpot.col); // Index 2 is wallnut
    }
  }
  
  return null;
}

// Helper functions
function findNearestSun(gameState) {
  let nearest = null;
  let nearestDist = Infinity;
  
  const cursorPos = getGridPosition(gameState.cursorRow, gameState.cursorCol);
  
  gameState.sunDrops.forEach(sun => {
    const dx = sun.x - cursorPos.x;
    const dy = sun.y - cursorPos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < nearestDist) {
      nearest = sun;
      nearestDist = dist;
    }
  });
  
  return nearest;
}

function findEmptySpot(rowPriority, colPriority) {
  for (const row of rowPriority) {
    for (const col of colPriority) {
      if (row >= 0 && row < GRID_ROWS && col >= 0 && col < GRID_COLS) {
        if (gameState.plants[row][col] === null) {
          return { row, col };
        }
      }
    }
  }
  return null;
}

function findEmptySpotInRow(row, colPriority) {
  for (const col of colPriority) {
    if (col >= 0 && col < GRID_COLS && gameState.plants[row][col] === null) {
      return { row, col };
    }
  }
  return null;
}

function countPlantsOfType(type) {
  let count = 0;
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const plant = gameState.plants[row][col];
      if (plant && plant.type === type) {
        count++;
      }
    }
  }
  return count;
}

function getThreatenedLanes(gameState) {
  const threatened = new Set();
  gameState.zombies.forEach(zombie => {
    if (zombie.x < 400) {
      threatened.add(zombie.row);
    }
  });
  return Array.from(threatened);
}

function buildPlant(plantIndex, rowPriority, colPriority) {
  if (gameState.selectedPlantIndex !== plantIndex) {
    testState.actionCooldown = 3;
    return { keyCode: 90 }; // Z to cycle
  }
  
  const spot = findEmptySpot(rowPriority, colPriority);
  if (!spot) return null;
  
  return placePlantAt(plantIndex, spot.row, spot.col);
}

function placePlantAt(plantIndex, row, col) {
  // Select plant if not selected
  if (gameState.selectedPlantIndex !== plantIndex) {
    testState.actionCooldown = 5;
    return { keyCode: 90 }; // Z to cycle
  }
  
  // Move cursor to target position
  if (gameState.cursorRow !== row) {
    testState.actionCooldown = 2;
    return { keyCode: gameState.cursorRow < row ? 40 : 38 };
  }
  if (gameState.cursorCol !== col) {
    testState.actionCooldown = 2;
    return { keyCode: gameState.cursorCol < col ? 39 : 37 };
  }
  
  // Place plant
  testState.actionCooldown = 8;
  return { keyCode: 32 }; // SPACE to place
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getTest1Action(gameState);
    case "TEST_2":
      return getTest2Action(gameState);
    default:
      return null;
  }
}

window.get_automated_testing_action = get_automated_testing_action;