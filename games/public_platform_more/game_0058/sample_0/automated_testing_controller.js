// automated_testing_controller.js - Automated testing

import { gameState, LOCATIONS, PUZZLES } from './globals.js';

let testState = {
  step: 0,
  subStep: 0,
  waitFrames: 0,
  positionHistory: [],
  stuckCounter: 0,
  targetHotspot: null,
  currentObjective: null
};

function getTestWinAction(gameState) {
  // Strategy: Solve all mandatory puzzles in order
  // 1. Solve fountain_puzzle
  // 2. Solve box_puzzle
  // 3. Solve statue_puzzle (unlocks library)
  // 4. Navigate to library
  // 5. Solve book_puzzle (final puzzle)
  
  const mandatoryPuzzles = ["fountain_puzzle", "box_puzzle", "statue_puzzle", "book_puzzle"];
  
  // Wait if transitioning or in dialogue
  if (testState.waitFrames > 0) {
    testState.waitFrames--;
    return { keyCode: null };
  }
  
  // Handle puzzle solving
  if (gameState.inPuzzle) {
    const puzzle = PUZZLES[gameState.currentPuzzle];
    if (puzzle) {
      // Type answer
      if (gameState.puzzleInput !== puzzle.answer) {
        const nextChar = puzzle.answer[gameState.puzzleInput.length];
        if (nextChar) {
          return { keyCode: nextChar.charCodeAt(0), key: nextChar };
        }
      } else {
        // Submit answer
        testState.waitFrames = 10;
        return { keyCode: 32, key: " " }; // SPACE
      }
    }
  }
  
  // Handle dialogue
  if (gameState.inDialogue) {
    testState.waitFrames = 5;
    return { keyCode: 32, key: " " }; // SPACE to continue
  }
  
  // Find next unsolved mandatory puzzle
  const nextPuzzle = mandatoryPuzzles.find(p => !gameState.solvedPuzzles.has(p));
  
  if (!nextPuzzle) {
    // All puzzles solved - victory!
    return { keyCode: null };
  }
  
  // Navigate to puzzle location
  const puzzleLocation = findPuzzleLocation(nextPuzzle);
  
  if (gameState.currentLocation !== puzzleLocation) {
    // Navigate to correct location
    const path = findPath(gameState.currentLocation, puzzleLocation);
    if (path && path.length > 1) {
      const nextLoc = path[1];
      const direction = getDirectionToLocation(gameState.currentLocation, nextLoc);
      
      if (direction) {
        testState.waitFrames = 20; // Wait for transition
        return getDirectionKey(direction);
      }
    }
  } else {
    // In correct location - navigate to puzzle hotspot
    const location = LOCATIONS[gameState.currentLocation];
    const hotspot = location.hotspots.find(h => h.id === nextPuzzle);
    
    if (hotspot) {
      const dx = hotspot.x - gameState.cursorX;
      const dy = hotspot.y - gameState.cursorY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 30) {
        // Close enough - interact
        testState.waitFrames = 10;
        return { keyCode: 32, key: " " }; // SPACE
      } else {
        // Move cursor towards hotspot
        if (Math.abs(dx) > Math.abs(dy)) {
          return dx > 0 ? { keyCode: 39, key: "ArrowRight" } : { keyCode: 37, key: "ArrowLeft" };
        } else {
          return dy > 0 ? { keyCode: 40, key: "ArrowDown" } : { keyCode: 38, key: "ArrowUp" };
        }
      }
    }
  }
  
  return { keyCode: null };
}

function getBasicTestAction(gameState) {
  // Basic test: Move around, collect coins, interact with NPCs
  
  if (testState.waitFrames > 0) {
    testState.waitFrames--;
    return { keyCode: null };
  }
  
  if (gameState.inDialogue) {
    testState.waitFrames = 5;
    return { keyCode: 32, key: " " };
  }
  
  if (gameState.inPuzzle) {
    // Exit puzzle without solving
    gameState.inPuzzle = false;
    gameState.currentPuzzle = null;
    return { keyCode: null };
  }
  
  testState.step++;
  
  // Cycle through basic actions
  const actions = [
    { keyCode: 39, key: "ArrowRight" },
    { keyCode: 39, key: "ArrowRight" },
    { keyCode: 40, key: "ArrowDown" },
    { keyCode: 40, key: "ArrowDown" },
    { keyCode: 37, key: "ArrowLeft" },
    { keyCode: 37, key: "ArrowLeft" },
    { keyCode: 38, key: "ArrowUp" },
    { keyCode: 38, key: "ArrowUp" },
    { keyCode: 32, key: " " } // Interact
  ];
  
  return actions[testState.step % actions.length];
}

function getHintCoinTestAction(gameState) {
  // Test: Collect hint coins
  
  if (testState.waitFrames > 0) {
    testState.waitFrames--;
    return { keyCode: null };
  }
  
  if (gameState.inDialogue) {
    testState.waitFrames = 5;
    return { keyCode: 32, key: " " };
  }
  
  const location = LOCATIONS[gameState.currentLocation];
  const coinHotspot = location.hotspots.find(h => 
    h.type === "hint_coin" && !gameState.collectedItems.includes(h.id)
  );
  
  if (coinHotspot) {
    const dx = coinHotspot.x - gameState.cursorX;
    const dy = coinHotspot.y - gameState.cursorY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < 30) {
      testState.waitFrames = 10;
      return { keyCode: 32, key: " " };
    } else {
      if (Math.abs(dx) > Math.abs(dy)) {
        return dx > 0 ? { keyCode: 39, key: "ArrowRight" } : { keyCode: 37, key: "ArrowLeft" };
      } else {
        return dy > 0 ? { keyCode: 40, key: "ArrowDown" } : { keyCode: 38, key: "ArrowUp" };
      }
    }
  } else {
    // Navigate to next location
    if (location.connections.right) {
      testState.waitFrames = 20;
      return { keyCode: 39, key: "ArrowRight" };
    }
  }
  
  return { keyCode: null };
}

function findPuzzleLocation(puzzleId) {
  for (const [locId, location] of Object.entries(LOCATIONS)) {
    if (location.hotspots.some(h => h.id === puzzleId)) {
      return locId;
    }
  }
  return null;
}

function findPath(from, to) {
  // Simple BFS pathfinding
  const queue = [[from]];
  const visited = new Set([from]);
  
  while (queue.length > 0) {
    const path = queue.shift();
    const current = path[path.length - 1];
    
    if (current === to) {
      return path;
    }
    
    const location = LOCATIONS[current];
    if (location) {
      for (const [dir, next] of Object.entries(location.connections)) {
        if (!visited.has(next)) {
          visited.add(next);
          queue.push([...path, next]);
        }
      }
    }
  }
  
  return null;
}

function getDirectionToLocation(from, to) {
  const location = LOCATIONS[from];
  if (!location) return null;
  
  for (const [dir, nextLoc] of Object.entries(location.connections)) {
    if (nextLoc === to) {
      return dir;
    }
  }
  
  return null;
}

function getDirectionKey(direction) {
  switch(direction) {
    case "up": return { keyCode: 38, key: "ArrowUp" };
    case "down": return { keyCode: 40, key: "ArrowDown" };
    case "left": return { keyCode: 37, key: "ArrowLeft" };
    case "right": return { keyCode: 39, key: "ArrowRight" };
    default: return { keyCode: null };
  }
}

function getRandomAction(gameState) {
  const actions = [
    { keyCode: 37, key: "ArrowLeft" },
    { keyCode: 38, key: "ArrowUp" },
    { keyCode: 39, key: "ArrowRight" },
    { keyCode: 40, key: "ArrowDown" },
    { keyCode: 32, key: " " }
  ];
  
  return actions[Math.floor(Math.random() * actions.length)];
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getHintCoinTestAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;