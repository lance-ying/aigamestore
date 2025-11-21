import { gameState } from './globals.js';

// TEST_1: Basic testing with sticky keys
function getStickyKeysAction(gameState) {
  const actionKeys = [32, 37, 38, 39, 40, 90, 16]; // SPACE, LEFT, UP, RIGHT, DOWN, Z, SHIFT
  gameState.framesSinceLastAction = gameState.framesSinceLastAction || 0;
  
  // Change action every 60 frames (1 second)
  if (gameState.framesSinceLastAction > 60) {
    gameState.currentTestAction = actionKeys[Math.floor(Math.random() * actionKeys.length)];
    gameState.framesSinceLastAction = 0;
    
    // Occasionally place a tower (SPACE)
    if (Math.random() < 0.3) {
      return 32; // SPACE
    }
    
    // Occasionally upgrade (SHIFT)
    if (Math.random() < 0.2) {
      return 16; // SHIFT
    }
    
    // Occasionally change tower type (Z)
    if (Math.random() < 0.2) {
      return 90; // Z
    }
  }
  
  // Movement pattern: move cursor around in a somewhat random pattern
  if (gameState.framesSinceLastAction % 10 === 0) {
    return actionKeys[1 + Math.floor(Math.random() * 4)]; // Random direction
  }
  
  return gameState.currentTestAction;
}

// TEST_2: Win strategy
function getTestWinAction(gameState) {
  // Strategic positions for towers
  const strategicPositions = [
    {x: 100, y: 100}, // Near first curve
    {x: 100, y: 300}, // Near second curve
    {x: 300, y: 100}, // Near third curve
    {x: 300, y: 300}, // Near fourth curve
    {x: 500, y: 300}, // Near exit
    {x: 200, y: 300}, // Middle of path
    {x: 400, y: 100}, // Middle of path
    {x: 250, y: 150}, // Central position
    {x: 350, y: 250}, // Central position
  ];
  
  // Initialize test state if needed
  if (!gameState.testState) {
    gameState.testState = {
      placedTowers: 0,
      targetPositionIndex: 0,
      movingToTarget: true,
      placingFarms: false,
      lastAction: null,
      actionCount: 0,
      stuckCount: 0,
      lastPosition: {x: gameState.cursor.x, y: gameState.cursor.y}
    };
  }
  
  const ts = gameState.testState;
  
  // Check if stuck (cursor not moving)
  if (ts.lastPosition.x === gameState.cursor.x && ts.lastPosition.y === gameState.cursor.y) {
    ts.stuckCount++;
    if (ts.stuckCount > 30) {
      // Try a random action to get unstuck
      ts.stuckCount = 0;
      return [37, 38, 39, 40][Math.floor(Math.random() * 4)];
    }
  } else {
    ts.stuckCount = 0;
    ts.lastPosition = {x: gameState.cursor.x, y: gameState.cursor.y};
  }
  
  // Phase 1: Place initial towers at strategic positions
  if (ts.placedTowers < 5) {
    // First, ensure we have the right tower type
    if (gameState.wave < 5 && gameState.cursor.selectedTower !== "DART") {
      return 90; // Z to cycle tower type to DART
    } else if (gameState.wave >= 5 && gameState.wave < 10 && gameState.cursor.selectedTower !== "TACK") {
      return 90; // Z to cycle tower type to TACK
    } else if (gameState.wave >= 10 && gameState.cursor.selectedTower !== "BOMB") {
      return 90; // Z to cycle tower type to BOMB
    }
    
    // Move cursor to target position
    if (ts.movingToTarget) {
      const target = strategicPositions[ts.targetPositionIndex];
      
      // Determine movement direction
      if (Math.abs(gameState.cursor.x - target.x) > 20) {
        return (gameState.cursor.x < target.x) ? 39 : 37; // RIGHT or LEFT
      } else if (Math.abs(gameState.cursor.y - target.y) > 20) {
        return (gameState.cursor.y < target.y) ? 40 : 38; // DOWN or UP
      } else {
        ts.movingToTarget = false;
      }
    } else {
      // Try to place tower
      if (gameState.money >= 100) { // Basic check if we can afford any tower
        ts.placedTowers++;
        ts.targetPositionIndex = (ts.targetPositionIndex + 1) % strategicPositions.length;
        ts.movingToTarget = true;
        return 32; // SPACE to place tower
      } else {
        // Wait for money
        return null;
      }
    }
  } 
  // Phase 2: Place farms when we have enough defense
  else if (gameState.wave >= 3 && gameState.wave < 10 && gameState.money > 350) {
    // Switch to farm if not selected
    if (gameState.cursor.selectedTower !== "FARM") {
      return 90; // Z to cycle tower type
    }
    
    // Find open space for farm
    const farmPositions = [
      {x: 150, y: 200},
      {x: 450, y: 200},
      {x: 150, y: 350},
      {x: 450, y: 350},
      {x: 300, y: 350}
    ];
    
    // Move to farm position
    if (!ts.farmPositionIndex) ts.farmPositionIndex = 0;
    const farmPos = farmPositions[ts.farmPositionIndex % farmPositions.length];
    
    if (Math.abs(gameState.cursor.x - farmPos.x) > 20) {
      return (gameState.cursor.x < farmPos.x) ? 39 : 37; // RIGHT or LEFT
    } else if (Math.abs(gameState.cursor.y - farmPos.y) > 20) {
      return (gameState.cursor.y < farmPos.y) ? 40 : 38; // DOWN or UP
    } else {
      ts.farmPositionIndex++;
      return 32; // SPACE to place farm
    }
  }
  // Phase 3: Upgrade existing towers
  else if (gameState.money > 100) {
    // Find and upgrade towers
    if (!ts.upgradingTowers) {
      ts.upgradingTowers = true;
      ts.upgradePositionIndex = 0;
    }
    
    // Move cursor to each strategic position to find towers
    const upgradePos = strategicPositions[ts.upgradePositionIndex % strategicPositions.length];
    
    if (Math.abs(gameState.cursor.x - upgradePos.x) > 20) {
      return (gameState.cursor.x < upgradePos.x) ? 39 : 37; // RIGHT or LEFT
    } else if (Math.abs(gameState.cursor.y - upgradePos.y) > 20) {
      return (gameState.cursor.y < upgradePos.y) ? 40 : 38; // DOWN or UP
    } else {
      // Try to upgrade if we're over a tower
      if (gameState.cursor.hoveredTower) {
        ts.upgradePositionIndex++;
        return 16; // SHIFT to upgrade
      } else {
        // Move to next position
        ts.upgradePositionIndex++;
        // If we've checked all positions, place more towers
        if (ts.upgradePositionIndex >= strategicPositions.length) {
          ts.upgradingTowers = false;
          ts.placedTowers = Math.max(0, ts.placedTowers - 2); // Allow placing more towers
        }
        return null;
      }
    }
  }
  
  // Default: move randomly to avoid getting stuck
  return [37, 38, 39, 40][Math.floor(Math.random() * 4)];
}

// TEST_3: Tower selection and upgrade test
function getTestTowerSelectionAction(gameState) {
  // Initialize test state if needed
  if (!gameState.towerTestState) {
    gameState.towerTestState = {
      phase: 'select_dart',
      placementPosition: 0,
      positions: [
        {x: 100, y: 100},
        {x: 200, y: 100},
        {x: 300, y: 100},
        {x: 400, y: 100}
      ],
      currentPosition: {x: 0, y: 0},
      actionCount: 0
    };
  }
  
  const ts = gameState.towerTestState;
  ts.actionCount++;
  
  // Test cycle: select each tower type, place it, then upgrade it
  switch(ts.phase) {
    case 'select_dart':
      if (gameState.cursor.selectedTower === 'DART') {
        ts.phase = 'move_to_position';
        ts.currentPosition = ts.positions[0];
      } else {
        return 90; // Z to cycle tower
      }
      break;
      
    case 'select_bomb':
      if (gameState.cursor.selectedTower === 'BOMB') {
        ts.phase = 'move_to_position';
        ts.currentPosition = ts.positions[1];
      } else {
        return 90; // Z to cycle tower
      }
      break;
      
    case 'select_tack':
      if (gameState.cursor.selectedTower === 'TACK') {
        ts.phase = 'move_to_position';
        ts.currentPosition = ts.positions[2];
      } else {
        return 90; // Z to cycle tower
      }
      break;
      
    case 'select_farm':
      if (gameState.cursor.selectedTower === 'FARM') {
        ts.phase = 'move_to_position';
        ts.currentPosition = ts.positions[3];
      } else {
        return 90; // Z to cycle tower
      }
      break;
      
    case 'move_to_position':
      // Move cursor to target position
      if (Math.abs(gameState.cursor.x - ts.currentPosition.x) > 20) {
        return (gameState.cursor.x < ts.currentPosition.x) ? 39 : 37; // RIGHT or LEFT
      } else if (Math.abs(gameState.cursor.y - ts.currentPosition.y) > 20) {
        return (gameState.cursor.y < ts.currentPosition.y) ? 40 : 38; // DOWN or UP
      } else {
        ts.phase = 'place_tower';
      }
      break;
      
    case 'place_tower':
      if (gameState.money >= 100) { // Basic check if we can afford
        ts.phase = 'upgrade_tower';
        return 32; // SPACE to place tower
      } else {
        // Wait for money
        return null;
      }
      break;
      
    case 'upgrade_tower':
      if (gameState.money >= 75) { // Basic check if we can afford upgrade
        // Move to next tower type
        if (gameState.cursor.selectedTower === 'DART') {
          ts.phase = 'select_bomb';
        } else if (gameState.cursor.selectedTower === 'BOMB') {
          ts.phase = 'select_tack';
        } else if (gameState.cursor.selectedTower === 'TACK') {
          ts.phase = 'select_farm';
        } else {
          ts.phase = 'select_dart'; // Start over
        }
        return 16; // SHIFT to upgrade
      } else {
        // Wait for money
        return null;
      }
      break;
  }
  
  // Default action to avoid getting stuck
  if (ts.actionCount > 120) {
    ts.actionCount = 0;
    return [37, 38, 39, 40, 90][Math.floor(Math.random() * 5)];
  }
  
  return null;
}

// TEST_4: Economy test
function getTestEconomyAction(gameState) {
  // Initialize test state if needed
  if (!gameState.economyTestState) {
    gameState.economyTestState = {
      phase: 'build_defense',
      farmCount: 0,
      maxFarms: 5,
      defensePositions: [
        {x: 100, y: 100}, // Initial defense
        {x: 300, y: 300}  // Second defense point
      ],
      farmPositions: [
        {x: 150, y: 200},
        {x: 250, y: 200},
        {x: 350, y: 200},
        {x: 450, y: 200},
        {x: 150, y: 350}
      ],
      currentTarget: null,
      actionCount: 0
    };
  }
  
  const ts = gameState.economyTestState;
  ts.actionCount++;
  
  // Phases: 1. Build minimal defense, 2. Build farms, 3. Upgrade farms, 4. Build more defense
  switch(ts.phase) {
    case 'build_defense':
      // Make sure we have DART selected
      if (gameState.cursor.selectedTower !== 'DART') {
        return 90; // Z to cycle tower
      }
      
      // Move to defense position
      if (!ts.currentTarget) {
        ts.currentTarget = ts.defensePositions[0];
      }
      
      if (Math.abs(gameState.cursor.x - ts.currentTarget.x) > 20) {
        return (gameState.cursor.x < ts.currentTarget.x) ? 39 : 37; // RIGHT or LEFT
      } else if (Math.abs(gameState.cursor.y - ts.currentTarget.y) > 20) {
        return (gameState.cursor.y < ts.currentTarget.y) ? 40 : 38; // DOWN or UP
      } else {
        // Place tower if we can afford it
        if (gameState.money >= 100) {
          ts.phase = 'build_farms';
          ts.currentTarget = null;
          return 32; // SPACE to place tower
        }
      }
      break;
      
    case 'build_farms':
      // Make sure we have FARM selected
      if (gameState.cursor.selectedTower !== 'FARM') {
        return 90; // Z to cycle tower
      }
      
      // Move to farm position
      if (!ts.currentTarget && ts.farmCount < ts.maxFarms) {
        ts.currentTarget = ts.farmPositions[ts.farmCount];
      } else if (ts.farmCount >= ts.maxFarms) {
        ts.phase = 'upgrade_farms';
        ts.currentTarget = ts.farmPositions[0];
        ts.farmCount = 0;
        break;
      }
      
      if (Math.abs(gameState.cursor.x - ts.currentTarget.x) > 20) {
        return (gameState.cursor.x < ts.currentTarget.x) ? 39 : 37; // RIGHT or LEFT
      } else if (Math.abs(gameState.cursor.y - ts.currentTarget.y) > 20) {
        return (gameState.cursor.y < ts.currentTarget.y) ? 40 : 38; // DOWN or UP
      } else {
        // Place farm if we can afford it
        if (gameState.money >= 300) {
          ts.farmCount++;
          ts.currentTarget = null;
          return 32; // SPACE to place farm
        }
      }
      break;
      
    case 'upgrade_farms':
      // Move to each farm position to upgrade
      if (!ts.currentTarget && ts.farmCount < ts.maxFarms) {
        ts.currentTarget = ts.farmPositions[ts.farmCount];
      } else if (ts.farmCount >= ts.maxFarms) {
        ts.phase = 'build_more_defense';
        ts.currentTarget = ts.defensePositions[1];
        break;
      }
      
      if (Math.abs(gameState.cursor.x - ts.currentTarget.x) > 20) {
        return (gameState.cursor.x < ts.currentTarget.x) ? 39 : 37; // RIGHT or LEFT
      } else if (Math.abs(gameState.cursor.y - ts.currentTarget.y) > 20) {
        return (gameState.cursor.y < ts.currentTarget.y) ? 40 : 38; // DOWN or UP
      } else {
        // Upgrade if we have a tower and can afford it
        if (gameState.cursor.hoveredTower && gameState.money >= 200) {
          ts.farmCount++;
          ts.currentTarget = null;
          return 16; // SHIFT to upgrade
        } else {
          // Move to next position if no tower here
          ts.farmCount++;
          ts.currentTarget = null;
        }
      }
      break;
      
    case 'build_more_defense':
      // Now we should have lots of money, place more defense
      // Switch to BOMB tower for stronger defense
      if (gameState.cursor.selectedTower !== 'BOMB') {
        return 90; // Z to cycle tower
      }
      
      if (Math.abs(gameState.cursor.x - ts.currentTarget.x) > 20) {
        return (gameState.cursor.x < ts.currentTarget.x) ? 39 : 37; // RIGHT or LEFT
      } else if (Math.abs(gameState.cursor.y - ts.currentTarget.y) > 20) {
        return (gameState.cursor.y < ts.currentTarget.y) ? 40 : 38; // DOWN or UP
      } else {
        // Place tower if we can afford it
        if (gameState.money >= 200) {
          ts.phase = 'done';
          return 32; // SPACE to place tower
        }
      }
      break;
      
    case 'done':
      // Just move around and occasionally upgrade towers
      if (Math.random() < 0.1 && gameState.cursor.hoveredTower) {
        return 16; // SHIFT to upgrade
      } else {
        return [37, 38, 39, 40][Math.floor(Math.random() * 4)];
      }
      break;
  }
  
  // Default action to avoid getting stuck
  if (ts.actionCount > 180) {
    ts.actionCount = 0;
    return [37, 38, 39, 40][Math.floor(Math.random() * 4)];
  }
  
  return null;
}

// TEST_5: Difficulty progression test
function getTestDifficultyAction(gameState) {
  // Initialize test state if needed
  if (!gameState.difficultyTestState) {
    gameState.difficultyTestState = {
      setupComplete: false,
      towerPositions: [
        {x: 100, y: 100},
        {x: 300, y: 100},
        {x: 500, y: 300},
      ],
      currentIndex: 0,
      waitingForWave: false,
      actionCount: 0
    };
  }
  
  const ts = gameState.difficultyTestState;
  ts.actionCount++;
  
  // Phase 1: Setup fixed defenses
  if (!ts.setupComplete) {
    // Make sure we have the right tower type
    if (gameState.cursor.selectedTower !== "DART") {
      return 90; // Z to cycle tower type
    }
    
    // Place towers at fixed positions
    const target = ts.towerPositions[ts.currentIndex];
    
    // Move to position
    if (Math.abs(gameState.cursor.x - target.x) > 20) {
      return (gameState.cursor.x < target.x) ? 39 : 37; // RIGHT or LEFT
    } else if (Math.abs(gameState.cursor.y - target.y) > 20) {
      return (gameState.cursor.y < target.y) ? 40 : 38; // DOWN or UP
    } else {
      // Try to place tower
      if (gameState.money >= 100) {
        ts.currentIndex++;
        if (ts.currentIndex >= ts.towerPositions.length) {
          ts.setupComplete = true;
          ts.waitingForWave = true;
        }
        return 32; // SPACE to place tower
      }
    }
  } else {
    // Phase 2: Wait and observe how defenses handle increasing difficulty
    if (ts.waitingForWave && gameState.wave >= 10) {
      ts.waitingForWave = false;
    }
    
    // Move cursor around to observe different parts of the map
    const observationPoints = [
      {x: 100, y: 200},
      {x: 300, y: 200},
      {x: 500, y: 200},
      {x: 300, y: 300}
    ];
    
    if (!ts.observationIndex) ts.observationIndex = 0;
    
    if (ts.actionCount % 120 === 0) {
      ts.observationIndex = (ts.observationIndex + 1) % observationPoints.length;
    }
    
    const target = observationPoints[ts.observationIndex];
    
    if (Math.abs(gameState.cursor.x - target.x) > 20) {
      return (gameState.cursor.x < target.x) ? 39 : 37; // RIGHT or LEFT
    } else if (Math.abs(gameState.cursor.y - target.y) > 20) {
      return (gameState.cursor.y < target.y) ? 40 : 38; // DOWN or UP
    }
  }
  
  // Default action to avoid getting stuck
  if (ts.actionCount > 240) {
    ts.actionCount = 0;
    return [37, 38, 39, 40][Math.floor(Math.random() * 4)];
  }
  
  return null;
}

// Main testing controller
export function game_testing_controller(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getStickyKeysAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getTestTowerSelectionAction(gameState);
    case "TEST_4":
      return getTestEconomyAction(gameState);
    case "TEST_5":
      return getTestDifficultyAction(gameState);
    default:
      return getStickyKeysAction(gameState);
  }
}

// Expose the game_testing_controller function globally
window.game_testing_controller = game_testing_controller;
export default game_testing_controller;