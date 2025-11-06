// automated_testing_controller.js - Automated testing logic

import { gameState, FACILITY_TYPES, GRID_COLS, GRID_ROWS } from './globals.js';

function getTestWinAction(gameState) {
  // Strategy: Build efficiently to win
  // 1. Place facilities strategically across the grid
  // 2. Prioritize high-value facilities when unlocked
  // 3. Maximize coverage to serve more guests
  
  const facilityKeys = gameState.unlockedFacilities;
  
  // If menu is not open, open it
  if (!gameState.menuOpen) {
    return { keyCode: 90 }; // Z to open menu
  }
  
  // Select best affordable facility
  let bestIndex = -1;
  let bestValue = -1;
  
  for (let i = 0; i < facilityKeys.length; i++) {
    const facility = FACILITY_TYPES[facilityKeys[i]];
    if (gameState.money >= facility.cost) {
      const value = facility.income + facility.satisfaction;
      if (value > bestValue) {
        bestValue = value;
        bestIndex = i;
      }
    }
  }
  
  if (bestIndex === -1) {
    // Can't afford anything, close menu and wait
    return { keyCode: 90 }; // Z to close
  }
  
  // Navigate to best facility
  if (gameState.menuIndex < bestIndex) {
    return { keyCode: 39 }; // RIGHT
  } else if (gameState.menuIndex > bestIndex) {
    return { keyCode: 37 }; // LEFT
  }
  
  // Selected right facility, close menu
  gameState.selectedFacility = facilityKeys[bestIndex];
  return { keyCode: 90 }; // Z to close and start placing
}

function getPlacementAction(gameState) {
  // Find empty spot to place facility
  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLS; x++) {
      if (gameState.gridOccupied[y][x] === null) {
        // Navigate to this position
        if (gameState.selectedTile.x < x) {
          return { keyCode: 39 }; // RIGHT
        } else if (gameState.selectedTile.x > x) {
          return { keyCode: 37 }; // LEFT
        } else if (gameState.selectedTile.y < y) {
          return { keyCode: 40 }; // DOWN
        } else if (gameState.selectedTile.y > y) {
          return { keyCode: 38 }; // UP
        } else {
          // At correct position, place facility
          return { keyCode: 32 }; // SPACE
        }
      }
    }
  }
  
  // Grid full or no valid position
  return { keyCode: 90 }; // Z to deselect
}

function getTestBasicAction(gameState) {
  // Basic test: Place a few facilities and observe
  if (gameState.facilities.length < 5) {
    if (gameState.selectedFacility) {
      return getPlacementAction(gameState);
    } else {
      return getTestWinAction(gameState);
    }
  }
  
  // Just wait and observe
  return { keyCode: 16 }; // SHIFT (does nothing in this context but valid)
}

function getRandomAction(gameState) {
  const actions = [37, 38, 39, 40, 32, 90]; // Arrow keys, Space, Z
  const randomIndex = Math.floor(Math.random() * actions.length);
  return { keyCode: actions[randomIndex] };
}

export function get_automated_testing_action(gameState) {
  if (gameState.gamePhase !== 'PLAYING') {
    return null;
  }
  
  switch (gameState.controlMode) {
    case 'TEST_1':
      return getTestBasicAction(gameState);
    case 'TEST_2':
      if (gameState.selectedFacility) {
        return getPlacementAction(gameState);
      } else {
        return getTestWinAction(gameState);
      }
    default:
      return getRandomAction(gameState);
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;