// automated_testing_controller.js - Automated testing

import { gameState } from './globals.js';
import { getRoomData } from './rooms.js';

function getTestWinAction(gameState) {
  // Optimal strategy to win the game
  const room = getRoomData(gameState.currentRoom);
  
  // State machine for winning strategy
  // 1. Entrance: Pick up torch, go to courtyard
  // 2. Courtyard: Examine fountain to reveal brass_key, pick it up, unlock hall door
  // 3. Hall: Go to library
  // 4. Library: Pick up small_key and scroll
  // 5. Hall: Use small_key on chest to get iron_key, go to armory
  // 6. Armory: Go to tower (need silver_key from gear puzzle)
  // 7. Tower: Pick up gear1 and gear2
  // 8. Armory: Use gears on puzzle to get silver_key
  // 9. Tower: Use silver_key to unlock throne room
  // 10. Throne: Use scroll and shield on final puzzle to win
  
  const strategy = [
    { room: "entrance", action: "pickup_torch", nextRoom: "courtyard" },
    { room: "courtyard", action: "examine_fountain", nextAction: "pickup_brass_key" },
    { room: "courtyard", action: "unlock_hall", nextRoom: "hall" },
    { room: "hall", action: "goto_library", nextRoom: "library" },
    { room: "library", action: "pickup_small_key", nextAction: "pickup_scroll" },
    { room: "library", action: "return_hall", nextRoom: "hall" },
    { room: "hall", action: "unlock_chest", nextAction: "goto_armory" },
    { room: "armory", action: "pickup_shield", nextAction: "goto_tower_preliminary" },
    { room: "tower", action: "pickup_gear1", nextAction: "pickup_gear2" },
    { room: "tower", action: "return_armory", nextRoom: "armory" },
    { room: "armory", action: "solve_gear_puzzle", nextAction: "goto_tower" },
    { room: "tower", action: "unlock_throne", nextRoom: "throne" },
    { room: "throne", action: "solve_final_puzzle" }
  ];
  
  // Execute strategy based on current state
  return executeWinStrategy();
}

function executeWinStrategy() {
  const room = getRoomData(gameState.currentRoom);
  
  // Navigation priorities based on game state
  
  // If in entrance and no torch, get torch
  if (gameState.currentRoom === "entrance" && !gameState.player.hasItem("torch")) {
    const torchHotspot = room.hotspots.find(h => h.id === "torch_left");
    if (torchHotspot && !torchHotspot.collected) {
      return navigateToAndInteract(torchHotspot);
    }
  }
  
  // Go to courtyard if in entrance
  if (gameState.currentRoom === "entrance") {
    const doorHotspot = room.hotspots.find(h => h.id === "door_courtyard");
    return navigateToAndInteract(doorHotspot);
  }
  
  // In courtyard
  if (gameState.currentRoom === "courtyard") {
    // Examine fountain if brass_key not revealed
    const keyHotspot = room.hotspots.find(h => h.id === "key_hidden");
    if (keyHotspot && keyHotspot.hidden) {
      const fountainHotspot = room.hotspots.find(h => h.id === "fountain");
      return navigateToAndInteract(fountainHotspot);
    }
    
    // Pick up brass_key if available
    if (keyHotspot && !keyHotspot.collected && !keyHotspot.hidden && !gameState.player.hasItem("brass_key")) {
      return navigateToAndInteract(keyHotspot);
    }
    
    // Unlock and go to hall
    const hallDoor = room.hotspots.find(h => h.id === "door_hall");
    if (gameState.player.hasItem("brass_key") || !hallDoor.locked) {
      return navigateToAndInteract(hallDoor);
    }
  }
  
  // In hall
  if (gameState.currentRoom === "hall") {
    // Go to library if don't have small_key
    if (!gameState.player.hasItem("small_key")) {
      const libraryDoor = room.hotspots.find(h => h.id === "door_library");
      return navigateToAndInteract(libraryDoor);
    }
    
    // Unlock chest if have small_key but not iron_key
    if (gameState.player.hasItem("small_key") && !gameState.player.hasItem("iron_key")) {
      const chest = room.hotspots.find(h => h.id === "chest");
      if (chest && chest.locked) {
        return navigateToAndInteract(chest);
      }
    }
    
    // Go to armory if have iron_key
    if (gameState.player.hasItem("iron_key") || gameState.unlockedDoors.has("door_armory")) {
      const armoryDoor = room.hotspots.find(h => h.id === "door_armory");
      return navigateToAndInteract(armoryDoor);
    }
  }
  
  // In library
  if (gameState.currentRoom === "library") {
    // Pick up small_key
    const keyHotspot = room.hotspots.find(h => h.id === "small_key_item");
    if (keyHotspot && !keyHotspot.collected && !gameState.player.hasItem("small_key")) {
      return navigateToAndInteract(keyHotspot);
    }
    
    // Pick up scroll
    const scrollHotspot = room.hotspots.find(h => h.id === "scroll");
    if (scrollHotspot && !scrollHotspot.collected && !gameState.player.hasItem("scroll")) {
      return navigateToAndInteract(scrollHotspot);
    }
    
    // Return to hall
    const hallDoor = room.hotspots.find(h => h.id === "door_hall");
    return navigateToAndInteract(hallDoor);
  }
  
  // In armory
  if (gameState.currentRoom === "armory") {
    // Pick up shield
    const shieldHotspot = room.hotspots.find(h => h.id === "shield");
    if (shieldHotspot && !shieldHotspot.collected && !gameState.player.hasItem("shield")) {
      return navigateToAndInteract(shieldHotspot);
    }
    
    // Go to tower if don't have gears
    if (!gameState.player.hasItem("gear1") || !gameState.player.hasItem("gear2")) {
      const towerDoor = room.hotspots.find(h => h.id === "door_tower");
      if (towerDoor && !towerDoor.locked) {
        // Need silver_key - wait for puzzle
        if (gameState.solvedPuzzles.has("gear_mechanism") || gameState.player.hasItem("silver_key")) {
          return navigateToAndInteract(towerDoor);
        }
      }
    }
    
    // Solve gear puzzle if have both gears
    if (gameState.player.hasItem("gear1") && gameState.player.hasItem("gear2") && 
        !gameState.solvedPuzzles.has("gear_mechanism")) {
      const puzzleHotspot = room.hotspots.find(h => h.id === "gear_puzzle");
      if (puzzleHotspot) {
        // Open inventory and select gear1
        if (!gameState.inventoryOpen) {
          return { keyCode: 90 }; // Z to open inventory
        } else {
          return { keyCode: 32 }; // Space to use
        }
      }
    }
    
    // Go to tower with silver_key
    if (gameState.player.hasItem("silver_key")) {
      const towerDoor = room.hotspots.find(h => h.id === "door_tower");
      return navigateToAndInteract(towerDoor);
    }
  }
  
  // In tower
  if (gameState.currentRoom === "tower") {
    // Pick up gear1
    const gear1Hotspot = room.hotspots.find(h => h.id === "gear1");
    if (gear1Hotspot && !gear1Hotspot.collected && !gameState.player.hasItem("gear1")) {
      return navigateToAndInteract(gear1Hotspot);
    }
    
    // Pick up gear2
    const gear2Hotspot = room.hotspots.find(h => h.id === "gear2");
    if (gear2Hotspot && !gear2Hotspot.collected && !gameState.player.hasItem("gear2")) {
      return navigateToAndInteract(gear2Hotspot);
    }
    
    // If have silver_key, go to throne
    if (gameState.player.hasItem("golden_key") || gameState.unlockedDoors.has("door_throne")) {
      const throneDoor = room.hotspots.find(h => h.id === "door_throne");
      return navigateToAndInteract(throneDoor);
    }
    
    // Otherwise return to armory
    const armoryDoor = room.hotspots.find(h => h.id === "door_armory");
    return navigateToAndInteract(armoryDoor);
  }
  
  // In throne room
  if (gameState.currentRoom === "throne") {
    // Solve final puzzle
    if (gameState.player.hasItem("scroll") && gameState.player.hasItem("shield") &&
        !gameState.solvedPuzzles.has("throne_secret")) {
      const puzzleHotspot = room.hotspots.find(h => h.id === "final_puzzle");
      if (puzzleHotspot) {
        if (!gameState.inventoryOpen) {
          return { keyCode: 90 }; // Open inventory
        } else {
          return { keyCode: 32 }; // Use item
        }
      }
    }
  }
  
  // Default: move cursor randomly
  return getRandomMovement();
}

function navigateToAndInteract(hotspot) {
  if (!hotspot) return getRandomMovement();
  
  const targetX = hotspot.x + hotspot.w / 2;
  const targetY = hotspot.y + hotspot.h / 2;
  
  const dx = targetX - gameState.cursorX;
  const dy = targetY - gameState.cursorY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // If close enough, interact
  if (distance < 15) {
    return { keyCode: 32 }; // SPACE
  }
  
  // Move towards hotspot
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? { keyCode: 39 } : { keyCode: 37 }; // RIGHT or LEFT
  } else {
    return dy > 0 ? { keyCode: 40 } : { keyCode: 38 }; // DOWN or UP
  }
}

function getRandomMovement() {
  const actions = [
    { keyCode: 37 }, // LEFT
    { keyCode: 39 }, // RIGHT
    { keyCode: 38 }, // UP
    { keyCode: 40 }, // DOWN
    { keyCode: 32 }  // SPACE
  ];
  return actions[Math.floor(Math.random() * actions.length)];
}

function getBasicTestAction(gameState) {
  // Test basic mechanics: movement, item pickup, inventory, map
  
  if (gameState.testingFrameCount < 120) {
    // Move cursor around
    const actions = [
      { keyCode: 37 }, { keyCode: 39 }, { keyCode: 38 }, { keyCode: 40 }
    ];
    return actions[Math.floor(gameState.testingFrameCount / 30) % 4];
  } else if (gameState.testingFrameCount < 180) {
    // Try to pick up torch
    return navigateToAndInteract({ x: 100, y: 150, w: 30, h: 60 });
  } else if (gameState.testingFrameCount < 240) {
    // Open inventory
    if (gameState.testingFrameCount === 180) {
      return { keyCode: 90 }; // Z
    }
  } else if (gameState.testingFrameCount < 300) {
    // Close inventory and take photo
    if (gameState.testingFrameCount === 240) {
      return { keyCode: 90 }; // Z
    } else if (gameState.testingFrameCount === 260) {
      return { keyCode: 16 }; // SHIFT
    }
  }
  
  gameState.testingFrameCount++;
  return getRandomMovement();
}

function getRandomAction(gameState) {
  const actions = [
    { keyCode: 37 }, // LEFT
    { keyCode: 39 }, // RIGHT  
    { keyCode: 38 }, // UP
    { keyCode: 40 }, // DOWN
    { keyCode: 32 }, // SPACE
    { keyCode: 90 }, // Z
    { keyCode: 16 }  // SHIFT
  ];
  
  return actions[Math.floor(Math.random() * actions.length)];
}

export function get_automated_testing_action(gameState) {
  // Initialize testing frame count
  if (gameState.testingFrameCount === undefined) {
    gameState.testingFrameCount = 0;
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

// Expose globally
window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;