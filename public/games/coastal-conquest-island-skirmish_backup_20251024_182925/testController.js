// testController.js - Automated testing controller

import { gameState, GAME_PHASES, UNIT_TYPES } from './globals.js';
import { handleKeyPressed, handleMousePressed } from './input.js';

let testActionIndex = 0;
let testActionTimer = 0;

const TEST_ACTIONS = {
  TEST_1: [
    { type: 'wait', frames: 30 },
    { type: 'key', keyCode: 13 }, // Start game
    { type: 'wait', frames: 60 },
    { type: 'key', keyCode: 90 }, // Select Infantry
    { type: 'wait', frames: 10 },
    { type: 'click', x: 60, y: 160 }, // Deploy
    { type: 'wait', frames: 30 },
    { type: 'key', keyCode: 32 }, // End turn
    { type: 'wait', frames: 120 },
    { type: 'key', keyCode: 90 },
    { type: 'wait', frames: 10 },
    { type: 'click', x: 60, y: 200 },
    { type: 'wait', frames: 30 },
    { type: 'key', keyCode: 32 }
  ],
  TEST_2: [ // Win scenario
    { type: 'wait', frames: 30 },
    { type: 'key', keyCode: 13 },
    { type: 'wait', frames: 60 },
    // Deploy multiple tanks
    { type: 'key', keyCode: 38 },
    { type: 'wait', frames: 10 },
    { type: 'click', x: 60, y: 160 },
    { type: 'wait', frames: 20 },
    { type: 'key', keyCode: 38 },
    { type: 'wait', frames: 10 },
    { type: 'click', x: 60, y: 200 },
    { type: 'wait', frames: 30 },
    { type: 'key', keyCode: 32 },
    { type: 'wait', frames: 150 },
    { type: 'key', keyCode: 38 },
    { type: 'wait', frames: 10 },
    { type: 'click', x: 60, y: 240 },
    { type: 'wait', frames: 30 },
    { type: 'key', keyCode: 32 },
    { type: 'wait', frames: 150 }
  ]
};

export function updateTestController(p) {
  if (gameState.controlMode === 'HUMAN') return;
  
  const actions = TEST_ACTIONS[gameState.controlMode];
  if (!actions || testActionIndex >= actions.length) return;
  
  const currentAction = actions[testActionIndex];
  
  if (currentAction.type === 'wait') {
    testActionTimer++;
    if (testActionTimer >= currentAction.frames) {
      testActionTimer = 0;
      testActionIndex++;
    }
  } else if (currentAction.type === 'key') {
    handleKeyPressed(p, '', currentAction.keyCode);
    testActionIndex++;
  } else if (currentAction.type === 'click') {
    handleMousePressed(p, currentAction.x, currentAction.y);
    testActionIndex++;
  }
}

export function resetTestController() {
  testActionIndex = 0;
  testActionTimer = 0;
}

export function setControlMode(mode) {
  gameState.controlMode = mode;
  resetTestController();
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn'];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove('active');
    }
  });
  
  const activeBtn = mode === 'HUMAN' ? 'humanModeBtn' : `${mode.toLowerCase()}_ModeBtn`;
  const btn = document.getElementById(activeBtn);
  if (btn) {
    btn.classList.add('active');
  }
}