// automated_testing_controller.js - Automated testing

import { GAME_PHASES } from './globals.js';

function getTestWinAction(gameState) {
  const phase = gameState.gamePhase;
  
  if (phase !== GAME_PHASES.PLAYING) {
    return null;
  }
  
  // Optimal win strategy
  const scene = gameState.currentScene;
  const inventory = gameState.inventory;
  const puzzles = gameState.puzzlesSolved;
  
  // Step 1: Collect stone key from entrance
  if (scene === "entrance" && !inventory.includes("stone_key")) {
    if (gameState.selectedHotspot !== 1) {
      return { keyCode: 40 }; // DOWN to select stone key
    }
    return { keyCode: 32 }; // SPACE to collect
  }
  
  // Step 2: Go to plaza
  if (scene === "entrance" && inventory.includes("stone_key")) {
    return { keyCode: 38 }; // UP/FORWARD to plaza
  }
  
  // Step 3: Read gate runes first for clue
  if (scene === "entrance" && !puzzles.includes("read_runes")) {
    if (gameState.selectedHotspot !== 0) {
      return { keyCode: 38 }; // UP to select runes
    }
    return { keyCode: 32 }; // SPACE to examine
  }
  
  // Step 4: Use stone key on fountain in plaza
  if (scene === "plaza" && inventory.includes("stone_key") && !puzzles.includes("unlock_temple")) {
    if (gameState.selectedHotspot !== 0) {
      return { keyCode: 40 }; // DOWN to select fountain
    }
    if (!gameState.showInventory) {
      return { keyCode: 90 }; // Z to open inventory
    }
    if (gameState.selectedInventoryItem !== inventory.indexOf("stone_key")) {
      return { keyCode: 39 }; // RIGHT to select stone key
    }
    return { keyCode: 32 }; // SPACE to use
  }
  
  // Step 5: Go to temple and collect sun medallion
  if (scene === "plaza" && puzzles.includes("unlock_temple") && !inventory.includes("sun_medallion")) {
    return { keyCode: 39 }; // RIGHT to temple
  }
  
  if (scene === "temple" && !inventory.includes("sun_medallion")) {
    if (gameState.selectedHotspot === null) {
      return { keyCode: 40 }; // DOWN to select something
    }
    const hotspots = ["altar", "sun_medallion", "mural"];
    const currentHotspot = hotspots[gameState.selectedHotspot];
    if (currentHotspot !== "sun_medallion") {
      return { keyCode: 40 }; // DOWN to cycle
    }
    return { keyCode: 32 }; // SPACE to collect
  }
  
  // Step 6: Return to plaza and use sun medallion on statue
  if (scene === "temple" && inventory.includes("sun_medallion") && !inventory.includes("silver_key")) {
    return { keyCode: 37 }; // LEFT to plaza
  }
  
  if (scene === "plaza" && inventory.includes("sun_medallion") && !puzzles.includes("statue_blessed")) {
    if (gameState.selectedHotspot !== 1) {
      return { keyCode: 40 }; // DOWN to select statue
    }
    if (!gameState.showInventory) {
      return { keyCode: 90 }; // Z to open inventory
    }
    if (gameState.selectedInventoryItem !== inventory.indexOf("sun_medallion")) {
      return { keyCode: 39 }; // RIGHT to select
    }
    return { keyCode: 32 }; // SPACE to use
  }
  
  // Step 7: Go to market
  if (scene === "plaza" && inventory.includes("silver_key") && !inventory.includes("moon_stone")) {
    return { keyCode: 37 }; // LEFT to market
  }
  
  // Step 8: Collect moon stone from market
  if (scene === "market" && !inventory.includes("moon_stone") && puzzles.includes("read_runes")) {
    if (gameState.selectedHotspot === null) {
      return { keyCode: 40 }; // DOWN to select
    }
    const hotspots = ["merchant_table", "moon_stone", "locked_chest"];
    const currentIdx = gameState.selectedHotspot;
    if (hotspots[currentIdx] !== "moon_stone") {
      return { keyCode: 40 }; // DOWN to cycle
    }
    return { keyCode: 32 }; // SPACE to collect
  }
  
  // Step 9: Use silver key on chest
  if (scene === "market" && inventory.includes("silver_key") && !puzzles.includes("unlock_tower")) {
    if (gameState.selectedHotspot === null) {
      return { keyCode: 40 }; // DOWN
    }
    const hotspots = ["merchant_table", "moon_stone", "locked_chest"];
    if (hotspots[gameState.selectedHotspot] !== "locked_chest") {
      return { keyCode: 40 }; // DOWN to cycle
    }
    if (!gameState.showInventory) {
      return { keyCode: 90 }; // Z
    }
    if (gameState.selectedInventoryItem !== inventory.indexOf("silver_key")) {
      return { keyCode: 39 }; // RIGHT
    }
    return { keyCode: 32 }; // SPACE
  }
  
  // Step 10: Go to tower
  if (scene === "market" && puzzles.includes("unlock_tower") && !inventory.includes("star_gem")) {
    return { keyCode: 38 }; // UP to tower
  }
  
  // Step 11: Collect star gem
  if (scene === "tower" && !inventory.includes("star_gem")) {
    if (gameState.selectedHotspot === null) {
      return { keyCode: 40 }; // DOWN
    }
    const hotspots = ["telescope", "star_gem", "crystal_pedestal"];
    if (hotspots[gameState.selectedHotspot] !== "star_gem") {
      return { keyCode: 40 }; // DOWN
    }
    return { keyCode: 32 }; // SPACE
  }
  
  // Step 12: Combine artifacts at pedestal
  if (scene === "tower" && 
      inventory.includes("sun_medallion") && 
      inventory.includes("moon_stone") && 
      inventory.includes("star_gem") &&
      !inventory.includes("power_crystal")) {
    // Open inventory and select any artifact to trigger combination
    if (!gameState.showInventory) {
      return { keyCode: 90 }; // Z
    }
    return { keyCode: 32 }; // SPACE to trigger combination
  }
  
  // Step 13: Go to temple
  if (scene === "tower" && inventory.includes("power_crystal")) {
    return { keyCode: 40 }; // DOWN to market
  }
  
  if (scene === "market" && inventory.includes("power_crystal")) {
    return { keyCode: 39 }; // RIGHT to plaza
  }
  
  if (scene === "plaza" && inventory.includes("power_crystal")) {
    return { keyCode: 39 }; // RIGHT to temple
  }
  
  // Step 14: Use power crystal on altar
  if (scene === "temple" && inventory.includes("power_crystal")) {
    if (gameState.selectedHotspot !== 0) {
      return { keyCode: 38 }; // UP to select altar
    }
    if (!gameState.showInventory) {
      return { keyCode: 90 }; // Z
    }
    if (gameState.selectedInventoryItem !== inventory.indexOf("power_crystal")) {
      return { keyCode: 39 }; // RIGHT
    }
    return { keyCode: 32 }; // SPACE to win
  }
  
  // Default exploration
  return { keyCode: 40 }; // DOWN
}

function getBasicTestAction(gameState) {
  const phase = gameState.gamePhase;
  
  if (phase !== GAME_PHASES.PLAYING) {
    return null;
  }
  
  // Simple test: navigate and collect items
  const scene = gameState.currentScene;
  const inventory = gameState.inventory;
  
  // Collect stone key
  if (scene === "entrance" && !inventory.includes("stone_key")) {
    if (gameState.selectedHotspot !== 1) {
      return { keyCode: 40 };
    }
    return { keyCode: 32 };
  }
  
  // Go to plaza
  if (scene === "entrance") {
    return { keyCode: 38 };
  }
  
  // Explore plaza
  if (scene === "plaza" && gameState.selectedHotspot === null) {
    return { keyCode: 40 };
  }
  
  // Try interactions
  if (gameState.selectedHotspot !== null) {
    return { keyCode: 32 };
  }
  
  // Navigate around
  return { keyCode: 37 };
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    default:
      return null;
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;