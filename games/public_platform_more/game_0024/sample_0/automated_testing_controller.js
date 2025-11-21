// automated_testing_controller.js - Automated testing functions

import { gameState } from './globals.js';

let testState = {
  phase: 0,
  waitFrames: 0,
  actionSequence: [],
  currentActionIndex: 0,
  lastPlayerX: 0,
  stuckCounter: 0
};

function getTestWinAction(gs) {
  // Optimal strategy to complete the game
  const actions = [];
  
  // Scene 0: Collect gear, solve puzzle, go through door
  if (gs.currentScene === 0) {
    if (testState.phase === 0) {
      // Move to gear
      if (Math.abs(gs.player.x - 150) > 5) {
        return gs.player.x < 150 ? { key: 'ArrowRight', keyCode: 39 } : { key: 'ArrowLeft', keyCode: 37 };
      }
      // Collect gear
      actions.push({ key: ' ', keyCode: 32 });
      testState.phase = 1;
      testState.waitFrames = 10;
      return actions[0];
    }
    
    if (testState.phase === 1) {
      if (testState.waitFrames > 0) {
        testState.waitFrames--;
        return null;
      }
      // Move to puzzle
      if (Math.abs(gs.player.x - 450) > 5) {
        return gs.player.x < 450 ? { key: 'ArrowRight', keyCode: 39 } : { key: 'ArrowLeft', keyCode: 37 };
      }
      // Interact with puzzle
      actions.push({ key: ' ', keyCode: 32 });
      testState.phase = 2;
      testState.waitFrames = 20;
      return actions[0];
    }
    
    if (testState.phase === 2) {
      if (testState.waitFrames > 0) {
        testState.waitFrames--;
        return null;
      }
      // Move to door
      if (Math.abs(gs.player.x - 550) > 5) {
        return gs.player.x < 550 ? { key: 'ArrowRight', keyCode: 39 } : { key: 'ArrowLeft', keyCode: 37 };
      }
      // Go through door
      actions.push({ key: ' ', keyCode: 32 });
      testState.phase = 3;
      testState.waitFrames = 40;
      return actions[0];
    }
  }
  
  // Scene 1: Collect wrench and key, go through right door
  if (gs.currentScene === 1) {
    if (testState.phase === 3) {
      if (testState.waitFrames > 0) {
        testState.waitFrames--;
        return null;
      }
      // Move to wrench
      if (Math.abs(gs.player.x - 120) > 5) {
        return gs.player.x < 120 ? { key: 'ArrowRight', keyCode: 39 } : { key: 'ArrowLeft', keyCode: 37 };
      }
      actions.push({ key: ' ', keyCode: 32 });
      testState.phase = 4;
      testState.waitFrames = 10;
      return actions[0];
    }
    
    if (testState.phase === 4) {
      if (testState.waitFrames > 0) {
        testState.waitFrames--;
        return null;
      }
      // Move to key
      if (Math.abs(gs.player.x - 420) > 5) {
        return gs.player.x < 420 ? { key: 'ArrowRight', keyCode: 39 } : { key: 'ArrowLeft', keyCode: 37 };
      }
      actions.push({ key: ' ', keyCode: 32 });
      testState.phase = 5;
      testState.waitFrames = 10;
      return actions[0];
    }
    
    if (testState.phase === 5) {
      if (testState.waitFrames > 0) {
        testState.waitFrames--;
        return null;
      }
      // Move to right door
      if (Math.abs(gs.player.x - 550) > 5) {
        return gs.player.x < 550 ? { key: 'ArrowRight', keyCode: 39 } : { key: 'ArrowLeft', keyCode: 37 };
      }
      // Open inventory and select key
      if (gs.selectedInventoryIndex !== 1) {
        actions.push({ key: 'z', keyCode: 90 });
        testState.waitFrames = 5;
        return actions[0];
      }
      // Use key on door
      actions.push({ key: 'Shift', keyCode: 16 });
      testState.phase = 6;
      testState.waitFrames = 20;
      return actions[0];
    }
    
    if (testState.phase === 6) {
      if (testState.waitFrames > 0) {
        testState.waitFrames--;
        return null;
      }
      // Go through door
      actions.push({ key: ' ', keyCode: 32 });
      testState.phase = 7;
      testState.waitFrames = 40;
      return actions[0];
    }
  }
  
  // Scene 2: Collect fuse, solve pattern puzzle, go through door
  if (gs.currentScene === 2) {
    if (testState.phase === 7) {
      if (testState.waitFrames > 0) {
        testState.waitFrames--;
        return null;
      }
      // Move to fuse
      if (Math.abs(gs.player.x - 300) > 5) {
        return gs.player.x < 300 ? { key: 'ArrowRight', keyCode: 39 } : { key: 'ArrowLeft', keyCode: 37 };
      }
      actions.push({ key: ' ', keyCode: 32 });
      testState.phase = 8;
      testState.waitFrames = 10;
      return actions[0];
    }
    
    if (testState.phase === 8) {
      if (testState.waitFrames > 0) {
        testState.waitFrames--;
        return null;
      }
      // Move to puzzle
      if (Math.abs(gs.player.x - 150) > 5) {
        return gs.player.x < 150 ? { key: 'ArrowRight', keyCode: 39 } : { key: 'ArrowLeft', keyCode: 37 };
      }
      actions.push({ key: ' ', keyCode: 32 });
      testState.phase = 9;
      testState.waitFrames = 20;
      return actions[0];
    }
    
    if (testState.phase === 9) {
      if (testState.waitFrames > 0) {
        testState.waitFrames--;
        return null;
      }
      // Move to door
      if (Math.abs(gs.player.x - 550) > 5) {
        return gs.player.x < 550 ? { key: 'ArrowRight', keyCode: 39 } : { key: 'ArrowLeft', keyCode: 37 };
      }
      // Use fuse
      if (gs.inventory.length > 0) {
        actions.push({ key: 'Shift', keyCode: 16 });
        testState.waitFrames = 10;
        return actions[0];
      }
      actions.push({ key: ' ', keyCode: 32 });
      testState.phase = 10;
      testState.waitFrames = 40;
      return actions[0];
    }
  }
  
  // Scene 3: Solve final puzzle
  if (gs.currentScene === 3) {
    if (testState.phase === 10) {
      if (testState.waitFrames > 0) {
        testState.waitFrames--;
        return null;
      }
      // Move to final puzzle
      if (Math.abs(gs.player.x - 300) > 5) {
        return gs.player.x < 300 ? { key: 'ArrowRight', keyCode: 39 } : { key: 'ArrowLeft', keyCode: 37 };
      }
      actions.push({ key: ' ', keyCode: 32 });
      testState.phase = 11;
      testState.waitFrames = 30;
      return actions[0];
    }
    
    if (testState.phase === 11) {
      if (testState.waitFrames > 0) {
        testState.waitFrames--;
        return null;
      }
      // Game should be won
      testState.phase = 12;
    }
  }
  
  return null;
}

function getBasicTestAction(gs) {
  // Basic movement and interaction testing
  if (testState.waitFrames > 0) {
    testState.waitFrames--;
    return null;
  }
  
  const actions = [
    { key: 'ArrowRight', keyCode: 39 },
    { key: 'ArrowLeft', keyCode: 37 },
    { key: ' ', keyCode: 32 },
    { key: 'z', keyCode: 90 }
  ];
  
  // Check if stuck
  if (Math.abs(gs.player.x - testState.lastPlayerX) < 1) {
    testState.stuckCounter++;
    if (testState.stuckCounter > 60) {
      testState.stuckCounter = 0;
      return actions[Math.floor(Math.random() * actions.length)];
    }
  } else {
    testState.stuckCounter = 0;
  }
  testState.lastPlayerX = gs.player.x;
  
  // Random action every few frames
  if (Math.random() < 0.1) {
    const action = actions[Math.floor(Math.random() * actions.length)];
    testState.waitFrames = Math.floor(Math.random() * 20) + 10;
    return action;
  }
  
  return null;
}

function getRandomAction(gs) {
  if (Math.random() < 0.95) return null;
  
  const actions = [
    { key: 'ArrowRight', keyCode: 39 },
    { key: 'ArrowLeft', keyCode: 37 },
    { key: ' ', keyCode: 32 }
  ];
  
  return actions[Math.floor(Math.random() * actions.length)];
}

export function get_automated_testing_action(gs) {
  switch (gs.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gs);
    case "TEST_2":
      return getTestWinAction(gs);
    default:
      return getRandomAction(gs);
  }
}

// Expose globally
window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;