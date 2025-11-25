// automated_testing_controller.js - Automated testing functions

import { gameState, GRID_COLS, GRID_ROWS } from './globals.js';
import { findPath } from './pathfinding.js';

let testState = {
  lastCursorX: -1,
  lastCursorY: -1,
  targetX: -1,
  targetY: -1,
  movementPlan: [],
  placementQueue: [],
  stuckCounter: 0,
  initialized: false
};

function getTestWinAction(state) {
  // Strategy: Connect houses to destinations optimally
  // Priority: Connect buildings with highest queue first
  
  // Find house with highest queue that needs connection
  const needsConnection = [];
  for (const building of state.buildings) {
    if (building.type === "HOUSE") {
      const destinations = state.buildings.filter(
        b => b.type === "DESTINATION" && b.colorIndex === building.colorIndex
      );
      
      if (destinations.length > 0) {
        const dest = destinations[0];
        const path = findPath(building, dest);
        if (!path || path.length < 3) {  // No path or only direct connection
          needsConnection.push({
            house: building,
            dest: dest,
            priority: building.capacity + building.queue.length
          });
        }
      }
    }
  }
  
  needsConnection.sort((a, b) => b.priority - a.priority);
  
  // If we have connections to make, work on the highest priority
  if (needsConnection.length > 0) {
    const connection = needsConnection[0];
    return buildConnectionPath(state, connection.house, connection.dest);
  }
  
  // Otherwise, optimize existing roads with highways
  if (state.highwayTilesAvailable > 0) {
    return upgradeHighTrafficRoads(state);
  }
  
  // Move cursor randomly to explore
  return getRandomMovement(state);
}

function buildConnectionPath(state, start, end) {
  // Try to build a simple path between start and end
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  
  // Move cursor toward a good placement position
  let targetX = state.cursorX;
  let targetY = state.cursorY;
  
  // Find next empty cell on path
  if (Math.abs(dx) > Math.abs(dy)) {
    // Move horizontally first
    targetX = start.x + Math.sign(dx);
    targetY = start.y;
  } else {
    // Move vertically first
    targetX = start.x;
    targetY = start.y + Math.sign(dy);
  }
  
  // Ensure target is in bounds
  targetX = Math.max(0, Math.min(GRID_COLS - 1, targetX));
  targetY = Math.max(0, Math.min(GRID_ROWS - 1, targetY));
  
  // Move cursor to target
  if (state.cursorX < targetX) {
    return { keyCode: 39 };  // RIGHT
  } else if (state.cursorX > targetX) {
    return { keyCode: 37 };  // LEFT
  } else if (state.cursorY < targetY) {
    return { keyCode: 40 };  // DOWN
  } else if (state.cursorY > targetY) {
    return { keyCode: 38 };  // UP
  }
  
  // At target position - try to place road
  const cell = state.grid[state.cursorY][state.cursorX];
  if (cell.type === null && state.roadTilesAvailable > 0) {
    return { keyCode: 32 };  // SPACE - place road
  }
  
  // Move to adjacent cell
  return getRandomMovement(state);
}

function upgradeHighTrafficRoads(state) {
  // Find roads with most car traffic
  const roadTraffic = {};
  
  for (const car of state.cars) {
    const cx = Math.floor(car.x);
    const cy = Math.floor(car.y);
    const key = `${cx},${cy}`;
    roadTraffic[key] = (roadTraffic[key] || 0) + 1;
  }
  
  // Find highest traffic road that's not already highway
  let bestRoad = null;
  let maxTraffic = 0;
  
  for (const key in roadTraffic) {
    if (roadTraffic[key] > maxTraffic) {
      const [x, y] = key.split(',').map(Number);
      if (state.grid[y] && state.grid[y][x] && state.grid[y][x].type === "ROAD") {
        maxTraffic = roadTraffic[key];
        bestRoad = { x, y };
      }
    }
  }
  
  if (bestRoad) {
    // Move cursor to this road
    if (state.cursorX < bestRoad.x) {
      return { keyCode: 39 };  // RIGHT
    } else if (state.cursorX > bestRoad.x) {
      return { keyCode: 37 };  // LEFT
    } else if (state.cursorY < bestRoad.y) {
      return { keyCode: 40 };  // DOWN
    } else if (state.cursorY > bestRoad.y) {
      return { keyCode: 38 };  // UP
    } else {
      // At position - remove road and enable upgrade mode
      if (!state.upgradeMode) {
        return { keyCode: 16 };  // SHIFT - enable upgrade mode
      } else {
        return { keyCode: 32 };  // SPACE - place highway
      }
    }
  }
  
  return getRandomMovement(state);
}

function getRandomMovement(state) {
  const actions = [
    { keyCode: 37 },  // LEFT
    { keyCode: 39 },  // RIGHT
    { keyCode: 38 },  // UP
    { keyCode: 40 }   // DOWN
  ];
  
  return actions[Math.floor(Math.random() * actions.length)];
}

function getBasicTestAction(state) {
  // Test basic movement in a pattern
  if (!testState.initialized) {
    testState.initialized = true;
    testState.stuckCounter = 0;
  }
  
  testState.stuckCounter++;
  
  // Move in a square pattern
  if (testState.stuckCounter < 60) {
    return { keyCode: 39 };  // RIGHT
  } else if (testState.stuckCounter < 120) {
    return { keyCode: 40 };  // DOWN
  } else if (testState.stuckCounter < 180) {
    return { keyCode: 37 };  // LEFT
  } else if (testState.stuckCounter < 240) {
    return { keyCode: 38 };  // UP
  } else if (testState.stuckCounter < 300) {
    // Try placing some roads
    return { keyCode: 32 };  // SPACE
  } else {
    testState.stuckCounter = 0;
  }
  
  return { keyCode: 39 };
}

function getMovementTestAction(state) {
  // Test movement across entire grid
  if (state.cursorX < GRID_COLS - 1) {
    return { keyCode: 39 };  // RIGHT
  } else if (state.cursorY < GRID_ROWS - 1) {
    // Move to next row
    if (state.cursorX > 0) {
      return { keyCode: 37 };  // LEFT to start
    } else {
      return { keyCode: 40 };  // DOWN to next row
    }
  }
  
  return { keyCode: 38 };  // UP
}

function getPlacementTestAction(state) {
  // Test placing roads systematically
  const cell = state.grid[state.cursorY][state.cursorX];
  
  if (cell.type === null && state.roadTilesAvailable > 0) {
    return { keyCode: 32 };  // SPACE - place road
  }
  
  // Move to next position
  if (state.cursorX < GRID_COLS - 1) {
    return { keyCode: 39 };  // RIGHT
  } else if (state.cursorY < GRID_ROWS - 1) {
    return { keyCode: 40 };  // DOWN
  }
  
  return { keyCode: 37 };  // LEFT
}

function getUpgradeTestAction(state) {
  // Test highway upgrade system
  if (state.highwayTilesAvailable > 0 && !state.upgradeMode) {
    return { keyCode: 16 };  // SHIFT - enable upgrade mode
  }
  
  if (state.upgradeMode) {
    // Find a road to upgrade
    for (let y = 0; y < GRID_ROWS; y++) {
      for (let x = 0; x < GRID_COLS; x++) {
        if (state.grid[y][x].type === "ROAD") {
          // Move to this road
          if (state.cursorX < x) {
            return { keyCode: 39 };  // RIGHT
          } else if (state.cursorX > x) {
            return { keyCode: 37 };  // LEFT
          } else if (state.cursorY < y) {
            return { keyCode: 40 };  // DOWN
          } else if (state.cursorY > y) {
            return { keyCode: 38 };  // UP
          } else {
            // Remove and replace with highway
            return { keyCode: 32 };  // SPACE
          }
        }
      }
    }
  }
  
  return getRandomMovement(state);
}

function getRandomAction(state) {
  const actions = [
    { keyCode: 37 },  // LEFT
    { keyCode: 39 },  // RIGHT
    { keyCode: 38 },  // UP
    { keyCode: 40 },  // DOWN
    { keyCode: 32 },  // SPACE
  ];
  
  return actions[Math.floor(Math.random() * actions.length)];
}

export function get_automated_testing_action(state) {
  switch (state.controlMode) {
    case "TEST_1":
      return getBasicTestAction(state);
    case "TEST_2":
      return getTestWinAction(state);
    case "TEST_3":
      return getMovementTestAction(state);
    case "TEST_4":
      return getPlacementTestAction(state);
    case "TEST_5":
      return getUpgradeTestAction(state);
    default:
      return getRandomAction(state);
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;