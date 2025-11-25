import { gameState, GAME_PHASES, ACTION_TYPES, STORY_FLAGS } from './globals.js';

let testState = {
  step: 0,
  waitFrames: 0,
  lastAction: null,
  inventoryOpen: false
};

function getTestWinAction(state) {
  // Optimal strategy to win the game
  const flags = state.storyFlags;
  
  // Wait if message is showing
  if (state.messageTimer > 0) {
    testState.waitFrames++;
    if (testState.waitFrames < 30) return null;
    testState.waitFrames = 0;
  }

  // Close inventory if open when not needed
  if (state.showInventory && testState.step !== 100 && testState.step !== 200) {
    testState.inventoryOpen = false;
    return { keyCode: 32 }; // SPACE
  }

  // Handle dialogue
  if (state.dialogueActive) {
    if (testState.step < 1000) {
      testState.step = 1000;
    }
    // Select first option (gives info)
    if (state.selectedDialogueIndex !== 0) {
      return { keyCode: 38 }; // UP
    }
    testState.step++;
    return { keyCode: 90 }; // Z to confirm
  }

  // Main quest steps
  switch (testState.step) {
    case 0: // Start - Get wrench from workbench
      state.currentAction = ACTION_TYPES.TAKE;
      testState.step++;
      return { keyCode: 16 }; // SHIFT to cycle to TAKE
      
    case 1: // Set action to TAKE
      if (state.currentAction !== ACTION_TYPES.TAKE) {
        return { keyCode: 16 };
      }
      testState.step++;
      return { keyCode: 90 }; // Z to take wrench
      
    case 2: // Take wrench
      if (flags[STORY_FLAGS.GOT_WRENCH]) {
        testState.step++;
      }
      return { keyCode: 90 }; // Z
      
    case 3: // Change to USE action
      state.currentAction = ACTION_TYPES.USE;
      testState.step++;
      return { keyCode: 16 }; // SHIFT
      
    case 4: // Cycle to USE
      if (state.currentAction !== ACTION_TYPES.USE) {
        return { keyCode: 16 };
      }
      testState.step++;
      return null;
      
    case 5: // Use wrench on motorcycle
      testState.step++;
      return { keyCode: 90 }; // Z to fix bike
      
    case 6: // Wait for fix
      if (flags[STORY_FLAGS.FIXED_BIKE]) {
        testState.step++;
      }
      return null;
      
    case 7: // Go to street (right)
      testState.step++;
      return { keyCode: 39 }; // RIGHT
      
    case 8: // Go to alley (down)
      testState.step++;
      return { keyCode: 40 }; // DOWN
      
    case 9: // Set TAKE action
      state.currentAction = ACTION_TYPES.TAKE;
      if (state.currentAction === ACTION_TYPES.TAKE) {
        testState.step++;
      }
      return { keyCode: 16 }; // SHIFT
      
    case 10: // Take key from dumpster
      if (flags[STORY_FLAGS.GOT_KEY]) {
        testState.step++;
      }
      return { keyCode: 90 }; // Z
      
    case 11: // Back to street (up)
      testState.step++;
      return { keyCode: 38 }; // UP
      
    case 12: // Go to bar entrance (right)
      testState.step++;
      return { keyCode: 39 }; // RIGHT
      
    case 13: // Open inventory
      testState.step++;
      testState.inventoryOpen = true;
      return { keyCode: 32 }; // SPACE
      
    case 14: // Select key
      if (state.selectedItem && state.selectedItem.id === "key") {
        testState.step++;
      }
      return { keyCode: 90 }; // Z
      
    case 15: // Close inventory
      testState.inventoryOpen = false;
      testState.step++;
      return { keyCode: 32 }; // SPACE
      
    case 16: // Set USE action
      if (state.currentAction === ACTION_TYPES.USE) {
        testState.step++;
      }
      return { keyCode: 16 }; // SHIFT
      
    case 17: // Use key on door
      if (flags[STORY_FLAGS.OPENED_DOOR]) {
        testState.step++;
      }
      return { keyCode: 90 }; // Z
      
    case 18: // Enter bar (use door again)
      if (state.currentScene === 3) {
        testState.step++;
      }
      return { keyCode: 90 }; // Z
      
    case 19: // Set TALK action
      if (state.currentAction === ACTION_TYPES.TALK) {
        testState.step++;
      }
      return { keyCode: 16 }; // SHIFT
      
    case 20: // Talk to bartender
      testState.step++;
      return { keyCode: 90 }; // Z
      
    // Dialogue handled above, continues after step 1000
      
    case 1001: // After dialogue, set TAKE action
      if (state.currentAction === ACTION_TYPES.TAKE) {
        testState.step++;
      }
      return { keyCode: 16 }; // SHIFT
      
    case 1002: // Take photo from table
      if (flags[STORY_FLAGS.FOUND_CLUE]) {
        testState.step++;
      }
      return { keyCode: 90 }; // Z
      
    case 1003: // Go to boss room (up)
      if (state.currentScene === 5) {
        testState.step++;
      }
      return { keyCode: 38 }; // UP
      
    case 1004: // Set TAKE action
      if (state.currentAction === ACTION_TYPES.TAKE) {
        testState.step++;
      }
      return { keyCode: 16 }; // SHIFT
      
    case 1005: // Take document from painting
      if (flags[STORY_FLAGS.GOT_EVIDENCE]) {
        testState.step++;
      }
      return { keyCode: 90 }; // Z
      
    case 1006: // Open inventory to combine
      testState.step = 100;
      testState.inventoryOpen = true;
      return { keyCode: 32 }; // SPACE
      
    case 100: // In inventory, select photo
      if (state.selectedItem && state.selectedItem.id === "photo") {
        testState.step = 101;
      }
      return { keyCode: 90 }; // Z
      
    case 101: // Navigate to document
      if (state.inventory.some(i => i.id === "document")) {
        testState.step = 102;
      }
      return { keyCode: 39 }; // RIGHT to next item
      
    case 102: // Select document to combine
      if (flags[STORY_FLAGS.COMBINED_EVIDENCE]) {
        testState.step = 103;
      }
      return { keyCode: 90 }; // Z to combine
      
    case 103: // Close inventory
      testState.inventoryOpen = false;
      testState.step = 1007;
      return { keyCode: 32 }; // SPACE
      
    case 1007: // Set TALK action
      if (state.currentAction === ACTION_TYPES.TALK) {
        testState.step++;
      }
      return { keyCode: 16 }; // SHIFT
      
    case 1008: // Talk to boss
      testState.step++;
      return { keyCode: 90 }; // Z
      
    // Dialogue handled, continues after step 2000
      
    case 2001: // After dialogue, open inventory
      testState.step = 200;
      testState.inventoryOpen = true;
      return { keyCode: 32 }; // SPACE
      
    case 200: // Select evidence
      if (state.selectedItem && state.selectedItem.id === "evidence") {
        testState.step = 201;
      }
      return { keyCode: 90 }; // Z
      
    case 201: // Close inventory
      testState.inventoryOpen = false;
      testState.step = 1009;
      return { keyCode: 32 }; // SPACE
      
    case 1009: // Set USE action
      if (state.currentAction === ACTION_TYPES.USE) {
        testState.step++;
      }
      return { keyCode: 16 }; // SHIFT
      
    case 1010: // Use evidence on boss - WIN!
      return { keyCode: 90 }; // Z
      
    default:
      return null;
  }
}

function getBasicTestAction(state) {
  // Simple movement and interaction test
  switch (testState.step) {
    case 0: // Look at motorcycle
      testState.step++;
      return { keyCode: 90 }; // Z
    case 1:
      testState.step++;
      return { keyCode: 16 }; // SHIFT to change action
    case 2:
      testState.step++;
      return { keyCode: 90 }; // Z with different action
    case 3:
      testState.step++;
      return { keyCode: 32 }; // SPACE open inventory
    case 4:
      testState.step++;
      return { keyCode: 32 }; // SPACE close inventory
    case 5:
      if (state.currentScene === 1) {
        testState.step++;
      }
      return { keyCode: 39 }; // RIGHT to next scene
    case 6:
      if (state.currentScene === 0) {
        testState.step++;
      }
      return { keyCode: 37 }; // LEFT back
    case 7:
      testState.step++;
      return { keyCode: 40 }; // Try DOWN
    case 8:
      testState.step = 0; // Loop
      return null;
    default:
      return null;
  }
}

function getRandomAction(state) {
  const actions = [
    { keyCode: 37 }, // LEFT
    { keyCode: 39 }, // RIGHT
    { keyCode: 38 }, // UP
    { keyCode: 40 }, // DOWN
    { keyCode: 90 }, // Z
    { keyCode: 16 }, // SHIFT
    { keyCode: 32 }  // SPACE
  ];
  return actions[Math.floor(Math.random() * actions.length)];
}

export function get_automated_testing_action(state) {
  if (state.gamePhase !== GAME_PHASES.PLAYING) {
    return null;
  }

  switch (state.controlMode) {
    case "TEST_1":
      return getBasicTestAction(state);
    case "TEST_2":
      return getTestWinAction(state);
    default:
      return getRandomAction(state);
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;