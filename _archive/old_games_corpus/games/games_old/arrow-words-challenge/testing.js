// testing.js - Automated testing functionality

import { gameState } from './globals.js';
import { handleKeyPress } from './input.js';

export function initTestMode(mode) {
  gameState.controlMode = mode;
  gameState.testingActionIndex = 0;
  
  if (mode === 'TEST_1') {
    // Basic testing - demonstrate core gameplay mechanics
    gameState.testingActions = [
      { type: 'wait', frames: 30 },
      { type: 'key', keyCode: 13 }, // ENTER to start
      { type: 'wait', frames: 30 },
      
      // Type first word "CAT"
      { type: 'key', keyCode: 67, key: 'C' },
      { type: 'wait', frames: 10 },
      { type: 'key', keyCode: 65, key: 'A' },
      { type: 'wait', frames: 10 },
      { type: 'key', keyCode: 84, key: 'T' },
      { type: 'wait', frames: 20 },
      
      // Navigate down to next word
      { type: 'key', keyCode: 40 }, // DOWN arrow
      { type: 'wait', frames: 15 },
      
      // Type "DOG"
      { type: 'key', keyCode: 68, key: 'D' },
      { type: 'wait', frames: 10 },
      { type: 'key', keyCode: 79, key: 'O' },
      { type: 'wait', frames: 10 },
      { type: 'key', keyCode: 71, key: 'G' },
      { type: 'wait', frames: 20 },
      
      // Navigate to another word using arrow keys
      { type: 'key', keyCode: 40 }, // DOWN
      { type: 'wait', frames: 10 },
      { type: 'key', keyCode: 40 }, // DOWN
      { type: 'wait', frames: 10 },
      { type: 'key', keyCode: 39 }, // RIGHT
      { type: 'wait', frames: 15 },
      
      // Type partial word "ICE"
      { type: 'key', keyCode: 73, key: 'I' },
      { type: 'wait', frames: 10 },
      { type: 'key', keyCode: 67, key: 'C' },
      { type: 'wait', frames: 10 },
      { type: 'key', keyCode: 69, key: 'E' },
      { type: 'wait', frames: 20 },
      
      // Use hint for next letter (TAB key)
      { type: 'key', keyCode: 9 }, // TAB for hint
      { type: 'wait', frames: 30 },
      
      // Demonstrate backspace
      { type: 'key', keyCode: 37 }, // LEFT arrow
      { type: 'wait', frames: 10 },
      { type: 'key', keyCode: 8 }, // BACKSPACE
      { type: 'wait', frames: 10 },
      { type: 'key', keyCode: 69, key: 'E' }, // Retype E
      { type: 'wait', frames: 20 },
      
      // Navigate around the grid
      { type: 'key', keyCode: 38 }, // UP arrow
      { type: 'wait', frames: 10 },
      { type: 'key', keyCode: 39 }, // RIGHT arrow
      { type: 'wait', frames: 10 },
      { type: 'key', keyCode: 40 }, // DOWN arrow
      { type: 'wait', frames: 20 },
      
      // Pause and unpause
      { type: 'key', keyCode: 27 }, // ESC to pause
      { type: 'wait', frames: 40 },
      { type: 'key', keyCode: 27 }, // ESC to resume
      { type: 'wait', frames: 40 }
    ];
  } else if (mode === 'TEST_2') {
    // Complete level 1 to show win state
    gameState.testingActions = generateWinActions();
  }
}

function generateWinActions() {
  const actions = [];
  
  // Start game
  actions.push({ type: 'wait', frames: 20 });
  actions.push({ type: 'key', keyCode: 13 }); // ENTER
  actions.push({ type: 'wait', frames: 20 });
  
  // Level 1 solution - solve each word systematically
  // The game starts with first empty cell selected (should be row 0, col 1)
  
  // Word 1: CAT (row 0, starts at col 1)
  actions.push({ type: 'key', keyCode: 67, key: 'C' });
  actions.push({ type: 'wait', frames: 3 });
  actions.push({ type: 'key', keyCode: 65, key: 'A' });
  actions.push({ type: 'wait', frames: 3 });
  actions.push({ type: 'key', keyCode: 84, key: 'T' });
  actions.push({ type: 'wait', frames: 5 });
  
  // Navigate to Word 2: DOG (row 1, col 1)
  actions.push({ type: 'key', keyCode: 40 }); // DOWN
  actions.push({ type: 'wait', frames: 5 });
  
  // Word 2: DOG
  actions.push({ type: 'key', keyCode: 68, key: 'D' });
  actions.push({ type: 'wait', frames: 3 });
  actions.push({ type: 'key', keyCode: 79, key: 'O' });
  actions.push({ type: 'wait', frames: 3 });
  actions.push({ type: 'key', keyCode: 71, key: 'G' });
  actions.push({ type: 'wait', frames: 5 });
  
  // Navigate to Word 3: ICED (row 3, col 1)
  actions.push({ type: 'key', keyCode: 40 }); // DOWN
  actions.push({ type: 'wait', frames: 3 });
  actions.push({ type: 'key', keyCode: 40 }); // DOWN (skip row 2 blocked)
  actions.push({ type: 'wait', frames: 5 });
  
  // Word 3: ICED
  actions.push({ type: 'key', keyCode: 73, key: 'I' });
  actions.push({ type: 'wait', frames: 3 });
  actions.push({ type: 'key', keyCode: 67, key: 'C' });
  actions.push({ type: 'wait', frames: 3 });
  actions.push({ type: 'key', keyCode: 69, key: 'E' });
  actions.push({ type: 'wait', frames: 3 });
  actions.push({ type: 'key', keyCode: 68, key: 'D' });
  actions.push({ type: 'wait', frames: 5 });
  
  // Navigate to Word 4: BENT (col 3, row 0 is clue, starts row 1)
  actions.push({ type: 'key', keyCode: 38 }); // UP
  actions.push({ type: 'wait', frames: 3 });
  actions.push({ type: 'key', keyCode: 38 }); // UP
  actions.push({ type: 'wait', frames: 3 });
  actions.push({ type: 'key', keyCode: 39 }); // RIGHT
  actions.push({ type: 'wait', frames: 5 });
  
  // Word 4: BENT (down from row 0 col 3)
  actions.push({ type: 'key', keyCode: 66, key: 'B' });
  actions.push({ type: 'wait', frames: 3 });
  actions.push({ type: 'key', keyCode: 69, key: 'E' });
  actions.push({ type: 'wait', frames: 3 });
  actions.push({ type: 'key', keyCode: 78, key: 'N' });
  actions.push({ type: 'wait', frames: 3 });
  actions.push({ type: 'key', keyCode: 84, key: 'T' });
  actions.push({ type: 'wait', frames: 5 });
  
  // Navigate to Word 5: RED (col 1, row 2 is clue, starts row 3)
  actions.push({ type: 'key', keyCode: 37 }); // LEFT
  actions.push({ type: 'wait', frames: 3 });
  actions.push({ type: 'key', keyCode: 37 }); // LEFT
  actions.push({ type: 'wait', frames: 3 });
  actions.push({ type: 'key', keyCode: 40 }); // DOWN
  actions.push({ type: 'wait', frames: 5 });
  
  // Word 5: RED (down from row 2 col 1)
  actions.push({ type: 'key', keyCode: 82, key: 'R' });
  actions.push({ type: 'wait', frames: 3 });
  actions.push({ type: 'key', keyCode: 69, key: 'E' });
  actions.push({ type: 'wait', frames: 3 });
  actions.push({ type: 'key', keyCode: 68, key: 'D' });
  actions.push({ type: 'wait', frames: 5 });
  
  // Navigate to Word 6: OWL (row 4, col 4 is clue, starts col 5)
  actions.push({ type: 'key', keyCode: 39 }); // RIGHT
  actions.push({ type: 'wait', frames: 3 });
  actions.push({ type: 'key', keyCode: 39 }); // RIGHT
  actions.push({ type: 'wait', frames: 3 });
  actions.push({ type: 'key', keyCode: 39 }); // RIGHT
  actions.push({ type: 'wait', frames: 3 });
  actions.push({ type: 'key', keyCode: 40 }); // DOWN
  actions.push({ type: 'wait', frames: 5 });
  
  // Word 6: OWL
  actions.push({ type: 'key', keyCode: 79, key: 'O' });
  actions.push({ type: 'wait', frames: 3 });
  actions.push({ type: 'key', keyCode: 87, key: 'W' });
  actions.push({ type: 'wait', frames: 3 });
  actions.push({ type: 'key', keyCode: 76, key: 'L' });
  actions.push({ type: 'wait', frames: 5 });
  
  // Navigate to Word 7: SUN (col 5, row 2 is clue, starts row 3)
  actions.push({ type: 'key', keyCode: 38 }); // UP
  actions.push({ type: 'wait', frames: 3 });
  actions.push({ type: 'key', keyCode: 38 }); // UP
  actions.push({ type: 'wait', frames: 5 });
  
  // Word 7: SUN (down from row 2 col 5)
  actions.push({ type: 'key', keyCode: 83, key: 'S' });
  actions.push({ type: 'wait', frames: 3 });
  actions.push({ type: 'key', keyCode: 85, key: 'U' });
  actions.push({ type: 'wait', frames: 3 });
  actions.push({ type: 'key', keyCode: 78, key: 'N' });
  actions.push({ type: 'wait', frames: 10 });
  
  // Wait for win screen to appear
  actions.push({ type: 'wait', frames: 60 });
  
  return actions;
}

export function updateTestMode(p) {
  if (gameState.controlMode === 'HUMAN') return;
  
  if (gameState.testingActionIndex >= gameState.testingActions.length) {
    return;
  }
  
  const action = gameState.testingActions[gameState.testingActionIndex];
  
  if (action.type === 'wait') {
    action.frames--;
    if (action.frames <= 0) {
      gameState.testingActionIndex++;
    }
  } else if (action.type === 'key') {
    handleKeyPress(p, action.keyCode, action.key || '');
    gameState.testingActionIndex++;
  }
}