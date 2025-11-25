import { gameState, COMPONENT_TYPES, DIRECTIONS, GRID_SIZE } from './globals.js';

let testState = {
  buildPhase: true,
  componentsPlaced: false,
  waitingForCompletion: false,
  lastAction: null,
  actionCooldown: 0,
  buildPlan: [],
  currentBuildStep: 0
};

function getTestWinAction(gs) {
  // Reset cooldown
  if (testState.actionCooldown > 0) {
    testState.actionCooldown--;
    return null;
  }

  // Build phase
  if (!testState.componentsPlaced) {
    return executeBuildPlan(gs);
  }

  // Wait for materials to be processed and delivered
  testState.waitingForCompletion = true;
  return null;
}

function executeBuildPlan(gs) {
  // Generate build plan if not exists
  if (testState.buildPlan.length === 0) {
    generateBuildPlan(gs);
  }

  // Enable build mode
  if (!gs.buildMode) {
    testState.actionCooldown = 5;
    return { keyCode: 16 }; // SHIFT
  }

  // Execute build steps
  if (testState.currentBuildStep < testState.buildPlan.length) {
    const step = testState.buildPlan[testState.currentBuildStep];
    
    // Move to position
    if (gs.cursorX !== step.x || gs.cursorY !== step.y) {
      if (gs.cursorX < step.x) return { keyCode: 39 }; // RIGHT
      if (gs.cursorX > step.x) return { keyCode: 37 }; // LEFT
      if (gs.cursorY < step.y) return { keyCode: 40 }; // DOWN
      if (gs.cursorY > step.y) return { keyCode: 38 }; // UP
    }

    // Select component type
    if (gs.selectedComponent !== step.type) {
      testState.actionCooldown = 3;
      return { keyCode: 90 }; // Z
    }

    // Place component
    testState.currentBuildStep++;
    testState.actionCooldown = 5;
    
    if (testState.currentBuildStep >= testState.buildPlan.length) {
      testState.componentsPlaced = true;
    }
    
    return { keyCode: 32 }; // SPACE
  }

  return null;
}

function generateBuildPlan(gs) {
  testState.buildPlan = [];

  // Determine what to build based on level
  if (gs.level === 1) {
    // Simple conveyor line
    for (let x = 2; x <= 12; x++) {
      testState.buildPlan.push({ x, y: 4, type: COMPONENT_TYPES.CONVEYOR });
    }
  } else if (gs.level === 2) {
    // Conveyor with processor
    for (let x = 2; x <= 5; x++) {
      testState.buildPlan.push({ x, y: 4, type: COMPONENT_TYPES.CONVEYOR });
    }
    testState.buildPlan.push({ x: 6, y: 4, type: COMPONENT_TYPES.PROCESSOR });
    for (let x = 7; x <= 12; x++) {
      testState.buildPlan.push({ x, y: 4, type: COMPONENT_TYPES.CONVEYOR });
    }
  } else if (gs.level === 3) {
    // Multi-stage processing
    // Top line
    for (let x = 2; x <= 5; x++) {
      testState.buildPlan.push({ x, y: 2, type: COMPONENT_TYPES.CONVEYOR });
    }
    testState.buildPlan.push({ x: 6, y: 2, type: COMPONENT_TYPES.PROCESSOR });
    testState.buildPlan.push({ x: 7, y: 2, type: COMPONENT_TYPES.CONVEYOR });
    testState.buildPlan.push({ x: 7, y: 3, type: COMPONENT_TYPES.CONVEYOR });
    testState.buildPlan.push({ x: 7, y: 4, type: COMPONENT_TYPES.CONVEYOR });
    
    // Bottom line to middle
    for (let x = 2; x <= 6; x++) {
      testState.buildPlan.push({ x, y: 7, type: COMPONENT_TYPES.CONVEYOR });
    }
    testState.buildPlan.push({ x: 6, y: 6, type: COMPONENT_TYPES.CONVEYOR });
    testState.buildPlan.push({ x: 6, y: 5, type: COMPONENT_TYPES.CONVEYOR });
    testState.buildPlan.push({ x: 6, y: 4, type: COMPONENT_TYPES.CONVEYOR });
    
    // Process and deliver
    testState.buildPlan.push({ x: 8, y: 4, type: COMPONENT_TYPES.PROCESSOR });
    for (let x = 9; x <= 12; x++) {
      testState.buildPlan.push({ x, y: 4, type: COMPONENT_TYPES.CONVEYOR });
    }
  } else {
    // Complex factory (level 4)
    // Line 1 to processor to goal 1
    for (let x = 2; x <= 5; x++) {
      testState.buildPlan.push({ x, y: 1, type: COMPONENT_TYPES.CONVEYOR });
    }
    testState.buildPlan.push({ x: 6, y: 1, type: COMPONENT_TYPES.PROCESSOR });
    testState.buildPlan.push({ x: 7, y: 1, type: COMPONENT_TYPES.CONVEYOR });
    testState.buildPlan.push({ x: 7, y: 2, type: COMPONENT_TYPES.CONVEYOR });
    for (let x = 8; x <= 12; x++) {
      testState.buildPlan.push({ x, y: 2, type: COMPONENT_TYPES.CONVEYOR });
    }
    
    // Line 2 processing
    for (let x = 2; x <= 5; x++) {
      testState.buildPlan.push({ x, y: 5, type: COMPONENT_TYPES.CONVEYOR });
    }
    testState.buildPlan.push({ x: 6, y: 5, type: COMPONENT_TYPES.PROCESSOR });
    testState.buildPlan.push({ x: 7, y: 5, type: COMPONENT_TYPES.CONVEYOR });
    testState.buildPlan.push({ x: 8, y: 5, type: COMPONENT_TYPES.PROCESSOR });
    testState.buildPlan.push({ x: 9, y: 5, type: COMPONENT_TYPES.CONVEYOR });
    testState.buildPlan.push({ x: 9, y: 6, type: COMPONENT_TYPES.CONVEYOR });
    testState.buildPlan.push({ x: 9, y: 7, type: COMPONENT_TYPES.CONVEYOR });
    for (let x = 10; x <= 12; x++) {
      testState.buildPlan.push({ x, y: 7, type: COMPONENT_TYPES.CONVEYOR });
    }
    
    // Line 3 to middle
    for (let x = 2; x <= 12; x++) {
      testState.buildPlan.push({ x, y: 8, type: COMPONENT_TYPES.CONVEYOR });
    }
  }
}

function getTestPlacementAction(gs) {
  // Test component placement and removal
  if (!gs.buildMode) {
    return { keyCode: 16 }; // SHIFT
  }

  // Cycle through components
  if (testState.actionCooldown === 0) {
    testState.actionCooldown = 10;
    return { keyCode: 90 }; // Z
  }

  testState.actionCooldown--;
  
  // Place components at various positions
  if (Math.random() < 0.1) {
    return { keyCode: 32 }; // SPACE
  }

  // Random movement
  const moves = [37, 38, 39, 40];
  return { keyCode: moves[Math.floor(Math.random() * moves.length)] };
}

function getTestMovementAction(gs) {
  // Test cursor movement
  if (!gs.buildMode) {
    return { keyCode: 16 }; // SHIFT
  }

  const moves = [37, 38, 39, 40]; // Arrow keys
  return { keyCode: moves[Math.floor(Math.random() * moves.length)] };
}

function getRandomAction(gs) {
  const actions = [37, 38, 39, 40, 32, 90, 16];
  return { keyCode: actions[Math.floor(Math.random() * actions.length)] };
}

export function get_automated_testing_action(gs) {
  if (!gs || gs.gamePhase !== "PLAYING") {
    return null;
  }

  switch (gs.controlMode) {
    case "TEST_1":
      return getTestMovementAction(gs);
    case "TEST_2":
      return getTestWinAction(gs);
    case "TEST_3":
      return getTestPlacementAction(gs);
    case "TEST_4":
      return getTestWinAction(gs);
    default:
      return getRandomAction(gs);
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;