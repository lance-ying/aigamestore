// testing.js - Automated testing functionality

import { gameState } from './globals.js';
import { handleKeyPress } from './input.js';

export function initTestMode(mode) {
  gameState.controlMode = mode;
  gameState.testingActionIndex = 0;
  
  if (mode === 'TEST_1') {
    // Basic testing - navigate and type some letters
    gameState.testingActions = [
      { type: 'wait', frames: 60 },
      { type: 'key', keyCode: 13 }, // ENTER to start
      { type: 'wait', frames: 60 },
      { type: 'key', keyCode: 67, key: 'C' }, // Type C
      { type: 'wait', frames: 20 },
      { type: 'key', keyCode: 65, key: 'A' }, // Type A
      { type: 'wait', frames: 20 },
      { type: 'key', keyCode: 84, key: 'T' }, // Type T
      { type: 'wait', frames: 30 },
      { type: 'key', keyCode: 39 }, // RIGHT arrow
      { type: 'wait', frames: 20 },
      { type: 'key', keyCode: 40 }, // DOWN arrow
      { type: 'wait', frames: 20 },
      { type: 'key', keyCode: 68, key: 'D' }, // Type D
      { type: 'wait', frames: 30 },
      { type: 'key', keyCode: 27 }, // ESC to pause
      { type: 'wait', frames: 60 },
      { type: 'key', keyCode: 27 }, // ESC to resume
      { type: 'wait', frames: 60 }
    ];
  } else if (mode === 'TEST_2') {
    // Complete level 1
    gameState.testingActions = generateWinActions();
  }
}

function generateWinActions() {
  const actions = [];
  
  // Start game
  actions.push({ type: 'wait', frames: 30 });
  actions.push({ type: 'key', keyCode: 13 }); // ENTER
  actions.push({ type: 'wait', frames: 30 });
  
  // Level 1 solution: Complete all words
  const words = [
    'CAT', 'DOG', 'ICED', 'OWL', 'BENT', 'RED', 'SUN'
  ];
  
  // Type the solution for level 1 systematically
  // This is a simplified approach - type letters in grid order
  const gridSolution = [
    ['C', 'A', 'T', 'B', 'E'],
    ['D', 'O', 'G', 'N'],
    ['I', 'C', 'E', 'D'],
    ['O', 'W', 'L'],
    ['R', 'E', 'D'],
    ['S', 'U', 'N']
  ];
  
  // Navigate and type each cell
  for (const row of gridSolution) {
    for (const letter of row) {
      if (letter) {
        const keyCode = letter.charCodeAt(0);
        actions.push({ type: 'key', keyCode: keyCode, key: letter });
        actions.push({ type: 'wait', frames: 5 });
      }
    }
  }
  
  actions.push({ type: 'wait', frames: 120 });
  
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