// automated_testing_controller.js - Automated testing
import { GAME_PHASES } from './globals.js';

function getTestWinAction(gameState) {
  // Strategy to win: collect all clues systematically, solve puzzles, complete the mystery
  
  const location = gameState.currentLocation;
  const inventory = gameState.inventory;
  const solvedPuzzles = gameState.solvedPuzzles;
  
  // Phase 1: Explore HQ
  if (location === "headquarters") {
    if (!inventory.includes("schedule")) {
      return { key: " ", keyCode: 32 }; // Interact with map
    }
    if (gameState.unlockedLocations.includes("park")) {
      return { key: "ArrowRight", keyCode: 39 }; // Go to park
    }
    return { key: " ", keyCode: 32 }; // Keep interacting
  }
  
  // Phase 2: Explore park
  if (location === "park") {
    if (!inventory.includes("graffiti_photo")) {
      return { key: " ", keyCode: 32 }; // Get graffiti photo
    }
    if (!inventory.includes("coded_message")) {
      if (gameState.selectedHotspot < 2) {
        return { key: "ArrowDown", keyCode: 40 }; // Navigate to trash can
      }
      return { key: " ", keyCode: 32 }; // Get coded message
    }
    if (!inventory.includes("witness_testimony")) {
      return { key: " ", keyCode: 32 }; // Talk to witness
    }
    if (gameState.unlockedLocations.includes("library")) {
      return { key: "ArrowRight", keyCode: 39 }; // Go to library
    }
    return { key: " ", keyCode: 32 };
  }
  
  // Phase 3: Visit library
  if (location === "library") {
    if (!solvedPuzzles.includes("decode_message") && inventory.includes("coded_message")) {
      // Open inventory and combine
      if (!gameState.inventoryOpen) {
        return { key: "z", keyCode: 90 }; // Open inventory
      }
      return { key: "Shift", keyCode: 16 }; // Combine items
    }
    if (gameState.unlockedLocations.includes("warehouse")) {
      return { key: "ArrowRight", keyCode: 39 }; // Go to warehouse
    }
    return { key: " ", keyCode: 32 };
  }
  
  // Phase 4: Warehouse
  if (location === "warehouse") {
    if (!inventory.includes("paint_sample")) {
      return { key: " ", keyCode: 32 }; // Get paint sample
    }
    if (gameState.unlockedLocations.includes("pier")) {
      return { key: "ArrowRight", keyCode: 39 }; // Go to pier
    }
    if (!solvedPuzzles.includes("match_paint") && 
        inventory.includes("paint_sample") && 
        inventory.includes("receipt")) {
      if (!gameState.inventoryOpen) {
        return { key: "z", keyCode: 90 };
      }
      return { key: "Shift", keyCode: 16 };
    }
    return { key: " ", keyCode: 32 };
  }
  
  // Phase 5: Pier
  if (location === "pier") {
    if (!inventory.includes("receipt")) {
      if (gameState.selectedHotspot < 2) {
        return { key: "ArrowDown", keyCode: 40 };
      }
      return { key: " ", keyCode: 32 }; // Get receipt
    }
    if (!inventory.includes("rope_piece")) {
      if (gameState.selectedHotspot < 1) {
        return { key: "ArrowDown", keyCode: 40 };
      }
      return { key: " ", keyCode: 32 };
    }
    
    // Final puzzle: identify culprit
    if (!solvedPuzzles.includes("identify_culprit") &&
        inventory.includes("graffiti_photo") &&
        inventory.includes("witness_testimony") &&
        inventory.includes("schedule")) {
      if (!gameState.inventoryOpen) {
        return { key: "z", keyCode: 90 };
      }
      return { key: "Shift", keyCode: 16 };
    }
    
    return { key: " ", keyCode: 32 };
  }
  
  // Navigate between locations
  if (gameState.mysteryCluesFound < 3) {
    return { key: "ArrowRight", keyCode: 39 };
  }
  
  return { key: " ", keyCode: 32 };
}

function getBasicTestAction(gameState) {
  // Basic navigation and interaction test
  const actions = [
    { key: " ", keyCode: 32 },
    { key: "ArrowDown", keyCode: 40 },
    { key: " ", keyCode: 32 },
    { key: "ArrowRight", keyCode: 39 },
    { key: " ", keyCode: 32 },
    { key: "z", keyCode: 90 },
    { key: "ArrowLeft", keyCode: 37 }
  ];
  
  const frame = gameState.player ? Math.floor(Date.now() / 500) % actions.length : 0;
  return actions[frame];
}

function getRandomAction(gameState) {
  const actions = [
    { key: " ", keyCode: 32 },
    { key: "ArrowLeft", keyCode: 37 },
    { key: "ArrowRight", keyCode: 39 },
    { key: "ArrowUp", keyCode: 38 },
    { key: "ArrowDown", keyCode: 40 },
    { key: "z", keyCode: 90 }
  ];
  
  return actions[Math.floor(Math.random() * actions.length)];
}

export function get_automated_testing_action(gameState) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return null;
  }
  
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;