// automated_testing_controller.js - Automated testing strategies

import { 
  gameState,
  getCurrentTask,
  ROOM_BED,
  ROOM_BATHROOM,
  ROOM_DINING,
  ROOM_RECREATION,
  ROOM_THERAPY
} from './globals.js';

// TEST_1: Basic navigation and task completion
function getTest1Action(gs) {
  if (!gs.player) return null;
  
  // If task in progress, wait
  if (gs.taskInProgress) {
    return { keyCode: 32 }; // Space to continue
  }
  
  // Find nearest interactable that can be used
  let nearestObj = null;
  let nearestDist = Infinity;
  
  for (const obj of gs.interactables) {
    if (obj.canInteract()) {
      const dx = obj.x - gs.player.x;
      const dy = obj.y - gs.player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestObj = obj;
      }
    }
  }
  
  // If found an interactable, move towards it
  if (nearestObj) {
    const dx = nearestObj.x - gs.player.x;
    const dy = nearestObj.y - gs.player.y;
    
    if (nearestDist < 60) {
      // Close enough to interact
      return { keyCode: 32 }; // Space
    }
    
    // Move towards it
    if (Math.abs(dx) > Math.abs(dy)) {
      return { keyCode: dx > 0 ? 39 : 37 }; // Right or Left
    } else {
      return { keyCode: dy > 0 ? 40 : 38 }; // Down or Up
    }
  }
  
  // Random movement if nothing to do
  const actions = [37, 38, 39, 40];
  return { keyCode: actions[Math.floor(Math.random() * actions.length)] };
}

// TEST_2: Optimal win strategy
function getTest2Action(gs) {
  if (!gs.player) return null;
  
  // Handle puzzle input
  if (gs.currentPuzzle && !gs.currentPuzzle.showingPattern) {
    const puzzle = gs.currentPuzzle;
    if (puzzle.playerInput.length < puzzle.pattern.length) {
      const nextButton = puzzle.pattern[puzzle.playerInput.length];
      const keyMap = [38, 39, 40, 37]; // UP, RIGHT, DOWN, LEFT
      return { keyCode: keyMap[nextButton] };
    }
  }
  
  // If task in progress, continue
  if (gs.taskInProgress) {
    return { keyCode: 32 };
  }
  
  // Find the exact interactable for current task
  let targetObj = null;
  const currentTask = getCurrentTask();
  
  for (const obj of gs.interactables) {
    if (obj.taskType === currentTask && obj.room === gs.currentRoom) {
      targetObj = obj;
      break;
    }
  }
  
  if (targetObj) {
    const dx = targetObj.x - gs.player.x;
    const dy = targetObj.y - gs.player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < 60) {
      // Interact
      return { keyCode: 32 };
    }
    
    // Move directly towards target
    if (Math.abs(dx) > 5) {
      return { keyCode: dx > 0 ? 39 : 37 };
    }
    if (Math.abs(dy) > 5) {
      return { keyCode: dy > 0 ? 40 : 38 };
    }
  }
  
  return { keyCode: 32 }; // Default to space
}

// Main function called by game
export function get_automated_testing_action(gs) {
  switch (gs.controlMode) {
    case "TEST_1":
      return getTest1Action(gs);
    case "TEST_2":
      return getTest2Action(gs);
    default:
      return null;
  }
}

// Expose globally
window.get_automated_testing_action = get_automated_testing_action;