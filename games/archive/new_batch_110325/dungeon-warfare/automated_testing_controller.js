// automated_testing_controller.js - Automated testing

import { 
  gameState, 
  PHASE_PLAYING,
  TRAP_ARROW,
  TRAP_FIRE,
  GRID_COLS,
  GRID_ROWS
} from './globals.js';
import { isOnPath } from './pathGenerator.js';

function getTestBasicAction(state) {
  // Test basic trap placement
  if (state.gamePhase !== PHASE_PLAYING) {
    return null;
  }
  
  // Place traps along the path edges
  if (state.traps.length < 5) {
    // Find a good position near the path
    for (let y = 0; y < GRID_ROWS; y++) {
      for (let x = 0; x < GRID_COLS; x++) {
        if (!isOnPath(x, y, state.path)) {
          // Check if adjacent to path
          const adjacentToPath = 
            isOnPath(x - 1, y, state.path) ||
            isOnPath(x + 1, y, state.path) ||
            isOnPath(x, y - 1, state.path) ||
            isOnPath(x, y + 1, state.path);
          
          if (adjacentToPath) {
            const existingTrap = state.traps.find(t => t.gridX === x && t.gridY === y);
            if (!existingTrap && state.gold >= 50) {
              // Move cursor to this position
              if (state.cursor.x < x) return { keyCode: 39 }; // Right
              if (state.cursor.x > x) return { keyCode: 37 }; // Left
              if (state.cursor.y < y) return { keyCode: 40 }; // Down
              if (state.cursor.y > y) return { keyCode: 38 }; // Up
              
              // Open menu and place trap
              if (!state.showTrapMenu) {
                return { keyCode: 32 }; // Space
              } else {
                return { keyCode: 49 }; // 1 (Arrow trap)
              }
            }
          }
        }
      }
    }
  }
  
  return null;
}

function getTestWinAction(state) {
  if (state.gamePhase !== PHASE_PLAYING) {
    return null;
  }
  
  // Strategic trap placement for winning
  const strategicPositions = [
    { x: 2, y: 9 }, { x: 2, y: 11 },
    { x: 5, y: 9 }, { x: 5, y: 11 },
    { x: 8, y: 9 }, { x: 8, y: 11 },
    { x: 11, y: 9 }, { x: 11, y: 11 },
    { x: 14, y: 9 }, { x: 14, y: 11 },
    { x: 17, y: 9 }, { x: 17, y: 11 },
    { x: 20, y: 9 }, { x: 20, y: 11 }
  ];
  
  // Place traps at strategic positions
  for (const pos of strategicPositions) {
    if (pos.x >= GRID_COLS || pos.y >= GRID_ROWS) continue;
    
    const existingTrap = state.traps.find(t => t.gridX === pos.x && t.gridY === pos.y);
    if (!existingTrap && state.gold >= 50) {
      // Move cursor to position
      if (state.cursor.x < pos.x) return { keyCode: 39 }; // Right
      if (state.cursor.x > pos.x) return { keyCode: 37 }; // Left
      if (state.cursor.y < pos.y) return { keyCode: 40 }; // Down
      if (state.cursor.y > pos.y) return { keyCode: 38 }; // Up
      
      // Place trap
      if (!state.showTrapMenu) {
        return { keyCode: 32 }; // Space
      } else {
        // Alternate between arrow and fire traps
        return { keyCode: state.traps.length % 2 === 0 ? 49 : 51 }; // 1 or 3
      }
    }
  }
  
  // Upgrade traps when we have extra gold
  if (state.gold >= 100) {
    for (const trap of state.traps) {
      if (trap.level < 3) {
        // Move to trap
        if (state.cursor.x < trap.gridX) return { keyCode: 39 };
        if (state.cursor.x > trap.gridX) return { keyCode: 37 };
        if (state.cursor.y < trap.gridY) return { keyCode: 40 };
        if (state.cursor.y > trap.gridY) return { keyCode: 38 };
        
        // Upgrade
        return { keyCode: 90 }; // Z
      }
    }
  }
  
  return null;
}

function getRandomAction(state) {
  if (state.gamePhase !== PHASE_PLAYING) {
    return null;
  }
  
  const actions = [37, 38, 39, 40]; // Arrow keys
  const randomIndex = Math.floor(Math.random() * actions.length);
  return { keyCode: actions[randomIndex] };
}

export function get_automated_testing_action(state) {
  switch (state.controlMode) {
    case "TEST_1":
      return getTestBasicAction(state);
    case "TEST_2":
      return getTestWinAction(state);
    default:
      return getRandomAction(state);
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;