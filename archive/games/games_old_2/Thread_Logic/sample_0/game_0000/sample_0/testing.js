// testing.js - Automated testing
import { gameState } from './globals.js';

let testActionIndex = 0;
let testActionTimer = 0;

const TEST_ACTIONS = {
  TEST_1: [
    { key: 13, wait: 30 },  // Enter to start
    { key: 32, wait: 30 },  // Select first screw
    { key: 38, wait: 10 },  // Move up
    { key: 38, wait: 10 },  
    { key: 38, wait: 10 },
    { key: 16, wait: 30 },  // Deselect
    { key: 39, wait: 10 },  // Move cursor right
    { key: 39, wait: 10 },
    { key: 32, wait: 30 },  // Select
    { key: 27, wait: 60 },  // Pause
    { key: 27, wait: 30 }   // Unpause
  ],
  TEST_2: [
    { key: 13, wait: 30 },  // Start game
    ...generateWinSequence()
  ]
};

function generateWinSequence() {
  const actions = [];
  
  // For level 1 - simple 3 screw solution
  // Screw 3 (independent)
  actions.push({ key: 39, wait: 10 }); // Move right to screw 3
  actions.push({ key: 39, wait: 10 });
  actions.push({ key: 39, wait: 10 });
  actions.push({ key: 39, wait: 10 });
  actions.push({ key: 32, wait: 15 }); // Select
  actions.push({ key: 38, wait: 8 });  // Unscrew
  actions.push({ key: 38, wait: 8 });
  actions.push({ key: 38, wait: 8 });
  actions.push({ key: 38, wait: 8 });
  actions.push({ key: 38, wait: 8 });
  actions.push({ key: 38, wait: 8 });
  actions.push({ key: 38, wait: 8 });
  actions.push({ key: 38, wait: 8 });
  actions.push({ key: 38, wait: 8 });
  actions.push({ key: 38, wait: 8 });
  actions.push({ key: 38, wait: 8 });
  actions.push({ key: 32, wait: 30 }); // Remove
  
  // Screw 1 (blocks 2)
  actions.push({ key: 37, wait: 10 }); // Move left
  actions.push({ key: 37, wait: 10 });
  actions.push({ key: 37, wait: 10 });
  actions.push({ key: 37, wait: 10 });
  actions.push({ key: 32, wait: 15 }); // Select
  actions.push({ key: 38, wait: 8 });  // Unscrew
  actions.push({ key: 38, wait: 8 });
  actions.push({ key: 38, wait: 8 });
  actions.push({ key: 38, wait: 8 });
  actions.push({ key: 38, wait: 8 });
  actions.push({ key: 38, wait: 8 });
  actions.push({ key: 38, wait: 8 });
  actions.push({ key: 38, wait: 8 });
  actions.push({ key: 38, wait: 8 });
  actions.push({ key: 38, wait: 8 });
  actions.push({ key: 38, wait: 8 });
  actions.push({ key: 32, wait: 30 }); // Remove
  
  // Screw 2 (now unblocked)
  actions.push({ key: 39, wait: 10 }); // Move right
  actions.push({ key: 39, wait: 10 });
  actions.push({ key: 32, wait: 15 }); // Select
  actions.push({ key: 38, wait: 8 });  // Unscrew
  actions.push({ key: 38, wait: 8 });
  actions.push({ key: 38, wait: 8 });
  actions.push({ key: 38, wait: 8 });
  actions.push({ key: 38, wait: 8 });
  actions.push({ key: 38, wait: 8 });
  actions.push({ key: 38, wait: 8 });
  actions.push({ key: 38, wait: 8 });
  actions.push({ key: 38, wait: 8 });
  actions.push({ key: 38, wait: 8 });
  actions.push({ key: 38, wait: 8 });
  actions.push({ key: 32, wait: 60 }); // Remove and wait for level complete
  
  return actions;
}

export function updateTestMode(p) {
  if (gameState.controlMode === "HUMAN") return;
  
  const actions = TEST_ACTIONS[gameState.controlMode];
  if (!actions) return;
  
  testActionTimer--;
  
  if (testActionTimer <= 0 && testActionIndex < actions.length) {
    const action = actions[testActionIndex];
    
    // Simulate key press
    p.keyCode = action.key;
    p.key = String.fromCharCode(action.key);
    
    testActionTimer = action.wait;
    testActionIndex++;
  }
  
  // Reset if finished
  if (testActionIndex >= actions.length) {
    testActionIndex = 0;
    testActionTimer = 0;
  }
}

export function resetTestMode() {
  testActionIndex = 0;
  testActionTimer = 0;
}