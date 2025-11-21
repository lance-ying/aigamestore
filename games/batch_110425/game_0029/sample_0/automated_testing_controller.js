// automated_testing_controller.js
import { GAME_PHASES } from './globals.js';

let actionQueue = [];
let actionIndex = 0;
let stateHistory = [];
let lastPosition = null;
let stuckCounter = 0;

function getTestWinAction(gameState) {
  // Optimal strategy to win the game
  const optimalPath = [
    // Collect rope and stick from beach
    { keyCode: 90, key: 'z' }, // interact to collect rope
    { keyCode: 90, key: 'z' }, // interact to collect stick
    
    // Go to forest
    { keyCode: 38, key: 'ArrowUp' },
    { keyCode: 90, key: 'z' }, // collect mushroom
    
    // Go to clearing
    { keyCode: 38, key: 'ArrowUp' },
    { keyCode: 90, key: 'z' }, // collect flower
    
    // Go to ruins
    { keyCode: 39, key: 'ArrowRight' },
    
    // Go back to forest then cave
    { keyCode: 37, key: 'ArrowLeft' },
    { keyCode: 40, key: 'ArrowDown' },
    { keyCode: 40, key: 'ArrowDown' },
    { keyCode: 39, key: 'ArrowRight' },
    
    // Go to deep cave
    { keyCode: 38, key: 'ArrowUp' },
    
    // Solve code puzzle (1573)
    { keyCode: 90, key: 'z' }, // open puzzle
    { keyCode: 49, key: '1' },
    { keyCode: 53, key: '5' },
    { keyCode: 55, key: '7' },
    { keyCode: 51, key: '3' },
    { keyCode: 90, key: 'z' }, // submit
    
    // Go back to ruins
    { keyCode: 40, key: 'ArrowDown' },
    { keyCode: 37, key: 'ArrowLeft' },
    { keyCode: 38, key: 'ArrowUp' },
    { keyCode: 38, key: 'ArrowUp' },
    { keyCode: 39, key: 'ArrowRight' },
    
    // Select key and use on door
    { keyCode: 32, key: ' ' }, // select key (first item in inventory)
    { keyCode: 90, key: 'z' }, // use on door
    
    // Go to tower
    { keyCode: 38, key: 'ArrowUp' },
    { keyCode: 90, key: 'z' }, // pull lever
    
    // Go to bridge
    { keyCode: 40, key: 'ArrowDown' },
    { keyCode: 39, key: 'ArrowRight' },
    
    // Combine rope and stick
    { keyCode: 32, key: ' ' }, // select rope
    { keyCode: 32, key: ' ' }, // select stick
    { keyCode: 16, key: 'Shift' }, // combine
    
    // Use rope-stick on bridge
    { keyCode: 32, key: ' ' }, // select combined item
    { keyCode: 90, key: 'z' }, // use on bridge
    
    // Go to dock
    { keyCode: 39, key: 'ArrowRight' },
    { keyCode: 90, key: 'z' }, // interact with boat to win
  ];
  
  if (actionIndex < optimalPath.length) {
    const action = optimalPath[actionIndex];
    actionIndex++;
    return action;
  }
  
  return null;
}

function getBasicTestAction(gameState) {
  // Test basic navigation and interaction
  if (actionIndex < 50) {
    actionIndex++;
    
    // Cycle through basic actions
    const cycle = actionIndex % 10;
    if (cycle < 4 && gameState.availableDirections.length > 0) {
      const dirs = gameState.availableDirections;
      const dir = dirs[cycle % dirs.length];
      const keyMap = { UP: 38, DOWN: 40, LEFT: 37, RIGHT: 39 };
      const keyNameMap = { UP: 'ArrowUp', DOWN: 'ArrowDown', LEFT: 'ArrowLeft', RIGHT: 'ArrowRight' };
      return { keyCode: keyMap[dir], key: keyNameMap[dir] };
    } else if (cycle === 5) {
      return { keyCode: 90, key: 'z' }; // interact
    }
  }
  
  return null;
}

function getInventoryTestAction(gameState) {
  // Test inventory management
  if (actionIndex < 100) {
    actionIndex++;
    
    const cycle = actionIndex % 15;
    
    // First collect items
    if (actionIndex < 40) {
      if (cycle % 3 === 0 && gameState.availableDirections.length > 0) {
        const dirs = gameState.availableDirections;
        const dir = dirs[cycle % dirs.length];
        const keyMap = { UP: 38, DOWN: 40, LEFT: 37, RIGHT: 39 };
        const keyNameMap = { UP: 'ArrowUp', DOWN: 'ArrowDown', LEFT: 'ArrowLeft', RIGHT: 'ArrowRight' };
        return { keyCode: keyMap[dir], key: keyNameMap[dir] };
      } else {
        return { keyCode: 90, key: 'z' }; // collect items
      }
    }
    
    // Then test inventory operations
    if (cycle < 5 && gameState.inventory.length > 0) {
      return { keyCode: 32, key: ' ' }; // select items
    } else if (cycle === 7 && gameState.selectedItems.length === 2) {
      return { keyCode: 16, key: 'Shift' }; // combine
    } else if (cycle === 10) {
      return { keyCode: 90, key: 'z' }; // try to use
    }
  }
  
  return null;
}

function getPuzzleTestAction(gameState) {
  // Test puzzle solving
  if (actionIndex < 150) {
    actionIndex++;
    
    // Navigate to cave and solve puzzle
    if (actionIndex < 20) {
      const directions = [
        { keyCode: 39, key: 'ArrowRight' }, // to cave
        { keyCode: 38, key: 'ArrowUp' }, // to deep cave
        { keyCode: 90, key: 'z' }, // open puzzle
      ];
      if (actionIndex - 1 < directions.length) {
        return directions[actionIndex - 1];
      }
    } else if (actionIndex >= 20 && actionIndex < 30) {
      // Enter code 1573
      const codes = [
        { keyCode: 49, key: '1' },
        { keyCode: 53, key: '5' },
        { keyCode: 55, key: '7' },
        { keyCode: 51, key: '3' },
        { keyCode: 90, key: 'z' }, // submit
      ];
      const codeIndex = actionIndex - 20;
      if (codeIndex < codes.length) {
        return codes[codeIndex];
      }
    } else if (actionIndex < 50) {
      // Navigate to another puzzle
      if (actionIndex % 5 === 0 && gameState.availableDirections.length > 0) {
        const dir = gameState.availableDirections[0];
        const keyMap = { UP: 38, DOWN: 40, LEFT: 37, RIGHT: 39 };
        const keyNameMap = { UP: 'ArrowUp', DOWN: 'ArrowDown', LEFT: 'ArrowLeft', RIGHT: 'ArrowRight' };
        return { keyCode: keyMap[dir], key: keyNameMap[dir] };
      } else {
        return { keyCode: 90, key: 'z' };
      }
    }
  }
  
  return null;
}

function getRandomAction(gameState) {
  const actions = [];
  
  if (gameState.availableDirections.length > 0) {
    const dir = gameState.availableDirections[Math.floor(Math.random() * gameState.availableDirections.length)];
    const keyMap = { UP: 38, DOWN: 40, LEFT: 37, RIGHT: 39 };
    const keyNameMap = { UP: 'ArrowUp', DOWN: 'ArrowDown', LEFT: 'ArrowLeft', RIGHT: 'ArrowRight' };
    actions.push({ keyCode: keyMap[dir], key: keyNameMap[dir] });
  }
  
  actions.push({ keyCode: 90, key: 'z' });
  actions.push({ keyCode: 32, key: ' ' });
  
  return actions[Math.floor(Math.random() * actions.length)];
}

export function get_automated_testing_action(gameState) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    actionIndex = 0;
    return null;
  }
  
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getInventoryTestAction(gameState);
    case "TEST_4":
      return getPuzzleTestAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;