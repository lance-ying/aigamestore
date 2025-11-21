// automated_testing_controller.js - Automated testing logic

import { gameState, LOCATIONS, GAME_PHASES } from './globals.js';
import { getVisibleHotspots } from './location_manager.js';

// Key code mappings
const KEYS = {
  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40,
  SPACE: 32,
  SHIFT: 16,
  Z: 90
};

let testState = {
  step: 0,
  lastLocation: "",
  stuckCounter: 0,
  lastAction: null,
  visitedHotspots: new Set()
};

function getTestWinAction(gameState) {
  // Optimal winning strategy
  const steps = [
    // Beach: Collect driftwood and shell
    { phase: "collect_driftwood", location: "beach", hotspotId: "driftwood", action: KEYS.SPACE },
    { phase: "collect_shell", location: "beach", hotspotId: "shell", action: KEYS.SPACE },
    // Go to forest
    { phase: "to_forest", location: "beach", hotspotId: "toForest", action: KEYS.SPACE },
    // Forest: Use driftwood on vines
    { phase: "select_driftwood", location: "forest", action: KEYS.SHIFT },
    { phase: "use_driftwood", location: "forest", hotspotId: "vines", action: KEYS.SPACE },
    { phase: "collect_key", location: "forest", hotspotId: "key", action: KEYS.SPACE },
    // Go to lighthouse
    { phase: "to_lighthouse", location: "forest", hotspotId: "toLighthouse", action: KEYS.SPACE },
    // Lighthouse: Use key on door
    { phase: "select_key", location: "lighthouse", action: KEYS.SHIFT },
    { phase: "use_key", location: "lighthouse", hotspotId: "door", action: KEYS.SPACE },
    { phase: "collect_map", location: "lighthouse", hotspotId: "map", action: KEYS.SPACE },
    { phase: "solve_code", location: "lighthouse", hotspotId: "code", action: KEYS.SPACE },
    // Go to temple
    { phase: "to_temple", location: "lighthouse", hotspotId: "toTemple", action: KEYS.SPACE },
    // Temple: Use map and shell
    { phase: "select_map", location: "temple", action: KEYS.SHIFT },
    { phase: "use_map_shell", location: "temple", hotspotId: "door", action: KEYS.SPACE },
    { phase: "collect_gem", location: "temple", hotspotId: "gem", action: KEYS.SPACE },
    // Go to cave
    { phase: "to_cave", location: "temple", hotspotId: "toCave", action: KEYS.SPACE },
    // Cave: Collect crystal and complete altar
    { phase: "collect_crystal", location: "cave", hotspotId: "crystal", action: KEYS.SPACE },
    { phase: "select_gem", location: "cave", action: KEYS.SHIFT },
    { phase: "complete_altar", location: "cave", hotspotId: "altar", action: KEYS.SPACE }
  ];
  
  if (testState.step >= steps.length) {
    return { keyCode: KEYS.SPACE };
  }
  
  const currentStep = steps[testState.step];
  
  // Check if we're in the right location
  if (currentStep.location && gameState.currentLocation !== currentStep.location) {
    return null;
  }
  
  // Check if we need to select a specific hotspot
  if (currentStep.hotspotId) {
    const visibleHotspots = getVisibleHotspots();
    const targetIndex = visibleHotspots.findIndex(h => h.id === currentStep.hotspotId);
    
    if (targetIndex >= 0 && gameState.selectedHotspotIndex !== targetIndex) {
      // Navigate to the hotspot
      if (gameState.selectedHotspotIndex < targetIndex) {
        return { keyCode: KEYS.DOWN };
      } else {
        return { keyCode: KEYS.UP };
      }
    }
  }
  
  // Execute the action
  if (currentStep.action === KEYS.SHIFT) {
    testState.step++;
    return { keyCode: KEYS.SHIFT };
  }
  
  if (currentStep.action === KEYS.SPACE) {
    testState.step++;
    return { keyCode: KEYS.SPACE };
  }
  
  return null;
}

function getRandomAction(gameState) {
  const actions = [KEYS.LEFT, KEYS.RIGHT, KEYS.UP, KEYS.DOWN, KEYS.SPACE, KEYS.SHIFT];
  const randomIndex = Math.floor(Math.random() * actions.length);
  return { keyCode: actions[randomIndex] };
}

function getBasicTestAction(gameState) {
  // Test basic movement and interaction
  const visibleHotspots = getVisibleHotspots();
  
  if (visibleHotspots.length === 0) {
    return { keyCode: KEYS.SPACE };
  }
  
  // Cycle through hotspots
  if (testState.step % 20 < 10) {
    return { keyCode: KEYS.DOWN };
  } else if (testState.step % 20 < 15) {
    return { keyCode: KEYS.SPACE };
  } else {
    return { keyCode: KEYS.SHIFT };
  }
}

function getInventoryTestAction(gameState) {
  // Test inventory management
  if (testState.step % 30 < 10) {
    return { keyCode: KEYS.SPACE }; // Collect items
  } else if (testState.step % 30 < 20) {
    return { keyCode: KEYS.SHIFT }; // Cycle inventory
  } else {
    return { keyCode: KEYS.Z }; // Examine items
  }
}

export function get_automated_testing_action(gameState) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return null;
  }
  
  // Update test state
  testState.step++;
  
  // Detect location changes
  if (testState.lastLocation !== gameState.currentLocation) {
    testState.lastLocation = gameState.currentLocation;
    testState.stuckCounter = 0;
  }
  
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getInventoryTestAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;