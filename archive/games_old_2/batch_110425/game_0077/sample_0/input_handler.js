// input_handler.js - Handles keyboard input

import { gameState, GAME_PHASES } from './globals.js';
import { getVisibleHotspots, interactWithHotspot, examineItem } from './location_manager.js';
import { gameInstance } from './game.js';

export function handleKeyPressed(p) {
  const key = p.key;
  const keyCode = p.keyCode;
  
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
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
      resumeGame(p);
    }
    return;
  }
  
  if (keyCode === 82) { // R
    restartGame(p);
    return;
  }
  
  // Gameplay controls (only in PLAYING phase)
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  if (gameState.controlMode !== "HUMAN") return;
  
  handleGameplayInput(keyCode, p);
}

function handleGameplayInput(keyCode, p) {
  const visibleHotspots = getVisibleHotspots();
  
  switch (keyCode) {
    case 37: // LEFT
      if (gameState.selectedInventoryIndex >= 0) {
        gameState.selectedInventoryIndex = Math.max(0, gameState.selectedInventoryIndex - 1);
      } else {
        gameState.selectedHotspotIndex = Math.max(0, gameState.selectedHotspotIndex - 1);
      }
      break;
      
    case 39: // RIGHT
      if (gameState.selectedInventoryIndex >= 0) {
        gameState.selectedInventoryIndex = Math.min(gameState.inventory.length - 1, gameState.selectedInventoryIndex + 1);
      } else {
        gameState.selectedHotspotIndex = Math.min(visibleHotspots.length - 1, gameState.selectedHotspotIndex + 1);
      }
      break;
      
    case 38: // UP
      gameState.selectedHotspotIndex = Math.max(0, gameState.selectedHotspotIndex - 1);
      break;
      
    case 40: // DOWN
      gameState.selectedHotspotIndex = Math.min(visibleHotspots.length - 1, gameState.selectedHotspotIndex + 1);
      break;
      
    case 32: // SPACE - Interact
      if (gameState.selectedHotspotIndex >= 0 && gameState.selectedHotspotIndex < visibleHotspots.length) {
        const hotspot = visibleHotspots[gameState.selectedHotspotIndex];
        interactWithHotspot(hotspot, p);
      }
      break;
      
    case 16: // SHIFT - Cycle inventory
      if (gameState.inventory.length > 0) {
        if (gameState.selectedInventoryIndex === -1) {
          gameState.selectedInventoryIndex = 0;
        } else {
          gameState.selectedInventoryIndex = (gameState.selectedInventoryIndex + 1) % gameState.inventory.length;
        }
      }
      break;
      
    case 90: // Z - Examine
      if (gameState.selectedInventoryIndex >= 0 && gameState.selectedInventoryIndex < gameState.inventory.length) {
        const itemName = gameState.inventory[gameState.selectedInventoryIndex];
        const description = examineItem(itemName);
        p.logs.game_info.push({
          data: `Examined: ${itemName} - ${description}`,
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
      break;
  }
}

function startGame(p) {
  gameState.gamePhase = GAME_PHASES.PLAYING;
  p.logs.game_info.push({
    data: "Game started",
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  p.loop();
}

function pauseGame(p) {
  gameState.gamePhase = GAME_PHASES.PAUSED;
  p.logs.game_info.push({
    data: "Game paused",
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function resumeGame(p) {
  gameState.gamePhase = GAME_PHASES.PLAYING;
  p.logs.game_info.push({
    data: "Game resumed",
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function restartGame(p) {
  // Reset game state
  gameState.gamePhase = GAME_PHASES.START;
  gameState.currentLocation = "beach";
  gameState.selectedHotspotIndex = 0;
  gameState.selectedInventoryIndex = -1;
  gameState.inventory = [];
  gameState.discoveredLocations = ["beach"];
  gameState.puzzlesSolved = [];
  gameState.collectedItems = [];
  gameState.codes = { lighthouse: "", templeBox: "" };
  gameState.objectStates = {
    beachDriftwood: false,
    beachShell: false,
    forestKey: false,
    lighthouseMap: false,
    templeDoor: false,
    templeGem: false,
    caveCrystal: false,
    altarActivated: false
  };
  gameState.score = 0;
  gameState.itemsCollected = 0;
  gameState.puzzlesCompleted = 0;
  gameState.hasWon = false;
  
  // Reset location states
  Object.values(LOCATIONS).forEach(location => {
    location.hotspots.forEach(hotspot => {
      if (hotspot.type === "item") {
        hotspot.collected = false;
      }
      if (hotspot.hidden !== undefined && hotspot.id !== "key" && hotspot.id !== "map" && hotspot.id !== "gem") {
        hotspot.hidden = true;
      }
      if (hotspot.type === "exit" && hotspot.target !== "beach" && hotspot.target !== "forest") {
        hotspot.unlocked = false;
      }
    });
  });
  
  // Reset specific unlocks
  const forestToLighthouse = LOCATIONS.forest.hotspots.find(h => h.id === "toLighthouse");
  if (forestToLighthouse) forestToLighthouse.unlocked = false;
  
  const lighthouseToTemple = LOCATIONS.lighthouse.hotspots.find(h => h.id === "toTemple");
  if (lighthouseToTemple) lighthouseToTemple.unlocked = false;
  
  const templeToCave = LOCATIONS.temple.hotspots.find(h => h.id === "toCave");
  if (templeToCave) templeToCave.unlocked = false;
  
  p.logs.game_info.push({
    data: "Game restarted",
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function processAutomatedInput(action, p) {
  if (!action || gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  handleGameplayInput(action.keyCode, p);
}