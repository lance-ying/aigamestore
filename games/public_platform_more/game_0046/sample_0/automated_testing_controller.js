// automated_testing_controller.js - Automated testing

import { gameState, SCENE_DATA, PUZZLES } from './globals.js';

let actionHistory = [];
let stuckCounter = 0;
let lastPosition = -1;

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getWinTestAction(gameState);
    case "TEST_3":
      return getInventoryTestAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

function getBasicTestAction(gameState) {
  // Basic navigation and interaction test
  const scene = SCENE_DATA[gameState.currentScene];
  
  // Collect items first
  if (scene.hotspots.some(h => h.visible && h.type === "item")) {
    return { keyCode: 32 }; // Space - interact
  }
  
  // Navigate through scenes
  const exits = Object.keys(scene.exits);
  if (exits.length > 0) {
    const direction = exits[Math.floor(actionHistory.length / 10) % exits.length];
    
    switch(direction) {
      case 'left': return { keyCode: 37 };
      case 'right': return { keyCode: 39 };
      case 'up': return { keyCode: 38 };
      case 'down': return { keyCode: 40 };
    }
  }
  
  return { keyCode: 32 };
}

function getWinTestAction(gameState) {
  // Optimal path to win
  const currentScene = gameState.currentScene;
  actionHistory.push(currentScene);
  
  // Check if stuck
  if (currentScene === lastPosition) {
    stuckCounter++;
  } else {
    stuckCounter = 0;
    lastPosition = currentScene;
  }
  
  if (stuckCounter > 5) {
    stuckCounter = 0;
    return getRandomNavigationAction(gameState);
  }
  
  // Optimal solution path
  const scene = SCENE_DATA[currentScene];
  
  // Phase 1: Collect keycard from scene 0
  if (currentScene === 0 && scene.hotspots.find(h => h.id === "key_card" && h.visible)) {
    return { keyCode: 32 }; // Collect keycard
  }
  
  // Phase 2: Go to scene 1 and use keycard on panel
  if (currentScene === 0 && gameState.inventory.some(i => i.name === "keycard")) {
    return { keyCode: 39 }; // Go right to scene 1
  }
  
  if (currentScene === 1 && gameState.inventory.some(i => i.name === "keycard") && !PUZZLES.code_lock.solved) {
    // Select keycard
    const keycardIndex = gameState.inventory.findIndex(i => i.name === "keycard");
    if (gameState.selectedItemIndex !== keycardIndex) {
      return { keyCode: 90 }; // Select keycard
    }
    return { keyCode: 32 }; // Use keycard
  }
  
  // Phase 3: Collect battery from scene 1
  if (currentScene === 1 && scene.hotspots.find(h => h.id === "battery" && h.visible)) {
    return { keyCode: 32 }; // Collect battery
  }
  
  // Phase 4: Go to scene 2
  if (currentScene === 1 && PUZZLES.code_lock.solved && !gameState.visitedScenes.includes(2)) {
    return { keyCode: 38 }; // Go up to scene 2
  }
  
  // Phase 5: Collect chemical from scene 2
  if (currentScene === 2 && scene.hotspots.find(h => h.id === "chemical" && h.visible)) {
    return { keyCode: 32 }; // Collect chemical
  }
  
  // Phase 6: Use chemical on microscope
  if (currentScene === 2 && gameState.inventory.some(i => i.name === "chemical") && !PUZZLES.sample_analysis.solved) {
    const chemicalIndex = gameState.inventory.findIndex(i => i.name === "chemical");
    if (gameState.selectedItemIndex !== chemicalIndex) {
      return { keyCode: 90 }; // Select chemical
    }
    return { keyCode: 32 }; // Use chemical
  }
  
  // Phase 7: Go to scene 3
  if (currentScene === 2 && PUZZLES.sample_analysis.solved) {
    return { keyCode: 39 }; // Go right to scene 3
  }
  
  // Phase 8: Collect wrench from scene 3
  if (currentScene === 3 && scene.hotspots.find(h => h.id === "toolbox" && h.visible)) {
    return { keyCode: 32 }; // Collect wrench
  }
  
  // Phase 9: Use wrench on door lock
  if (currentScene === 3 && gameState.inventory.some(i => i.name === "wrench") && !PUZZLES.locked_door.solved) {
    const wrenchIndex = gameState.inventory.findIndex(i => i.name === "wrench");
    if (gameState.selectedItemIndex !== wrenchIndex) {
      return { keyCode: 90 }; // Select wrench
    }
    return { keyCode: 32 }; // Use wrench
  }
  
  // Phase 10: Go to scene 4
  if (currentScene === 3 && PUZZLES.locked_door.solved) {
    return { keyCode: 38 }; // Go up to scene 4
  }
  
  // Phase 11: Use battery on radio
  if (currentScene === 4 && gameState.inventory.some(i => i.name === "battery") && !PUZZLES.radio_frequency.solved) {
    const batteryIndex = gameState.inventory.findIndex(i => i.name === "battery");
    if (gameState.selectedItemIndex !== batteryIndex) {
      return { keyCode: 90 }; // Select battery
    }
    return { keyCode: 32 }; // Use battery
  }
  
  // Phase 12: Go to scene 5
  if (currentScene === 4 && PUZZLES.radio_frequency.solved) {
    return { keyCode: 39 }; // Go right to scene 5
  }
  
  // Phase 13: Final puzzle
  if (currentScene === 5) {
    return { keyCode: 32 }; // Interact with core
  }
  
  // Default: navigate toward next objective
  return getRandomNavigationAction(gameState);
}

function getInventoryTestAction(gameState) {
  const scene = SCENE_DATA[gameState.currentScene];
  
  // Collect all items
  if (scene.hotspots.some(h => h.visible && h.type === "item")) {
    return { keyCode: 32 }; // Interact
  }
  
  // Cycle through inventory
  if (gameState.inventory.length > 0 && actionHistory.length % 20 === 0) {
    return { keyCode: 90 }; // Cycle inventory
  }
  
  // Try using items
  if (gameState.inventory.length > 0 && actionHistory.length % 30 === 0) {
    return { keyCode: 32 }; // Use item
  }
  
  // Navigate
  const exits = Object.keys(scene.exits);
  if (exits.length > 0) {
    const direction = exits[Math.floor(actionHistory.length / 15) % exits.length];
    
    switch(direction) {
      case 'left': return { keyCode: 37 };
      case 'right': return { keyCode: 39 };
      case 'up': return { keyCode: 38 };
      case 'down': return { keyCode: 40 };
    }
  }
  
  return { keyCode: 32 };
}

function getRandomAction(gameState) {
  const actions = [37, 39, 38, 40, 32, 90];
  const randomIndex = Math.floor(Math.random() * actions.length);
  return { keyCode: actions[randomIndex] };
}

function getRandomNavigationAction(gameState) {
  const scene = SCENE_DATA[gameState.currentScene];
  const exits = Object.keys(scene.exits);
  
  if (exits.length > 0) {
    const direction = exits[Math.floor(Math.random() * exits.length)];
    
    switch(direction) {
      case 'left': return { keyCode: 37 };
      case 'right': return { keyCode: 39 };
      case 'up': return { keyCode: 38 };
      case 'down': return { keyCode: 40 };
    }
  }
  
  return { keyCode: 32 };
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;