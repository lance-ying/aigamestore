// input_handler.js - Input handling

import { gameState, GAME_PHASES } from './globals.js';
import { handleInteraction, changeScene, getAvailableHotspots, getAvailableExits } from './game_logic.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  gameState.framesSinceLastInput = 0;
  
  // Game phase transitions
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === GAME_PHASES.START) {
      startGame(p);
    }
    return;
  }
  
  if (keyCode === 27) { // ESC
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      pauseGame(p);
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      unpauseGame(p);
    }
    return;
  }
  
  if (keyCode === 82) { // R
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      restartGame(p);
    }
    return;
  }
  
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  // Gameplay controls
  if (keyCode === 90) { // Z - Toggle inventory
    gameState.showInventory = !gameState.showInventory;
    if (gameState.showInventory) {
      gameState.showJournal = false;
      gameState.selectedInventoryItem = gameState.inventory.length > 0 ? 0 : null;
    }
    return;
  }
  
  if (keyCode === 16) { // SHIFT - Toggle journal
    gameState.showJournal = !gameState.showJournal;
    if (gameState.showJournal) {
      gameState.showInventory = false;
    }
    return;
  }
  
  if (keyCode === 32) { // SPACE - Interact
    handleInteraction(p);
    return;
  }
  
  // Arrow key navigation
  if (gameState.showInventory) {
    handleInventoryNavigation(keyCode);
  } else {
    handleSceneNavigation(p, keyCode);
  }
}

function handleInventoryNavigation(keyCode) {
  if (gameState.inventory.length === 0) return;
  
  const itemsPerRow = 4;
  const currentIndex = gameState.selectedInventoryItem || 0;
  const totalItems = gameState.inventory.length;
  
  switch (keyCode) {
    case 37: // LEFT
      gameState.selectedInventoryItem = currentIndex > 0 ? currentIndex - 1 : totalItems - 1;
      break;
    case 39: // RIGHT
      gameState.selectedInventoryItem = (currentIndex + 1) % totalItems;
      break;
    case 38: // UP
      gameState.selectedInventoryItem = currentIndex - itemsPerRow >= 0 ? 
        currentIndex - itemsPerRow : currentIndex;
      break;
    case 40: // DOWN
      gameState.selectedInventoryItem = currentIndex + itemsPerRow < totalItems ? 
        currentIndex + itemsPerRow : currentIndex;
      break;
  }
}

function handleSceneNavigation(p, keyCode) {
  const availableHotspots = getAvailableHotspots();
  const availableExits = getAvailableExits();
  
  switch (keyCode) {
    case 37: // LEFT
      if (availableExits.length > 0) {
        const leftExit = availableExits.find(e => e.direction === "left");
        if (leftExit) changeScene(leftExit.to);
      }
      break;
    
    case 39: // RIGHT
      if (availableExits.length > 0) {
        const rightExit = availableExits.find(e => e.direction === "right");
        if (rightExit) changeScene(rightExit.to);
      }
      break;
    
    case 38: // UP
      if (availableHotspots.length > 0) {
        if (gameState.selectedHotspot === null) {
          gameState.selectedHotspot = 0;
        } else {
          gameState.selectedHotspot = (gameState.selectedHotspot - 1 + availableHotspots.length) % availableHotspots.length;
        }
      } else {
        const forwardExit = availableExits.find(e => e.direction === "forward");
        if (forwardExit) changeScene(forwardExit.to);
      }
      break;
    
    case 40: // DOWN
      if (availableHotspots.length > 0) {
        if (gameState.selectedHotspot === null) {
          gameState.selectedHotspot = 0;
        } else {
          gameState.selectedHotspot = (gameState.selectedHotspot + 1) % availableHotspots.length;
        }
      } else {
        const backExit = availableExits.find(e => e.direction === "back");
        if (backExit) changeScene(backExit.to);
      }
      break;
  }
}

function startGame(p) {
  gameState.gamePhase = GAME_PHASES.PLAYING;
  
  p.logs.game_info.push({
    data: { phase: "PLAYING" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function pauseGame(p) {
  gameState.gamePhase = GAME_PHASES.PAUSED;
  
  p.logs.game_info.push({
    data: { phase: "PAUSED" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function unpauseGame(p) {
  gameState.gamePhase = GAME_PHASES.PLAYING;
  
  p.logs.game_info.push({
    data: { phase: "PLAYING" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function restartGame(p) {
  // Reset game state
  gameState.currentScene = "entrance";
  gameState.selectedHotspot = null;
  gameState.selectedInventoryItem = null;
  gameState.inventory = [];
  gameState.journal = [];
  gameState.unlockedScenes = ["entrance"];
  gameState.puzzlesSolved = [];
  gameState.artifacts = 0;
  gameState.showInventory = false;
  gameState.showJournal = false;
  gameState.score = 0;
  gameState.hotspotSelectionIndex = 0;
  gameState.inventorySelectionIndex = 0;
  gameState.gamePhase = GAME_PHASES.START;
  
  // Reset player
  if (gameState.player) {
    gameState.player.x = 300;
    gameState.player.y = 350;
    gameState.player.scene = "entrance";
  }
  
  p.logs.game_info.push({
    data: { phase: "START" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}