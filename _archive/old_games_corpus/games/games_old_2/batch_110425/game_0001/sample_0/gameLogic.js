// gameLogic.js
import { gameState, INTERACTION_RANGE, MAX_INVENTORY_SIZE } from './globals.js';
import { createRoom1Objects, createRoom2Objects, createRoom3Objects } from './entities.js';

export function initializeGame(p) {
  gameState.currentRoom = 1;
  gameState.maxRoom = 1;
  gameState.cameraAngle = 0;
  gameState.targetCameraAngle = 0;
  gameState.inventory = [];
  gameState.selectedItemIndex = -1;
  gameState.highlightedObject = null;
  gameState.examinedObject = null;
  gameState.oculusActive = false;
  gameState.score = 0;
  gameState.animationFrame = 0;
  
  // Initialize room states
  gameState.rooms = {
    1: { completed: false, doorUnlocked: false, puzzleState: {} },
    2: { completed: false, doorUnlocked: false, puzzleState: {} },
    3: { completed: false, doorUnlocked: false, puzzleState: {} }
  };
  
  // Create all objects
  gameState.entities = [
    ...createRoom1Objects(),
    ...createRoom2Objects(),
    ...createRoom3Objects()
  ];
  
  // Initialize Room 1 puzzle state
  gameState.rooms[1].puzzleState = {
    gearCollected: false,
    mechanismFixed: false,
    gearPlaced: false
  };
  
  // Initialize Room 2 puzzle state
  gameState.rooms[2].puzzleState = {
    keyCollected: false,
    chestOpened: false,
    lensCollected: false
  };
  
  // Initialize Room 3 puzzle state
  gameState.rooms[3].puzzleState = {
    gearPlacedOnPedestal: false,
    lensPlacedOnDevice: false,
    deviceActivated: false
  };
  
  // Log game initialization
  p.logs.game_info.push({
    data: { phase: "PLAYING", room: 1 },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function updateGame(p) {
  if (gameState.gamePhase !== "PLAYING") return;
  
  gameState.animationFrame++;
  
  // Smooth camera rotation
  const angleDiff = gameState.targetCameraAngle - gameState.cameraAngle;
  if (Math.abs(angleDiff) > 1) {
    gameState.cameraAngle += angleDiff * 0.1;
  }
  
  // Normalize angle
  gameState.cameraAngle = (gameState.cameraAngle + 360) % 360;
  
  // Update highlighted object
  updateHighlightedObject();
  
  // Check win condition
  if (gameState.rooms[3].completed) {
    gameState.gamePhase = "GAME_OVER_WIN";
    gameState.score = 1000;
    p.logs.game_info.push({
      data: { phase: "GAME_OVER_WIN", score: gameState.score },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

export function updateHighlightedObject() {
  const currentRoomObjects = gameState.entities.filter(obj => 
    obj.roomId === gameState.currentRoom && !obj.collected
  );
  
  let closestObject = null;
  let closestDist = Infinity;
  
  for (const obj of currentRoomObjects) {
    if (obj.isVisible(gameState.cameraAngle)) {
      // Check if object is in view range
      const angleDiff = Math.abs(obj.angle - gameState.cameraAngle);
      const normalizedDiff = Math.min(angleDiff, 360 - angleDiff);
      
      if (normalizedDiff < 45 && normalizedDiff < closestDist) {
        // Special handling for Oculus-dependent objects
        if (obj.pastState) {
          if (gameState.oculusActive && obj.pastState.visible === true) {
            closestObject = obj;
            closestDist = normalizedDiff;
          } else if (!gameState.oculusActive && obj.presentState && obj.presentState.visible !== false) {
            closestObject = obj;
            closestDist = normalizedDiff;
          } else if (!obj.pastState.visible && !obj.presentState) {
            closestObject = obj;
            closestDist = normalizedDiff;
          }
        } else {
          closestObject = obj;
          closestDist = normalizedDiff;
        }
      }
    }
  }
  
  gameState.highlightedObject = closestObject;
}

export function interactWithObject(p) {
  if (!gameState.highlightedObject) return;
  
  const obj = gameState.highlightedObject;
  
  // If object requires an item
  if (obj.requiresItem && gameState.selectedItemIndex >= 0) {
    const selectedItem = gameState.inventory[gameState.selectedItemIndex];
    
    if (selectedItem && selectedItem.id === obj.requiresItem) {
      // Use item on object
      handleItemUse(p, obj, selectedItem);
      return;
    }
  }
  
  // Handle different object types
  switch (obj.type) {
    case "item":
      collectItem(p, obj);
      break;
    case "examine":
      examineObject(p, obj);
      break;
    case "door":
      tryOpenDoor(p, obj);
      break;
    case "mechanism":
      interactMechanism(p, obj);
      break;
  }
}

function collectItem(p, obj) {
  if (gameState.inventory.length >= MAX_INVENTORY_SIZE) return;
  if (obj.locked) return;
  
  // Check Oculus requirements
  if (obj.pastState && obj.pastState.visible === true && !gameState.oculusActive) {
    return; // Can only collect in past
  }
  
  obj.collected = true;
  const item = { id: obj.id, name: obj.name, description: obj.description };
  gameState.inventory.push(item);
  gameState.score += 50;
  
  // Update puzzle state
  if (obj.roomId === 1 && obj.id === "gear1") {
    gameState.rooms[1].puzzleState.gearCollected = true;
  } else if (obj.roomId === 2 && obj.id === "key1") {
    gameState.rooms[2].puzzleState.keyCollected = true;
  }
  
  p.logs.game_info.push({
    data: { action: "collected", item: obj.name, room: gameState.currentRoom },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function examineObject(p, obj) {
  gameState.examinedObject = obj;
  gameState.score += 10;
  
  p.logs.game_info.push({
    data: { action: "examined", object: obj.name, room: gameState.currentRoom },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function tryOpenDoor(p, obj) {
  const room = gameState.rooms[obj.roomId];
  
  if (room.doorUnlocked) {
    // Move to next room
    gameState.currentRoom++;
    if (gameState.currentRoom > gameState.maxRoom) {
      gameState.maxRoom = gameState.currentRoom;
    }
    gameState.cameraAngle = 0;
    gameState.targetCameraAngle = 0;
    gameState.examinedObject = null;
    gameState.score += 100;
    
    p.logs.game_info.push({
      data: { action: "entered_room", room: gameState.currentRoom },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

function interactMechanism(p, obj) {
  if (obj.requiresItem && gameState.selectedItemIndex < 0) {
    // Show message that item is required
    return;
  }
}

function handleItemUse(p, obj, item) {
  // Room 1: Place gear on mechanism
  if (obj.roomId === 1 && obj.id === "mech1" && item.id === "gear1") {
    // First need to fix mechanism using Oculus
    if (!gameState.rooms[1].puzzleState.mechanismFixed) return;
    
    obj.activated = true;
    gameState.rooms[1].puzzleState.gearPlaced = true;
    gameState.rooms[1].completed = true;
    gameState.rooms[1].doorUnlocked = true;
    
    // Remove item from inventory
    gameState.inventory.splice(gameState.selectedItemIndex, 1);
    gameState.selectedItemIndex = -1;
    gameState.score += 150;
    
    p.logs.game_info.push({
      data: { action: "puzzle_solved", room: 1 },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  // Room 2: Open chest with key
  else if (obj.roomId === 2 && obj.id === "chest1" && item.id === "key1") {
    obj.activated = true;
    obj.locked = false;
    gameState.rooms[2].puzzleState.chestOpened = true;
    
    // Add lens to inventory
    const lens = gameState.entities.find(e => e.id === "lens1");
    if (lens) {
      lens.collected = true;
      lens.locked = false;
      const lensItem = { id: lens.id, name: lens.name, description: lens.description };
      gameState.inventory.push(lensItem);
      gameState.rooms[2].puzzleState.lensCollected = true;
    }
    
    gameState.rooms[2].completed = true;
    gameState.rooms[2].doorUnlocked = true;
    
    // Remove key from inventory
    gameState.inventory.splice(gameState.selectedItemIndex, 1);
    gameState.selectedItemIndex = -1;
    gameState.score += 150;
    
    p.logs.game_info.push({
      data: { action: "puzzle_solved", room: 2 },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  // Room 3: Place gear on pedestal
  else if (obj.roomId === 3 && obj.id === "pedestal1" && item.id === "gear1") {
    obj.activated = true;
    gameState.rooms[3].puzzleState.gearPlacedOnPedestal = true;
    
    gameState.inventory.splice(gameState.selectedItemIndex, 1);
    gameState.selectedItemIndex = -1;
    gameState.score += 100;
    
    // Unlock device
    const device = gameState.entities.find(e => e.id === "device1");
    if (device) device.locked = false;
    
    p.logs.game_info.push({
      data: { action: "gear_placed_pedestal", room: 3 },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  // Room 3: Place lens on device
  else if (obj.roomId === 3 && obj.id === "device1" && item.id === "lens1") {
    if (!gameState.rooms[3].puzzleState.gearPlacedOnPedestal) return;
    
    obj.activated = true;
    gameState.rooms[3].puzzleState.lensPlacedOnDevice = true;
    gameState.rooms[3].puzzleState.deviceActivated = true;
    gameState.rooms[3].completed = true;
    
    gameState.inventory.splice(gameState.selectedItemIndex, 1);
    gameState.selectedItemIndex = -1;
    gameState.score += 200;
    
    p.logs.game_info.push({
      data: { action: "final_puzzle_solved", room: 3 },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

export function fixMechanismInPast(p) {
  // Special interaction: Fix mechanism in Room 1 using Oculus
  if (gameState.currentRoom !== 1 || !gameState.oculusActive) return;
  
  const mechanism = gameState.entities.find(e => e.id === "mech1");
  if (!mechanism) return;
  
  if (gameState.highlightedObject === mechanism) {
    if (!gameState.rooms[1].puzzleState.mechanismFixed) {
      gameState.rooms[1].puzzleState.mechanismFixed = true;
      mechanism.locked = true; // Still needs gear
      gameState.score += 75;
      
      p.logs.game_info.push({
        data: { action: "mechanism_fixed_in_past", room: 1 },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
}