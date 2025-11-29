// automated_testing_controller.js
import { gameState, FACILITY_TYPES, SHOP_ITEMS } from './globals.js';

let testState = {
  initialized: false,
  phase: 0,
  waitTimer: 0,
  facilityQueue: [],
  lastAction: null,
  actionTimer: 0
};

function getTestWinAction(gameState) {
  if (!testState.initialized) {
    testState.initialized = true;
    testState.phase = 0;
    testState.waitTimer = 0;
    testState.facilityQueue = [];
    
    // Build comprehensive facility plan
    const plan = [];
    
    // Phase 1: Basic facilities in grid pattern
    for (let i = 0; i < 4; i++) {
      plan.push({ type: 'tent', x: i * 2, y: 0 });
    }
    for (let i = 0; i < 3; i++) {
      plan.push({ type: 'fishing', x: i * 2, y: 2 });
    }
    for (let i = 0; i < 3; i++) {
      plan.push({ type: 'campfire', x: i * 2 + 1, y: 2 });
    }
    
    // Phase 2: More tents and variety
    for (let i = 0; i < 4; i++) {
      plan.push({ type: 'tent', x: i * 2, y: 4 });
    }
    
    // Phase 3: Advanced facilities (after unlocked)
    for (let i = 0; i < 3; i++) {
      plan.push({ type: 'bug', x: i * 2, y: 6 });
    }
    for (let i = 0; i < 3; i++) {
      plan.push({ type: 'picnic', x: i * 2 + 1, y: 6 });
    }
    
    // Phase 4: Fill remaining space
    for (let i = 4; i < 8; i++) {
      plan.push({ type: 'tent', x: i, y: 0 });
      plan.push({ type: 'tent', x: i, y: 4 });
    }
    
    for (let i = 0; i < 2; i++) {
      plan.push({ type: 'playground', x: 8 + i * 2, y: 2 });
    }
    
    testState.facilityQueue = plan;
  }
  
  testState.actionTimer++;
  
  // Wait between actions
  if (testState.actionTimer < 5) {
    return { keyCode: null };
  }
  
  testState.actionTimer = 0;
  
  // Process facility queue
  if (testState.facilityQueue.length > 0) {
    const next = testState.facilityQueue[0];
    
    // Check if facility type is unlocked
    if (!gameState.unlockedFacilities.includes(next.type)) {
      // Wait for unlock
      testState.waitTimer++;
      if (testState.waitTimer > 100) {
        testState.facilityQueue.shift(); // Skip if waiting too long
        testState.waitTimer = 0;
      }
      return { keyCode: null };
    }
    
    // Check if we can afford it
    const facilityData = FACILITY_TYPES[next.type.toUpperCase()];
    if (gameState.currency < facilityData.cost) {
      // Wait for currency
      testState.waitTimer++;
      if (testState.waitTimer > 300) {
        testState.facilityQueue.shift(); // Skip if waiting too long
        testState.waitTimer = 0;
      }
      return { keyCode: null };
    }
    
    // Select facility type
    if (gameState.selectedFacilityType !== next.type) {
      const currentIndex = gameState.unlockedFacilities.indexOf(gameState.selectedFacilityType);
      const targetIndex = gameState.unlockedFacilities.indexOf(next.type);
      
      if (targetIndex > currentIndex) {
        return { keyCode: 40 }; // DOWN
      } else {
        return { keyCode: 38 }; // UP
      }
    }
    
    // Check if position is available
    const occupied = gameState.facilities.some(f => f.gridX === next.x && f.gridY === next.y);
    if (occupied) {
      testState.facilityQueue.shift();
      return { keyCode: null };
    }
    
    // Place facility (simulate space at correct position)
    // Note: This is simplified; in real implementation, we'd need to move mouse
    testState.facilityQueue.shift();
    return { keyCode: 32 }; // SPACE
  }
  
  // Buy shop items periodically
  if (gameState.currency > 500 && Math.random() < 0.1) {
    return { keyCode: 16 }; // Toggle shop mode
  }
  
  return { keyCode: null };
}

function getBasicTestAction(gameState) {
  testState.actionTimer++;
  
  if (testState.actionTimer < 10) {
    return { keyCode: null };
  }
  
  testState.actionTimer = 0;
  
  // Place a few basic facilities
  if (gameState.facilities.length < 3) {
    if (!gameState.selectedFacilityType) {
      return { keyCode: 40 }; // Select first facility
    }
    
    if (gameState.currency >= 50) {
      return { keyCode: 32 }; // Place facility
    }
  }
  
  return { keyCode: null };
}

function getRandomAction(gameState) {
  const actions = [null, 38, 40, 32];
  const choice = actions[Math.floor(Math.random() * actions.length)];
  return { keyCode: choice };
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

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;