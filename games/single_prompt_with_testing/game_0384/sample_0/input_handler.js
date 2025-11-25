// input_handler.js
import { gameState, GAME_PHASES, ROOMS } from './globals.js';
import { interact, useSedative } from './game_logic.js';
import { combineItems } from './inventory.js';

export function handleKeyPressed(p, key, keyCode, rooms) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Phase change controls
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === GAME_PHASES.START) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { gamePhase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  if (keyCode === 27) { // ESC
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.gamePhase = GAME_PHASES.PAUSED;
      p.noLoop();
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.loop();
    }
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }
  
  if (keyCode === 82) { // R
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      resetGame(rooms);
      p.logs.game_info.push({
        data: { gamePhase: gameState.gamePhase, action: "restart" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  // Gameplay controls
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  // Inventory controls
  if (keyCode === 90) { // Z
    gameState.inventoryOpen = !gameState.inventoryOpen;
    if (gameState.inventoryOpen) {
      gameState.selectedInventoryIndex = gameState.inventory.length > 0 ? 0 : -1;
    } else {
      gameState.selectedInventoryIndex = -1;
    }
    return;
  }
  
  if (gameState.inventoryOpen) {
    handleInventoryInput(keyCode);
    return;
  }
  
  // Movement and interaction
  if (keyCode === 32) { // SPACE
    const currentRoom = rooms[gameState.currentRoom];
    const nearest = currentRoom.getNearestInteractable(gameState.player.x, gameState.player.y);
    if (nearest) {
      interact(nearest, rooms);
    }
    
    // Check for sedative use
    if (keyCode === 32 && p.keyIsDown(16)) { // SPACE + SHIFT
      useSedative();
    }
    return;
  }
  
  // Arrow keys for room navigation
  if (keyCode >= 37 && keyCode <= 40) {
    const currentRoom = rooms[gameState.currentRoom];
    const direction = ["left", "up", "right", "down"][keyCode - 37];
    
    if (currentRoom.exits[direction]) {
      const newRoom = currentRoom.exits[direction].roomName;
      changeRoom(newRoom, rooms);
    }
  }
}

function handleInventoryInput(keyCode) {
  if (gameState.inventory.length === 0) return;
  
  if (keyCode === 37) { // LEFT
    gameState.selectedInventoryIndex = Math.max(0, gameState.selectedInventoryIndex - 1);
  } else if (keyCode === 39) { // RIGHT
    gameState.selectedInventoryIndex = Math.min(gameState.inventory.length - 1, gameState.selectedInventoryIndex + 1);
  } else if (keyCode === 38) { // UP
    gameState.selectedInventoryIndex = Math.max(0, gameState.selectedInventoryIndex - 4);
  } else if (keyCode === 40) { // DOWN
    gameState.selectedInventoryIndex = Math.min(gameState.inventory.length - 1, gameState.selectedInventoryIndex + 4);
  } else if (keyCode === 16) { // SHIFT - combine items
    // Try to combine with adjacent items
    const idx = gameState.selectedInventoryIndex;
    if (idx >= 0 && idx < gameState.inventory.length - 1) {
      const item1 = gameState.inventory[idx];
      const item2 = gameState.inventory[idx + 1];
      combineItems(item1, item2);
      gameState.selectedInventoryIndex = Math.min(idx, gameState.inventory.length - 1);
    }
  }
}

function changeRoom(newRoom, rooms) {
  gameState.currentRoom = newRoom;
  
  // Position player at opposite entrance
  const room = rooms[newRoom];
  gameState.player.x = 300;
  gameState.player.y = 200;
  gameState.player.targetX = 300;
  gameState.player.targetY = 200;
}

function resetGame(rooms) {
  // Reset game state
  gameState.gamePhase = GAME_PHASES.START;
  gameState.currentRoom = ROOMS.MAIN;
  gameState.timeRemaining = 180;
  gameState.inventory = [];
  gameState.selectedInventoryIndex = -1;
  gameState.inventoryOpen = false;
  gameState.score = 0;
  gameState.usedSedative = false;
  gameState.framesSinceLastSecond = 0;
  
  for (const key in gameState.securedPoints) {
    gameState.securedPoints[key] = false;
  }
  
  // Reset all interactables
  for (const roomName in rooms) {
    const room = rooms[roomName];
    for (const interactable of room.interactables) {
      interactable.visible = true;
      interactable.collected = false;
      interactable.secured = false;
    }
  }
  
  // Reset player position
  if (gameState.player) {
    gameState.player.x = 300;
    gameState.player.y = 250;
    gameState.player.targetX = 300;
    gameState.player.targetY = 250;
  }
}