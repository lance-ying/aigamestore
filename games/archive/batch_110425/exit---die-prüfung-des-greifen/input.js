// input.js - Input handling

import { gameState } from './globals.js';
import {
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE,
  KEY_ENTER,
  KEY_ESC,
  KEY_R,
  KEY_SPACE,
  KEY_Z,
  KEY_SHIFT,
  KEY_LEFT,
  KEY_RIGHT,
  KEY_UP,
  KEY_DOWN
} from './globals.js';
import { getCurrentRoom } from './room.js';

export function handleKeyPress(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: 'keyPressed',
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });

  // Phase transitions
  if (keyCode === KEY_ENTER && gameState.gamePhase === PHASE_START) {
    gameState.gamePhase = PHASE_PLAYING;
    gameState.gameStartTime = Date.now();
    p.logs.game_info.push({
      data: { phase: PHASE_PLAYING, event: 'game_started' },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }

  if (keyCode === KEY_R && (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === PHASE_GAME_OVER_LOSE)) {
    resetGame();
    p.logs.game_info.push({
      data: { phase: PHASE_START, event: 'game_restarted' },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }

  if (keyCode === KEY_ESC && gameState.gamePhase === PHASE_PLAYING) {
    gameState.gamePhase = PHASE_PAUSED;
    p.logs.game_info.push({
      data: { phase: PHASE_PAUSED, event: 'game_paused' },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }

  if (keyCode === KEY_ESC && gameState.gamePhase === PHASE_PAUSED) {
    gameState.gamePhase = PHASE_PLAYING;
    p.logs.game_info.push({
      data: { phase: PHASE_PLAYING, event: 'game_resumed' },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }

  // Gameplay inputs (only during PLAYING phase)
  if (gameState.gamePhase !== PHASE_PLAYING) return;

  // Inventory menu
  if (keyCode === KEY_Z) {
    gameState.showInventory = !gameState.showInventory;
    return;
  }

  // Handle inventory selection
  if (gameState.showInventory) {
    if (keyCode === KEY_LEFT) {
      gameState.inventoryIndex = Math.max(0, gameState.inventoryIndex - 1);
    } else if (keyCode === KEY_RIGHT) {
      gameState.inventoryIndex = Math.min(gameState.inventory.length - 1, gameState.inventoryIndex + 1);
    } else if (keyCode === KEY_UP) {
      gameState.inventoryIndex = Math.max(0, gameState.inventoryIndex - 3);
    } else if (keyCode === KEY_DOWN) {
      gameState.inventoryIndex = Math.min(gameState.inventory.length - 1, gameState.inventoryIndex + 3);
    } else if (keyCode === KEY_SPACE && p.keyIsDown(KEY_SHIFT)) {
      // Select item with Shift+Space
      if (gameState.inventory.length > 0) {
        gameState.selectedItem = gameState.inventory[gameState.inventoryIndex];
        gameState.showInventory = false;
      }
    }
    return;
  }

  // Hotspot navigation
  const currentRoom = getCurrentRoom();
  if (!currentRoom) return;

  const numHotspots = currentRoom.hotspots.length;

  if (keyCode === KEY_LEFT) {
    gameState.currentHotspot = (gameState.currentHotspot - 1 + numHotspots) % numHotspots;
  } else if (keyCode === KEY_RIGHT) {
    gameState.currentHotspot = (gameState.currentHotspot + 1) % numHotspots;
  } else if (keyCode === KEY_UP) {
    gameState.currentHotspot = (gameState.currentHotspot - 2 + numHotspots) % numHotspots;
  } else if (keyCode === KEY_DOWN) {
    gameState.currentHotspot = (gameState.currentHotspot + 2) % numHotspots;
  } else if (keyCode === KEY_SPACE) {
    // Interact with current hotspot
    currentRoom.interactWithHotspot(gameState.currentHotspot);
    gameState.lastActionTime = Date.now();
  }
}

function resetGame() {
  gameState.currentRoom = 0;
  gameState.score = 0;
  gameState.puzzlesSolved = 0;
  gameState.gamePhase = PHASE_START;
  gameState.inventory = [];
  gameState.selectedItem = null;
  gameState.currentHotspot = 0;
  gameState.examiningObject = null;
  gameState.showInventory = false;
  gameState.inventoryIndex = 0;
  gameState.messages = [];
  gameState.messageTimer = 0;
  gameState.unlockedRooms = [0];
  gameState.collectedItems = new Set();
  gameState.solvedPuzzles = new Set();

  // Reset room hotspots
  gameState.rooms.forEach((room, roomIndex) => {
    const originalRoom = require('./room_data.js').ROOM_DEFINITIONS[roomIndex];
    if (originalRoom) {
      room.hotspots = originalRoom.hotspots.map(h => ({ ...h }));
    }
  });
}

export function applyAutomatedAction(action) {
  if (!action) return;

  const p = window.gameInstance;

  if (action.keyPressed) {
    handleKeyPress(p, String.fromCharCode(action.keyPressed), action.keyPressed);
  }
}