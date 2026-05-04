// testing.js - Automated testing support

import { gameState, LEVEL_DEFINITIONS } from './globals.js';
import { initializeLevel } from './levelManager.js';

export function initializeTestMode(p, mode) {
  gameState.testingActions = [];
  gameState.testingActionIndex = 0;
  gameState.testingFrameDelay = 0;
  
  if (mode === "TEST_1") {
    // Basic testing: draw a few cards, try to place them
    gameState.testingActions = [
      { action: "start" },
      { action: "wait", frames: 30 },
      { action: "draw_card" },
      { action: "wait", frames: 30 },
      { action: "select_category", index: 0 },
      { action: "place_card" },
      { action: "wait", frames: 30 },
      { action: "draw_card" },
      { action: "wait", frames: 30 },
      { action: "select_category", index: 1 },
      { action: "place_card" },
      { action: "wait", frames: 30 }
    ];
  } else if (mode === "TEST_2") {
    // Win test: complete level 1 perfectly
    gameState.testingActions = generateWinActions(1);
  }
}

function generateWinActions(level) {
  const actions = [{ action: "start" }, { action: "wait", frames: 30 }];
  
  const levelDef = LEVEL_DEFINITIONS[level - 1];
  if (!levelDef) return actions;
  
  // For each word in order, draw and place correctly
  for (const wordDef of levelDef.words) {
    actions.push({ action: "draw_card" });
    actions.push({ action: "wait", frames: 20 });
    
    // Find the correct category index
    const catIndex = levelDef.categories.findIndex(c => c.name === wordDef.category);
    if (catIndex >= 0) {
      actions.push({ action: "select_category", index: catIndex });
      actions.push({ action: "place_card" });
      actions.push({ action: "wait", frames: 20 });
    }
  }
  
  return actions;
}

export function updateTestMode(p) {
  if (gameState.controlMode === "HUMAN") return;
  
  if (gameState.testingFrameDelay > 0) {
    gameState.testingFrameDelay--;
    return;
  }
  
  if (gameState.testingActionIndex >= gameState.testingActions.length) {
    return; // Test complete
  }
  
  const action = gameState.testingActions[gameState.testingActionIndex];
  gameState.testingActionIndex++;
  
  switch (action.action) {
    case "start":
      if (gameState.gamePhase === "START") {
        p.keyCode = 13;
        p.key = "Enter";
        simulateKeyPress(p, 13);
      }
      break;
      
    case "wait":
      gameState.testingFrameDelay = action.frames || 30;
      break;
      
    case "draw_card":
      if (gameState.gamePhase === "PLAYING") {
        p.keyCode = 32;
        p.key = " ";
        simulateKeyPress(p, 32);
      }
      break;
      
    case "select_category":
      if (gameState.gamePhase === "PLAYING") {
        gameState.highlightedCategoryIndex = action.index || 0;
      }
      break;
      
    case "place_card":
      if (gameState.gamePhase === "PLAYING") {
        p.keyCode = 87;
        p.key = "w";
        simulateKeyPress(p, 87);
      }
      break;
  }
}

function simulateKeyPress(p, keyCode) {
  const event = { keyCode: keyCode };
  p._onkeydown(event);
}