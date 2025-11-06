// automated_testing_controller.js
import { gameState } from './globals.js';

let testState = {
  initialized: false,
  step: 0,
  waitFrames: 0,
  stuckCounter: 0,
  lastRoom: 1,
  lastScore: 0
};

function getTestWinAction(state) {
  // Strategy to win the game
  if (!testState.initialized) {
    testState.initialized = true;
    testState.step = 0;
    testState.waitFrames = 0;
  }
  
  // Wait frames for animations
  if (testState.waitFrames > 0) {
    testState.waitFrames--;
    return null;
  }
  
  // Room 1 solution
  if (state.currentRoom === 1) {
    if (!state.rooms[1].puzzleState.gearCollected) {
      // Step 1: Rotate to gear (angle 0)
      if (Math.abs(state.cameraAngle - 0) > 20) {
        if (state.cameraAngle > 180) {
          return { keyCode: 37 }; // LEFT
        } else {
          return { keyCode: 39 }; // RIGHT
        }
      }
      testState.waitFrames = 10;
      return { keyCode: 32 }; // SPACE to collect gear
    }
    
    if (!state.rooms[1].puzzleState.mechanismFixed) {
      // Step 2: Activate Oculus
      if (!state.oculusActive) {
        testState.waitFrames = 10;
        return { keyCode: 90 }; // Z to toggle Oculus
      }
      
      // Step 3: Rotate to mechanism (angle 90)
      if (Math.abs(state.targetCameraAngle - 90) > 5) {
        return { keyCode: 39 }; // RIGHT
      }
      testState.waitFrames = 30;
      return { keyCode: 32 }; // SPACE to fix mechanism
    }
    
    if (!state.rooms[1].puzzleState.gearPlaced) {
      // Step 4: Deactivate Oculus
      if (state.oculusActive) {
        testState.waitFrames = 10;
        return { keyCode: 90 }; // Z
      }
      
      // Step 5: Select gear in inventory
      if (state.selectedItemIndex !== 0 && state.inventory.length > 0) {
        testState.waitFrames = 5;
        return { keyCode: 49 }; // 1
      }
      
      // Step 6: Rotate to mechanism
      if (Math.abs(state.targetCameraAngle - 90) > 5) {
        return { keyCode: 39 }; // RIGHT
      }
      testState.waitFrames = 10;
      return { keyCode: 32 }; // SPACE to place gear
    }
    
    // Step 7: Go to door and enter
    if (state.rooms[1].doorUnlocked) {
      if (Math.abs(state.targetCameraAngle - 180) > 5) {
        return { keyCode: 39 }; // RIGHT
      }
      testState.waitFrames = 10;
      return { keyCode: 32 }; // SPACE to open door
    }
  }
  
  // Room 2 solution
  if (state.currentRoom === 2) {
    if (!state.rooms[2].puzzleState.keyCollected) {
      // Step 1: Activate Oculus to see key
      if (!state.oculusActive) {
        testState.waitFrames = 10;
        return { keyCode: 90 }; // Z
      }
      
      // Step 2: Rotate to key (angle 45)
      if (Math.abs(state.targetCameraAngle - 45) > 20) {
        if (state.cameraAngle < 45 || state.cameraAngle > 225) {
          return { keyCode: 39 }; // RIGHT
        } else {
          return { keyCode: 37 }; // LEFT
        }
      }
      testState.waitFrames = 10;
      return { keyCode: 32 }; // SPACE to collect key
    }
    
    if (!state.rooms[2].puzzleState.chestOpened) {
      // Step 3: Deactivate Oculus
      if (state.oculusActive) {
        testState.waitFrames = 10;
        return { keyCode: 90 }; // Z
      }
      
      // Step 4: Select key
      if (state.selectedItemIndex !== 0 && state.inventory.length > 0) {
        testState.waitFrames = 5;
        return { keyCode: 49 }; // 1
      }
      
      // Step 5: Rotate to chest (angle 135)
      if (Math.abs(state.targetCameraAngle - 135) > 20) {
        return { keyCode: 39 }; // RIGHT
      }
      testState.waitFrames = 10;
      return { keyCode: 32 }; // SPACE to open chest
    }
    
    // Step 6: Go to door
    if (state.rooms[2].doorUnlocked) {
      if (Math.abs(state.targetCameraAngle - 270) > 20) {
        return { keyCode: 39 }; // RIGHT
      }
      testState.waitFrames = 10;
      return { keyCode: 32 }; // SPACE
    }
  }
  
  // Room 3 solution
  if (state.currentRoom === 3) {
    if (!state.rooms[3].puzzleState.gearPlacedOnPedestal) {
      // Find gear in inventory
      const gearIndex = state.inventory.findIndex(item => item.id === "gear1");
      
      if (gearIndex >= 0 && state.selectedItemIndex !== gearIndex) {
        testState.waitFrames = 5;
        return { keyCode: 49 + gearIndex }; // Select gear
      }
      
      // Rotate to pedestal (angle 90)
      if (Math.abs(state.targetCameraAngle - 90) > 20) {
        return { keyCode: 39 }; // RIGHT
      }
      testState.waitFrames = 10;
      return { keyCode: 32 }; // SPACE to place gear
    }
    
    if (!state.rooms[3].puzzleState.lensPlacedOnDevice) {
      // Find lens in inventory
      const lensIndex = state.inventory.findIndex(item => item.id === "lens1");
      
      if (lensIndex >= 0 && state.selectedItemIndex !== lensIndex) {
        testState.waitFrames = 5;
        return { keyCode: 49 + lensIndex }; // Select lens
      }
      
      // Rotate to device (angle 0)
      if (Math.abs(state.cameraAngle - 0) > 20) {
        if (state.cameraAngle > 180) {
          return { keyCode: 37 }; // LEFT
        } else {
          return { keyCode: 39 }; // RIGHT
        }
      }
      testState.waitFrames = 10;
      return { keyCode: 32 }; // SPACE to place lens
    }
  }
  
  // Default: explore
  return { keyCode: 39 }; // RIGHT
}

function getBasicTestAction(state) {
  // Basic testing: rotate around, collect items, toggle Oculus
  if (!testState.initialized) {
    testState.initialized = true;
    testState.step = 0;
  }
  
  if (testState.waitFrames > 0) {
    testState.waitFrames--;
    return null;
  }
  
  const actions = [
    { keyCode: 39 }, // Rotate right
    { keyCode: 39 },
    { keyCode: 32 }, // Interact
    { keyCode: 39 },
    { keyCode: 90 }, // Toggle Oculus
    { keyCode: 39 },
    { keyCode: 32 },
    { keyCode: 90 }, // Toggle back
    { keyCode: 37 }, // Rotate left
    { keyCode: 49 }  // Select item 1
  ];
  
  const action = actions[testState.step % actions.length];
  testState.step++;
  testState.waitFrames = 15;
  
  return action;
}

function getRandomAction(state) {
  const actions = [
    { keyCode: 37 },
    { keyCode: 39 },
    { keyCode: 32 },
    { keyCode: 90 },
    { keyCode: 16 },
    { keyCode: 49 },
    { keyCode: 50 },
    { keyCode: 51 }
  ];
  
  return actions[Math.floor(Math.random() * actions.length)];
}

export function get_automated_testing_action(state) {
  switch (state.controlMode) {
    case "TEST_1":
      return getBasicTestAction(state);
    case "TEST_2":
      return getTestWinAction(state);
    default:
      return getRandomAction(state);
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;