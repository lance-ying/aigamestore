// automated_testing_controller.js - Automated testing functions

import { gameState, PHASE_PLAYING, UNIT_COMMANDO, UNIT_SNIPER, UNIT_HEAVY, MAP_WIDTH, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

let testState = {
  initialized: false,
  actionQueue: [],
  framesSinceLastAction: 0,
  deployPositions: [],
  currentStrategy: 'initial',
  lastCameraX: 0,
  lastCameraY: 0
};

function getTestWinAction(gs) {
  if (gs.gamePhase !== PHASE_PLAYING) return null;
  
  if (!testState.initialized) {
    initializeTestStrategy(gs);
    testState.initialized = true;
  }
  
  testState.framesSinceLastAction++;
  
  // Execute queued actions
  if (testState.actionQueue.length > 0 && testState.framesSinceLastAction > 5) {
    const action = testState.actionQueue.shift();
    testState.framesSinceLastAction = 0;
    return action;
  }
  
  // Strategic decision making
  if (testState.framesSinceLastAction > 30) {
    const action = makeStrategicDecision(gs);
    if (action) {
      testState.framesSinceLastAction = 0;
      return action;
    }
  }
  
  // Default: maintain camera position and prepare
  return null;
}

function initializeTestStrategy(gs) {
  // Plan deployment positions across the map
  testState.deployPositions = [
    { x: 200, y: 200 },
    { x: 200, y: 400 },
    { x: 200, y: 600 },
    { x: 400, y: 300 },
    { x: 400, y: 500 },
    { x: 600, y: 400 }
  ];
}

function makeStrategicDecision(gs) {
  // Priority 1: Use hero ability if enemies are clustered
  if (gs.heroAbilityCooldown === 0 && gs.energy >= 60 && gs.enemies.length >= 3) {
    return { keyCode: 90 }; // Z key
  }
  
  // Priority 2: Deploy units if we have energy and few units
  if (gs.energy >= 50 && gs.units.length < 12) {
    // Scroll to a good position first
    if (testState.deployPositions.length > 0) {
      const targetPos = testState.deployPositions[0];
      
      // Scroll camera if needed
      const targetCameraX = Math.max(0, Math.min(MAP_WIDTH - CANVAS_WIDTH, targetPos.x - CANVAS_WIDTH / 2));
      const targetCameraY = Math.max(0, Math.min(800 - CANVAS_HEIGHT, targetPos.y - CANVAS_HEIGHT / 2));
      
      if (Math.abs(gs.cameraX - targetCameraX) > 50) {
        return gs.cameraX < targetCameraX ? { keyCode: 39 } : { keyCode: 37 };
      }
      
      if (Math.abs(gs.cameraY - targetCameraY) > 50) {
        return gs.cameraY < targetCameraY ? { keyCode: 40 } : { keyCode: 38 };
      }
      
      // Camera is positioned, now deploy
      gs.cursorX = targetPos.x - gs.cameraX;
      gs.cursorY = targetPos.y - gs.cameraY;
      
      // Cycle to appropriate unit type
      if (gs.enemies.length > 5 && gs.selectedUnitType !== UNIT_HEAVY) {
        return { keyCode: 16 }; // Shift to cycle
      }
      
      testState.deployPositions.shift();
      return { keyCode: 32 }; // Space to deploy
    }
  }
  
  // Priority 3: Scroll to capture points
  if (gs.missionObjectives.capturedPoints < gs.missionObjectives.requiredPoints && gs.capturePoints.length > 0) {
    for (const point of gs.capturePoints) {
      if (!point.captured) {
        const targetCameraX = Math.max(0, Math.min(MAP_WIDTH - CANVAS_WIDTH, point.x - CANVAS_WIDTH / 2));
        
        if (Math.abs(gs.cameraX - targetCameraX) > 100) {
          return gs.cameraX < targetCameraX ? { keyCode: 39 } : { keyCode: 37 };
        }
        break;
      }
    }
  }
  
  // Priority 4: Scout the map
  if (gs.cameraX < MAP_WIDTH - CANVAS_WIDTH - 100) {
    return { keyCode: 39 }; // Scroll right
  }
  
  return null;
}

function getMovementTestAction(gs) {
  if (gs.gamePhase !== PHASE_PLAYING) return null;
  
  testState.framesSinceLastAction++;
  
  if (testState.framesSinceLastAction < 20) return null;
  
  testState.framesSinceLastAction = 0;
  
  // Cycle through different actions
  const actions = [
    { keyCode: 39 }, // Right
    { keyCode: 40 }, // Down
    { keyCode: 37 }, // Left
    { keyCode: 38 }, // Up
    { keyCode: 16 }, // Shift (cycle unit)
    { keyCode: 32 }  // Space (deploy)
  ];
  
  return actions[Math.floor(Math.random() * actions.length)];
}

function getResourceTestAction(gs) {
  if (gs.gamePhase !== PHASE_PLAYING) return null;
  
  testState.framesSinceLastAction++;
  
  if (testState.framesSinceLastAction < 30) return null;
  
  testState.framesSinceLastAction = 0;
  
  // Test resource management
  if (gs.energy >= 50) {
    return { keyCode: 32 }; // Deploy unit
  }
  
  if (gs.heroAbilityCooldown === 0 && gs.energy >= 60) {
    return { keyCode: 90 }; // Use ability
  }
  
  return null;
}

function getCombatTestAction(gs) {
  if (gs.gamePhase !== PHASE_PLAYING) return null;
  
  testState.framesSinceLastAction++;
  
  if (testState.framesSinceLastAction < 25) return null;
  
  testState.framesSinceLastAction = 0;
  
  // Deploy units near enemies
  if (gs.enemies.length > 0 && gs.energy >= 40) {
    const enemy = gs.enemies[0];
    gs.cursorX = enemy.x - gs.cameraX;
    gs.cursorY = enemy.y - gs.cameraY;
    return { keyCode: 32 }; // Deploy
  }
  
  return null;
}

function getRandomAction(gs) {
  if (gs.gamePhase !== PHASE_PLAYING) return null;
  
  testState.framesSinceLastAction++;
  
  if (testState.framesSinceLastAction < 15) return null;
  
  testState.framesSinceLastAction = 0;
  
  const actions = [
    { keyCode: 37 }, // Left
    { keyCode: 38 }, // Up
    { keyCode: 39 }, // Right
    { keyCode: 40 }, // Down
    { keyCode: 32 }, // Space
    { keyCode: 16 }, // Shift
    null, null, null // More likely to do nothing
  ];
  
  return actions[Math.floor(Math.random() * actions.length)];
}

export function get_automated_testing_action(gs) {
  switch (gs.controlMode) {
    case "TEST_1":
      return getMovementTestAction(gs);
    case "TEST_2":
      return getTestWinAction(gs);
    case "TEST_3":
      return getResourceTestAction(gs);
    case "TEST_4":
      return getCombatTestAction(gs);
    default:
      return getRandomAction(gs);
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;