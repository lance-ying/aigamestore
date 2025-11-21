// automated_testing_controller.js - Automated testing controller

import { gameState, PHASE_PLAYING, GRID_SIZE, FACILITY_TYPES } from './globals.js';
import { getFacilityTypesList } from './facility.js';

function getTestWinAction(gameState) {
  if (gameState.gamePhase !== PHASE_PLAYING) {
    return null;
  }
  
  // Strategy: Build an optimal school layout
  // 1. Open build menu if not open
  // 2. Select optimal facilities based on budget and synergies
  // 3. Place them strategically on the grid
  
  const types = getFacilityTypesList();
  
  // If build menu is not open, open it
  if (!gameState.buildMenuOpen) {
    return { keyCode: 16 }; // Shift to open menu
  }
  
  // Find best facility to build based on budget and reputation gain
  let bestType = null;
  let bestRatio = 0;
  
  for (let i = 0; i < types.length; i++) {
    const type = types[i];
    const info = FACILITY_TYPES[type];
    if (gameState.budget >= info.cost) {
      const ratio = info.rep / info.cost;
      if (ratio > bestRatio) {
        bestRatio = ratio;
        bestType = type;
      }
    }
  }
  
  // If we can't afford anything, close menu and wait
  if (!bestType) {
    return { keyCode: 90 }; // Z to close menu
  }
  
  // Select the best facility type
  const targetIndex = types.indexOf(bestType);
  if (gameState.selectedFacilityIndex !== targetIndex) {
    return { keyCode: 32 }; // Space to cycle selection
  }
  
  // Find optimal placement location (adjacent to existing facilities for synergy)
  const placement = findOptimalPlacement(gameState, bestType);
  
  if (placement) {
    // Navigate to placement location
    if (gameState.cursorX < placement.x) {
      return { keyCode: 39 }; // RIGHT
    } else if (gameState.cursorX > placement.x) {
      return { keyCode: 37 }; // LEFT
    } else if (gameState.cursorY < placement.y) {
      return { keyCode: 40 }; // DOWN
    } else if (gameState.cursorY > placement.y) {
      return { keyCode: 38 }; // UP
    } else {
      // At the right position, place the facility
      return { keyCode: 32 }; // Space to place
    }
  }
  
  // No valid placement found, move randomly
  return getRandomMovement();
}

function findOptimalPlacement(gameState, facilityType) {
  // Find empty tiles adjacent to existing facilities for synergy bonus
  const candidates = [];
  
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (gameState.grid[y][x] === null) {
        const score = calculatePlacementScore(gameState, x, y, facilityType);
        candidates.push({ x, y, score });
      }
    }
  }
  
  if (candidates.length === 0) return null;
  
  // Sort by score and return best
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0];
}

function calculatePlacementScore(gameState, x, y, facilityType) {
  let score = 10; // Base score
  
  // Check adjacent tiles for synergies
  const directions = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  
  for (const [dx, dy] of directions) {
    const nx = x + dx;
    const ny = y + dy;
    if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
      const adjacent = gameState.grid[ny][nx];
      if (adjacent) {
        score += 5; // Bonus for being near any facility
        
        // Check for specific synergies
        const synergies = [
          { types: ["CLASSROOM", "LIBRARY"], bonus: 20 },
          { types: ["CLASSROOM", "LAB"], bonus: 22 },
          { types: ["CLUB_ROOM", "GYM"], bonus: 25 },
          { types: ["CAFETERIA", "CLUB_ROOM"], bonus: 18 },
          { types: ["GYM", "CAFETERIA"], bonus: 20 },
          { types: ["LIBRARY", "LAB"], bonus: 23 }
        ];
        
        for (const synergy of synergies) {
          if (synergy.types.includes(facilityType) && synergy.types.includes(adjacent.type)) {
            score += synergy.bonus;
          }
        }
      }
    }
  }
  
  // Prefer central locations
  const centerX = GRID_SIZE / 2;
  const centerY = GRID_SIZE / 2;
  const distanceFromCenter = Math.abs(x - centerX) + Math.abs(y - centerY);
  score -= distanceFromCenter * 2;
  
  return score;
}

function getTestBasicAction(gameState) {
  if (gameState.gamePhase !== PHASE_PLAYING) {
    return null;
  }
  
  // Simple test: Navigate around and place a few facilities
  
  // Open menu if not open
  if (!gameState.buildMenuOpen && gameState.entities.length < 3) {
    return { keyCode: 16 }; // Shift
  }
  
  // If menu is open, place a facility
  if (gameState.buildMenuOpen) {
    // Check if current position is empty
    if (gameState.grid[gameState.cursorY][gameState.cursorX] === null) {
      // Check if we can afford the selected facility
      const types = getFacilityTypesList();
      const selectedType = types[gameState.selectedFacilityIndex];
      const info = FACILITY_TYPES[selectedType];
      
      if (gameState.budget >= info.cost) {
        return { keyCode: 32 }; // Space to place
      } else {
        // Cycle to cheaper option
        return { keyCode: 32 }; // Space to cycle
      }
    } else {
      // Move to next empty tile
      return getRandomMovement();
    }
  }
  
  // Navigate randomly
  return getRandomMovement();
}

function getRandomMovement() {
  const movements = [37, 38, 39, 40]; // Arrow keys
  return { keyCode: movements[Math.floor(Math.random() * movements.length)] };
}

function getRandomAction(gameState) {
  if (gameState.gamePhase !== PHASE_PLAYING) {
    return null;
  }
  
  const actions = [37, 38, 39, 40, 32, 16]; // Arrows, Space, Shift
  return { keyCode: actions[Math.floor(Math.random() * actions.length)] };
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getTestBasicAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;