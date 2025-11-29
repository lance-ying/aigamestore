// input.js - Input handling

import { gameState, GAME_PHASE } from './globals.js';
import { handleKeyPress } from './gameplay.js';

export function setupInputHandlers(p) {
  p.keyPressed = () => {
    const keyCode = p.keyCode;
    const key = p.key;
    
    // Log input
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key, keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Handle key press
    handleKeyPress(p, keyCode, key);
    
    return false; // Prevent default
  };
}

export function getTestAction(p) {
  // Simple test controller that tries to place items
  if (gameState.controlMode === "TEST_1") {
    // Basic testing - select and place items randomly
    const frame = p.frameCount;
    if (frame % 60 === 0 && gameState.inventory.length > 0) {
      return { action: "SELECT_NEXT" };
    }
    if (frame % 60 === 30 && gameState.heldItem) {
      return { action: "PLACE" };
    }
    if (frame % 10 === 0 && gameState.heldItem) {
      return { action: ["MOVE_RIGHT", "MOVE_DOWN"][Math.floor(Math.random() * 2)] };
    }
  } else if (gameState.controlMode === "TEST_2") {
    // Win test - systematic placement
    const frame = p.frameCount;
    
    if (!gameState.heldItem && gameState.inventory.length > gameState.placedItems.length) {
      return { action: "SELECT_NEXT" };
    }
    
    if (gameState.heldItem) {
      if (frame % 5 === 0) {
        const actions = ["MOVE_RIGHT", "MOVE_DOWN", "MOVE_LEFT", "MOVE_UP", "PLACE"];
        return { action: actions[Math.floor(Math.random() * actions.length)] };
      }
    }
  }
  
  return null;
}