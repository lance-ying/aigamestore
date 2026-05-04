// automation.js - Automated testing control modes

import { gameState } from './globals.js';
import { moveCursor, addPathNode, selectNextTruck } from './pathPlanner.js';
import { startSimulation } from './simulation.js';

let automationState = {
  step: 0,
  waitFrames: 0
};

export function updateAutomation(p) {
  if (gameState.controlMode === "HUMAN") return;
  
  if (gameState.controlMode === "TEST_1") {
    runTest1(p);
  } else if (gameState.controlMode === "TEST_2") {
    runTest2(p);
  }
}

function runTest1(p) {
  // Test: Basic single truck delivery
  if (gameState.isSimulating) return;
  
  automationState.waitFrames++;
  if (automationState.waitFrames < 10) return;
  automationState.waitFrames = 0;
  
  const truck = gameState.trucks[0];
  
  switch (automationState.step) {
    case 0:
      // Move cursor to package
      gameState.cursorX = 5;
      gameState.cursorY = 1;
      automationState.step++;
      break;
    case 1:
      addPathNode();
      automationState.step++;
      break;
    case 2:
      // Move cursor to house
      gameState.cursorX = 10;
      gameState.cursorY = 1;
      automationState.step++;
      break;
    case 3:
      addPathNode();
      automationState.step++;
      break;
    case 4:
      // Start simulation
      startSimulation();
      automationState.step = 0;
      automationState.waitFrames = 0;
      break;
  }
}

function runTest2(p) {
  // Test: Two truck delivery
  if (gameState.isSimulating) return;
  
  automationState.waitFrames++;
  if (automationState.waitFrames < 10) return;
  automationState.waitFrames = 0;
  
  switch (automationState.step) {
    case 0:
      // Select first truck (red)
      gameState.selectedTruckIndex = 0;
      gameState.cursorX = 1;
      gameState.cursorY = 1;
      automationState.step++;
      break;
    case 1:
      // Path to red package
      gameState.cursorX = 5;
      gameState.cursorY = 1;
      addPathNode();
      automationState.step++;
      break;
    case 2:
      // Path to red house
      gameState.cursorX = 10;
      gameState.cursorY = 1;
      addPathNode();
      automationState.step++;
      break;
    case 3:
      // Select second truck (blue)
      selectNextTruck();
      automationState.step++;
      break;
    case 4:
      // Path to blue package
      gameState.cursorX = 5;
      gameState.cursorY = 6;
      addPathNode();
      automationState.step++;
      break;
    case 5:
      // Path to blue house
      gameState.cursorX = 10;
      gameState.cursorY = 6;
      addPathNode();
      automationState.step++;
      break;
    case 6:
      // Start simulation
      startSimulation();
      automationState.step = 0;
      automationState.waitFrames = 0;
      break;
  }
}

export function resetAutomationState() {
  automationState.step = 0;
  automationState.waitFrames = 0;
}