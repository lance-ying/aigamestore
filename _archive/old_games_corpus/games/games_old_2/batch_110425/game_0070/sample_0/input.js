// input.js - Input handling

import { gameState, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN } from './globals.js';
import { getRoomData } from './rooms.js';
import { startGame, pauseGame, unpauseGame, restartGame } from './game_logic.js';

let p;

export function initInput(p5Instance) {
  p = p5Instance;
}

export function handleKeyPressed() {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: p.key, keyCode: p.keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Game phase transitions
  if (p.keyCode === 13) { // ENTER
    if (gameState.gamePhase === PHASE_START) {
      startGame();
    }
    return;
  }
  
  if (p.keyCode === 27) { // ESC
    if (gameState.gamePhase === PHASE_PLAYING) {
      pauseGame();
    } else if (gameState.gamePhase === PHASE_PAUSED) {
      unpauseGame();
    }
    return;
  }
  
  if (p.keyCode === 82) { // R
    restartGame();
    return;
  }
  
  // Gameplay controls
  if (gameState.gamePhase === PHASE_PLAYING) {
    handleGameplayInput();
  }
}

function handleGameplayInput() {
  // Inventory toggle
  if (p.keyCode === 90) { // Z
    gameState.inventoryOpen = !gameState.inventoryOpen;
    if (!gameState.inventoryOpen) {
      gameState.selectedInventoryIndex = -1;
    }
    return;
  }
  
  // Camera
  if (p.keyCode === 16) { // SHIFT
    takePhoto();
    return;
  }
  
  // Handle based on current mode
  if (gameState.inventoryOpen) {
    handleInventoryInput();
  } else if (gameState.mapOpen) {
    handleMapInput();
  } else {
    handleRoomInput();
  }
}

function handleRoomInput() {
  const moveSpeed = 8;
  
  // Arrow keys to move cursor
  if (p.keyCode === 37) { // LEFT
    gameState.cursorX = Math.max(20, gameState.cursorX - moveSpeed);
  } else if (p.keyCode === 39) { // RIGHT
    gameState.cursorX = Math.min(580, gameState.cursorX + moveSpeed);
  } else if (p.keyCode === 38) { // UP
    gameState.cursorY = Math.max(40, gameState.cursorY - moveSpeed);
  } else if (p.keyCode === 40) { // DOWN
    gameState.cursorY = Math.min(350, gameState.cursorY + moveSpeed);
  }
  
  // Space to interact
  if (p.keyCode === 32) { // SPACE
    if (gameState.hoveredButton) {
      activateButton(gameState.hoveredButton);
    } else if (gameState.hoveredHotspot) {
      interactWithHotspot(gameState.hoveredHotspot);
    }
  }
  
  updateHoveredElements();
}

function handleInventoryInput() {
  if (p.keyCode === 37) { // LEFT
    if (gameState.selectedInventoryIndex > 0) {
      gameState.selectedInventoryIndex--;
    }
  } else if (p.keyCode === 39) { // RIGHT
    if (gameState.selectedInventoryIndex < gameState.inventory.length - 1) {
      gameState.selectedInventoryIndex++;
    }
  } else if (p.keyCode === 38) { // UP
    gameState.selectedInventoryIndex = Math.max(0, gameState.selectedInventoryIndex - 4);
  } else if (p.keyCode === 40) { // DOWN
    gameState.selectedInventoryIndex = Math.min(gameState.inventory.length - 1, gameState.selectedInventoryIndex + 4);
  } else if (p.keyCode === 32) { // SPACE
    if (gameState.selectedInventoryIndex >= 0) {
      useSelectedItem();
    }
  }
  
  // Ensure valid selection
  if (gameState.selectedInventoryIndex < 0 && gameState.inventory.length > 0) {
    gameState.selectedInventoryIndex = 0;
  }
}

function handleMapInput() {
  if (p.keyCode === 32) { // SPACE
    gameState.mapOpen = false;
  }
}

function updateHoveredElements() {
  const room = getRoomData(gameState.currentRoom);
  
  // Check hotspots
  gameState.hoveredHotspot = null;
  for (let hotspot of room.hotspots) {
    if (hotspot.hidden) continue;
    if (hotspot.type === "item" && hotspot.collected) continue;
    
    if (gameState.cursorX >= hotspot.x && gameState.cursorX <= hotspot.x + hotspot.w &&
        gameState.cursorY >= hotspot.y && gameState.cursorY <= hotspot.y + hotspot.h) {
      gameState.hoveredHotspot = hotspot.id;
      break;
    }
  }
  
  // Check UI buttons
  const buttons = [
    { id: "inventory", x: 20, y: 360, w: 80, h: 25 },
    { id: "map", x: 110, y: 360, w: 80, h: 25 },
    { id: "camera", x: 200, y: 360, w: 100, h: 25 },
    { id: "hint", x: 310, y: 360, w: 80, h: 25 }
  ];
  
  gameState.hoveredButton = null;
  for (let btn of buttons) {
    if (gameState.cursorX >= btn.x && gameState.cursorX <= btn.x + btn.w &&
        gameState.cursorY >= btn.y && gameState.cursorY <= btn.y + btn.h) {
      gameState.hoveredButton = btn.id;
      break;
    }
  }
}

function interactWithHotspot(hotspotId) {
  const room = getRoomData(gameState.currentRoom);
  const hotspot = room.hotspots.find(h => h.id === hotspotId);
  
  if (!hotspot) return;
  
  if (hotspot.type === "door") {
    if (hotspot.locked) {
      // Check if player has required key
      if (hotspot.requires && gameState.player.hasItem(hotspot.requires)) {
        hotspot.locked = false;
        gameState.unlockedDoors.add(hotspotId);
        gameState.player.removeItem(hotspot.requires);
        gameState.score += 50;
        changeRoom(hotspot.target);
      }
    } else {
      changeRoom(hotspot.target);
    }
  } else if (hotspot.type === "item") {
    if (!hotspot.collected && gameState.player.addItem(hotspot.item)) {
      hotspot.collected = true;
      gameState.score += 20;
    }
  } else if (hotspot.type === "examine") {
    // Show examination result - for puzzle solving
    if (hotspot.revealPuzzle) {
      const { revealHiddenItem } = require('./puzzles.js');
      revealHiddenItem(gameState.currentRoom, hotspot.revealPuzzle);
    }
  } else if (hotspot.type === "container") {
    if (hotspot.locked) {
      if (hotspot.requires && gameState.player.hasItem(hotspot.requires)) {
        hotspot.locked = false;
        gameState.player.removeItem(hotspot.requires);
        if (hotspot.contains) {
          gameState.player.addItem(hotspot.contains);
        }
        gameState.score += 50;
      }
    }
  } else if (hotspot.type === "puzzle") {
    // Trigger puzzle interaction
    if (gameState.selectedInventoryIndex >= 0) {
      tryUsePuzzle(hotspot);
    }
  }
}

function tryUsePuzzle(hotspot) {
  const { solvePuzzle } = require('./puzzles.js');
  
  if (!hotspot.requires) return;
  
  // Check if player has all required items
  const hasAllItems = hotspot.requires.every(itemId => gameState.player.hasItem(itemId));
  
  if (hasAllItems) {
    // Solve puzzle
    if (solvePuzzle(hotspot.puzzleId, hotspot.requires)) {
      // Remove used items
      hotspot.requires.forEach(itemId => {
        gameState.player.removeItem(itemId);
      });
    }
  }
}

function useSelectedItem() {
  if (gameState.selectedInventoryIndex < 0) return;
  
  const itemId = gameState.inventory[gameState.selectedInventoryIndex];
  
  // Check if we can use this item in current context
  // For now, just close inventory - items are used by clicking on hotspots
  gameState.inventoryOpen = false;
  gameState.selectedInventoryIndex = -1;
}

function changeRoom(roomId) {
  gameState.currentRoom = roomId;
  gameState.visitedRooms.add(roomId);
  gameState.roomsExplored = gameState.visitedRooms.size;
  gameState.score += 10;
  
  // Center cursor
  gameState.cursorX = 300;
  gameState.cursorY = 200;
}

function activateButton(buttonId) {
  if (buttonId === "inventory") {
    gameState.inventoryOpen = !gameState.inventoryOpen;
    if (!gameState.inventoryOpen) {
      gameState.selectedInventoryIndex = -1;
    }
  } else if (buttonId === "map") {
    gameState.mapOpen = !gameState.mapOpen;
  } else if (buttonId === "camera") {
    takePhoto();
  } else if (buttonId === "hint") {
    showHint();
  }
}

function takePhoto() {
  if (gameState.photos.length < gameState.maxPhotos) {
    gameState.photos.push({
      room: gameState.currentRoom,
      frame: p.frameCount
    });
    gameState.score += 5;
  }
}

function showHint() {
  if (gameState.hintCooldown > 0) return;
  
  const { getCurrentHint } = require('./puzzles.js');
  const hint = getCurrentHint();
  
  // Show hint (in a real game, would display in UI)
  gameState.hintCooldown = gameState.hintCooldownMax;
  gameState.hintsUsed++;
}

export { updateHoveredElements };