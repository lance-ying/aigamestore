// automated_testing_controller.js - Automated testing strategies

import {
  gameState,
  KEY_SPACE,
  KEY_RIGHT,
  KEY_LEFT,
  KEY_Z,
  KEY_SHIFT,
  PHASE_PLAYING,
  PHASE_GAME_OVER_WIN
} from './globals.js';

let testState = {
  currentStep: 0,
  waitFrames: 0,
  lastAction: null,
  visitedLocations: new Set()
};

function resetTestState() {
  testState.currentStep = 0;
  testState.waitFrames = 0;
  testState.lastAction = null;
  testState.visitedLocations = new Set();
}

// TEST_1: Basic interaction testing
function getTest1Action(gs) {
  if (gs.gamePhase !== PHASE_PLAYING) return null;
  
  testState.visitedLocations.add(gs.currentLocation);
  
  // Wait between actions
  if (testState.waitFrames > 0) {
    testState.waitFrames--;
    return null;
  }
  
  // If inventory is open, close it
  if (gs.inventoryOpen) {
    testState.waitFrames = 10;
    return KEY_Z;
  }
  
  // Open inventory occasionally to check items
  if (gs.inventory.length > 0 && testState.currentStep % 15 === 5) {
    testState.waitFrames = 10;
    return KEY_Z;
  }
  
  // Navigate through hotspots and interact
  const action = testState.currentStep % 4;
  testState.currentStep++;
  testState.waitFrames = 15;
  
  if (action === 0) {
    return KEY_RIGHT;
  } else if (action === 1) {
    return KEY_SPACE;
  } else if (action === 2) {
    return KEY_RIGHT;
  } else {
    return KEY_SPACE;
  }
}

// TEST_2: Win the game
function getTest2Action(gs) {
  if (gs.gamePhase !== PHASE_PLAYING) return null;
  if (gs.gamePhase === PHASE_GAME_OVER_WIN) return null;
  
  // Wait between actions
  if (testState.waitFrames > 0) {
    testState.waitFrames--;
    return null;
  }
  
  testState.visitedLocations.add(gs.currentLocation);
  
  // Optimal solution path
  const solution = [
    // Location 0: Paris Street
    { loc: 0, action: 'examine', target: 'Newspaper Stand' },
    { loc: 0, action: 'examine', target: 'Strange Symbol' },
    { loc: 0, action: 'collect', target: 'Briefcase' },
    { loc: 0, action: 'exit', target: 'To Museum' },
    
    // Location 1: Museum Entrance
    { loc: 1, action: 'examine', target: 'Display Case' },
    { loc: 1, action: 'dialogue', target: 'Security Guard' },
    { loc: 1, action: 'collect', target: 'Old Key' },
    { loc: 1, action: 'exit', target: 'To Archive' },
    
    // Location 2: Museum Archive
    { loc: 2, action: 'examine', target: 'Ancient Manuscript' },
    { loc: 2, action: 'collect', target: 'Cipher Wheel' },
    { loc: 2, action: 'use', target: 'Locked Door' },
    
    // Location 3: Secret Chamber
    { loc: 3, action: 'examine', target: 'Ancient Altar' },
    { loc: 3, action: 'collect', target: 'Hidden Documents' },
    { loc: 3, action: 'use', target: 'Final Puzzle' }
  ];
  
  if (testState.currentStep >= solution.length) {
    // Try final puzzle interaction
    testState.waitFrames = 20;
    return KEY_SPACE;
  }
  
  const step = solution[testState.currentStep];
  
  // Check if we're in the right location
  if (gs.currentLocation !== step.loc) {
    // Navigate to exit hotspot to change location
    testState.waitFrames = 10;
    return KEY_RIGHT;
  }
  
  // Execute the step action
  if (step.action === 'examine' || step.action === 'collect' || step.action === 'dialogue' || step.action === 'exit') {
    const needsNavigation = testState.currentStep % 3 !== 2;
    if (needsNavigation) {
      testState.waitFrames = 8;
      return KEY_RIGHT;
    } else {
      testState.currentStep++;
      testState.waitFrames = 30;
      return KEY_SPACE;
    }
  } else if (step.action === 'use') {
    testState.currentStep++;
    testState.waitFrames = 40;
    return KEY_SPACE;
  }
  
  testState.waitFrames = 10;
  return KEY_RIGHT;
}

// TEST_3: Navigation testing
function getTest3Action(gs) {
  if (gs.gamePhase !== PHASE_PLAYING) return null;
  
  if (testState.waitFrames > 0) {
    testState.waitFrames--;
    return null;
  }
  
  testState.visitedLocations.add(gs.currentLocation);
  
  // Try to navigate through all locations
  const action = testState.currentStep % 8;
  testState.currentStep++;
  testState.waitFrames = 12;
  
  if (action < 3) {
    return KEY_RIGHT;
  } else if (action < 6) {
    return KEY_LEFT;
  } else {
    return KEY_SPACE;
  }
}

// Random action fallback
function getRandomAction(gs) {
  if (gs.gamePhase !== PHASE_PLAYING) return null;
  
  const actions = [KEY_LEFT, KEY_RIGHT, KEY_SPACE];
  const randomIndex = Math.floor(Math.random() * actions.length);
  return actions[randomIndex];
}

export function get_automated_testing_action(gs) {
  if (!gs || gs.gamePhase !== PHASE_PLAYING) {
    return null;
  }
  
  switch (gs.controlMode) {
    case "TEST_1":
      return getTest1Action(gs);
    case "TEST_2":
      return getTest2Action(gs);
    case "TEST_3":
      return getTest3Action(gs);
    default:
      return getRandomAction(gs);
  }
}

// Reset test state when control mode changes
export function onControlModeChange() {
  resetTestState();
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;