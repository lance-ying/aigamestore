// automated_testing_controller.js
import { GAME_PHASES } from './globals.js';

// Helper to check if position has been visited recently
function isPositionStale(gameState, x, y, threshold = 30) {
  if (!gameState.positionHistory) {
    gameState.positionHistory = [];
  }
  
  for (const pos of gameState.positionHistory.slice(-20)) {
    const dx = pos.x - x;
    const dy = pos.y - y;
    if (Math.sqrt(dx * dx + dy * dy) < threshold) {
      return true;
    }
  }
  return false;
}

function recordPosition(gameState) {
  if (!gameState.positionHistory) {
    gameState.positionHistory = [];
  }
  
  if (gameState.player) {
    gameState.positionHistory.push({
      x: gameState.player.x,
      y: gameState.player.y,
      frame: Date.now()
    });
    
    if (gameState.positionHistory.length > 100) {
      gameState.positionHistory.shift();
    }
  }
}

// TEST_1: Basic movement and interaction
function getBasicTestAction(gameState) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return null;
  }
  
  recordPosition(gameState);
  
  // Cycle through rooms
  if (!gameState.testState) {
    gameState.testState = { roomVisits: 0, lastAction: null };
  }
  
  gameState.testState.roomVisits++;
  
  // Navigate rooms in sequence
  const sequence = [39, 40, 38, 37, 39]; // right, down, up, left, right
  const action = sequence[gameState.testState.roomVisits % sequence.length];
  
  // Occasionally try to interact
  if (gameState.testState.roomVisits % 3 === 0) {
    return 32; // SPACE
  }
  
  return action;
}

// TEST_2: Optimal win strategy
function getTestWinAction(gameState) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return null;
  }
  
  recordPosition(gameState);
  
  if (!gameState.winTestState) {
    gameState.winTestState = {
      step: 0,
      substep: 0,
      collected: []
    };
  }
  
  const state = gameState.winTestState;
  
  // Strategy: Collect all items first, then secure points
  
  // Step 0: Go to storage and collect chain, lock, hammer
  if (state.step === 0) {
    if (gameState.currentRoom !== "STORAGE") {
      if (gameState.currentRoom === "MAIN") return 39; // go right to bedroom
      if (gameState.currentRoom === "BEDROOM") return 40; // go down to storage
      if (gameState.currentRoom === "BASEMENT") return 38; // go up to main
    } else {
      // In storage, collect items
      if (state.substep < 10) {
        state.substep++;
        return 32; // SPACE to collect
      } else {
        state.step = 1;
        state.substep = 0;
      }
    }
  }
  
  // Step 1: Go to bedroom and collect sedative and nails
  if (state.step === 1) {
    if (gameState.currentRoom !== "BEDROOM") {
      if (gameState.currentRoom === "STORAGE") return 38; // go up
      if (gameState.currentRoom === "MAIN") return 39; // go right
      if (gameState.currentRoom === "BASEMENT") return 38; // go up then right
    } else {
      if (state.substep < 10) {
        state.substep++;
        return 32; // SPACE
      } else {
        state.step = 2;
        state.substep = 0;
      }
    }
  }
  
  // Step 2: Go to main room and collect planks
  if (state.step === 2) {
    if (gameState.currentRoom !== "MAIN") {
      if (gameState.currentRoom === "BEDROOM") return 37; // go left
      if (gameState.currentRoom === "STORAGE") return 38; // go up
      if (gameState.currentRoom === "BASEMENT") return 38; // go up
    } else {
      if (state.substep < 10) {
        state.substep++;
        return 32; // SPACE
      } else {
        state.step = 3;
        state.substep = 0;
      }
    }
  }
  
  // Step 3: Go to basement and collect rope
  if (state.step === 3) {
    if (gameState.currentRoom !== "BASEMENT") {
      if (gameState.currentRoom === "MAIN") return 40; // go down
      if (gameState.currentRoom === "BEDROOM") return 37; // go left then down
      if (gameState.currentRoom === "STORAGE") return 38; // go up then left then down
    } else {
      if (state.substep < 10) {
        state.substep++;
        return 32; // SPACE
      } else {
        state.step = 4;
        state.substep = 0;
      }
    }
  }
  
  // Step 4: Combine items and secure points
  if (state.step === 4) {
    // Open inventory and combine
    if (!gameState.inventoryOpen && state.substep % 20 === 0) {
      return 90; // Z to open inventory
    }
    
    if (gameState.inventoryOpen && state.substep % 10 === 5) {
      return 16; // SHIFT to combine
    }
    
    if (gameState.inventoryOpen && state.substep % 20 === 15) {
      return 90; // Z to close inventory
    }
    
    state.substep++;
    
    if (state.substep > 100) {
      state.step = 5;
      state.substep = 0;
    }
    
    return 39; // Random movement
  }
  
  // Step 5: Secure all points
  if (state.step === 5) {
    if (gameState.currentRoom === "MAIN") {
      if (state.substep < 30) {
        state.substep++;
        return 32; // SPACE to secure
      }
    }
    
    // Move around and secure
    if (state.substep % 20 === 0) return 39;
    if (state.substep % 20 === 5) return 40;
    if (state.substep % 20 === 10) return 37;
    if (state.substep % 20 === 15) return 38;
    
    state.substep++;
    return 32;
  }
  
  return null;
}

// TEST_3: Item combination test
function getItemCombineAction(gameState) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return null;
  }
  
  if (!gameState.combineTestState) {
    gameState.combineTestState = { step: 0, substep: 0 };
  }
  
  const state = gameState.combineTestState;
  
  // Collect items then test combining
  if (state.step === 0 && state.substep < 50) {
    state.substep++;
    if (state.substep % 5 === 0) return 32; // SPACE
    return [37, 38, 39, 40][Math.floor(state.substep / 5) % 4];
  }
  
  if (state.step === 0 && state.substep >= 50) {
    state.step = 1;
    state.substep = 0;
  }
  
  if (state.step === 1) {
    if (state.substep % 20 === 0) return 90; // Open inventory
    if (state.substep % 20 === 10) return 16; // Combine
    if (state.substep % 20 === 15) return 90; // Close inventory
    
    state.substep++;
    return null;
  }
  
  return null;
}

// TEST_4: Time management / failure test
function getFailureTestAction(gameState) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return null;
  }
  
  // Just move around randomly without securing anything
  const actions = [37, 38, 39, 40];
  return actions[Math.floor(Math.random() * 4)];
}

function getRandomAction(gameState) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return null;
  }
  
  const actions = [37, 38, 39, 40, 32];
  return actions[Math.floor(Math.random() * actions.length)];
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getItemCombineAction(gameState);
    case "TEST_4":
      return getFailureTestAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;