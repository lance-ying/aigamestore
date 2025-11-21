// input.js - Input handling

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { advanceDialogue, confirmDialogueChoice, selectDialogueChoice } from './dialogue.js';

export function handleKeyPressed(p, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: p.key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Phase transitions
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === "START") {
      startGame(p);
    }
    return;
  }
  
  if (keyCode === 27) { // ESC
    if (gameState.gamePhase === "PLAYING") {
      gameState.gamePhase = "PAUSED";
      p.logs.game_info.push({
        data: { gamePhase: "PAUSED" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === "PAUSED") {
      gameState.gamePhase = "PLAYING";
      p.logs.game_info.push({
        data: { gamePhase: "PLAYING" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  if (keyCode === 82) { // R
    if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
      resetGame(p);
    }
    return;
  }
  
  // Gameplay controls
  if (gameState.gamePhase === "PLAYING") {
    handleGameplayInput(p, keyCode);
  }
}

function startGame(p) {
  gameState.gamePhase = "PLAYING";
  
  p.logs.game_info.push({
    data: { gamePhase: "PLAYING", message: "Game started" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function resetGame(p) {
  // Reset game state
  gameState.gamePhase = "START";
  gameState.currentLocation = "office";
  gameState.inventory = [];
  gameState.selectedInventoryIndex = -1;
  gameState.cluesFound = [];
  gameState.puzzlesSolved = [];
  gameState.dialogueHistory = {};
  gameState.hasDecodedMessage = false;
  gameState.hasInterviewedAll = false;
  gameState.hasCombinedEvidence = false;
  gameState.culpritIdentified = false;
  gameState.hoveredHotspot = null;
  gameState.showInventory = false;
  gameState.currentDialogue = null;
  gameState.dialogueChoiceIndex = 0;
  gameState.messageQueue = [];
  gameState.score = 0;
  
  // Reset locations
  const { LOCATIONS } = await import('./globals.js');
  LOCATIONS.office.unlocked = true;
  LOCATIONS.park.unlocked = true;
  LOCATIONS.dock.unlocked = false;
  LOCATIONS.warehouse.unlocked = false;
  
  // Reset puzzles
  const { PUZZLES } = await import('./globals.js');
  for (const puzzleId in PUZZLES) {
    PUZZLES[puzzleId].solved = false;
  }
  
  p.logs.game_info.push({
    data: { gamePhase: "START", message: "Game reset" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function handleGameplayInput(p, keyCode) {
  // Handle dialogue
  if (gameState.currentDialogue) {
    if (keyCode === 32) { // SPACE
      if (!advanceDialogue()) {
        confirmDialogueChoice();
      }
    } else if (keyCode === 38) { // UP
      const choices = gameState.currentDialogue.data.choices;
      if (gameState.currentDialogue.lineIndex >= gameState.currentDialogue.data.lines.length - 1) {
        gameState.currentDialogue.choiceIndex = Math.max(0, gameState.currentDialogue.choiceIndex - 1);
      }
    } else if (keyCode === 40) { // DOWN
      const choices = gameState.currentDialogue.data.choices;
      if (gameState.currentDialogue.lineIndex >= gameState.currentDialogue.data.lines.length - 1) {
        gameState.currentDialogue.choiceIndex = Math.min(choices.length - 1, gameState.currentDialogue.choiceIndex + 1);
      }
    }
    return;
  }
  
  // Inventory toggle
  if (keyCode === 90) { // Z
    gameState.showInventory = !gameState.showInventory;
    if (!gameState.showInventory) {
      gameState.selectedInventoryIndex = -1;
    }
  }
  
  // Inventory navigation
  if (gameState.showInventory) {
    if (keyCode === 37) { // LEFT
      if (gameState.selectedInventoryIndex > 0) {
        gameState.selectedInventoryIndex--;
      }
    } else if (keyCode === 39) { // RIGHT
      if (gameState.selectedInventoryIndex < gameState.inventory.length - 1) {
        gameState.selectedInventoryIndex++;
      }
    } else if (keyCode === 16) { // SHIFT
      if (gameState.selectedInventoryIndex >= 0) {
        showItemDetails();
      }
    } else if (keyCode === 32) { // SPACE - try to combine
      if (gameState.selectedInventoryIndex >= 0 && gameState.inventory.length > 1) {
        attemptCombination();
      }
    }
  } else {
    // Navigation between hotspots
    if (keyCode === 37 || keyCode === 39 || keyCode === 38 || keyCode === 40) {
      cycleHotspots(keyCode);
    } else if (keyCode === 32) { // SPACE - interact
      if (gameState.hoveredHotspot !== null) {
        interactWithCurrentHotspot();
      }
    }
  }
}

function cycleHotspots(keyCode) {
  const { LOCATIONS } = require('./globals.js');
  const location = LOCATIONS[gameState.currentLocation];
  
  if (!location || !location.hotspots) return;
  
  if (gameState.hoveredHotspot === null) {
    gameState.hoveredHotspot = 0;
  } else {
    if (keyCode === 39 || keyCode === 40) { // RIGHT or DOWN
      gameState.hoveredHotspot = (gameState.hoveredHotspot + 1) % location.hotspots.length;
    } else if (keyCode === 37 || keyCode === 38) { // LEFT or UP
      gameState.hoveredHotspot = (gameState.hoveredHotspot - 1 + location.hotspots.length) % location.hotspots.length;
    }
  }
}

function interactWithCurrentHotspot() {
  const { LOCATIONS } = require('./globals.js');
  const { interactWithHotspot } = require('./interactions.js');
  
  const location = LOCATIONS[gameState.currentLocation];
  if (gameState.hoveredHotspot !== null && location.hotspots[gameState.hoveredHotspot]) {
    const hotspot = location.hotspots[gameState.hoveredHotspot];
    interactWithHotspot(hotspot);
  }
}

function showItemDetails() {
  const { ITEMS } = require('./globals.js');
  const itemId = gameState.inventory[gameState.selectedInventoryIndex];
  const item = ITEMS[itemId];
  
  if (item) {
    gameState.messageQueue.push({
      text: `${item.name}: ${item.description}`,
      time: Date.now()
    });
  }
}

function attemptCombination() {
  const { tryItemCombination } = require('./interactions.js');
  
  if (gameState.inventory.length < 2) return;
  
  const item1 = gameState.inventory[gameState.selectedInventoryIndex];
  
  // Try combining with all other items
  for (let i = 0; i < gameState.inventory.length; i++) {
    if (i !== gameState.selectedInventoryIndex) {
      const item2 = gameState.inventory[i];
      if (tryItemCombination(item1, item2)) {
        break;
      }
    }
  }
}