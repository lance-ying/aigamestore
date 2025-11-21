// input_handler.js - Input handling for different control modes

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { getCurrentLocation, switchLocation, getLocationsList } from './location_manager.js';
import { checkDeductions, makeDeduction, checkWinCondition } from './game_logic.js';

let selectedLocationIndex = 0;
let selectedObjectIndex = 0;
let isSelectingLocation = false;

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  if (gameState.gamePhase === "START") {
    if (keyCode === 13) { // ENTER
      startGame(p);
    }
  } else if (gameState.gamePhase === "PLAYING") {
    if (keyCode === 27) { // ESC
      pauseGame(p);
    } else if (keyCode === 90) { // Z
      toggleInventory();
    } else if (gameState.showingDialogue) {
      handleDialogueInput(keyCode);
    } else if (gameState.showInventory) {
      handleInventoryInput(keyCode);
    } else if (isSelectingLocation) {
      handleLocationSelectionInput(keyCode);
    } else {
      handleGameplayInput(p, keyCode);
    }
  } else if (gameState.gamePhase === "PAUSED") {
    if (keyCode === 27) { // ESC
      unpauseGame(p);
    }
  } else if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
    if (keyCode === 82) { // R
      restartGame(p);
    }
  }
}

function startGame(p) {
  gameState.gamePhase = "PLAYING";
  p.logs.game_info.push({
    data: { phase: "PLAYING", action: "game_started" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function pauseGame(p) {
  gameState.gamePhase = "PAUSED";
  p.logs.game_info.push({
    data: { phase: "PAUSED" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function unpauseGame(p) {
  gameState.gamePhase = "PLAYING";
  p.logs.game_info.push({
    data: { phase: "PLAYING", action: "game_unpaused" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function restartGame(p) {
  gameState.gamePhase = "START";
  // Reset game state
  gameState.currentChapter = 1;
  gameState.currentLocation = "TOWN_SQUARE";
  gameState.inventory = [];
  gameState.deductions = [];
  gameState.dialogueHistory = {};
  gameState.interactedObjects = [];
  gameState.showingDialogue = false;
  gameState.currentDialogue = null;
  gameState.showInventory = false;
  gameState.unlockedLocations = ["TOWN_SQUARE"];
  gameState.killerIdentified = false;
  gameState.finalDeductionMade = false;
  gameState.menuSelection = 0;
  selectedLocationIndex = 0;
  selectedObjectIndex = 0;
  isSelectingLocation = false;
  
  // Reset suspects
  for (let id in gameState.suspects) {
    gameState.suspects[id].interviewed = false;
    gameState.suspects[id].suspicious = 0;
  }
  
  // Reset chapter objectives
  for (let chapter in gameState.chapterObjectives) {
    gameState.chapterObjectives[chapter].completed = false;
  }
  
  p.logs.game_info.push({
    data: { phase: "START", action: "game_restarted" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function toggleInventory() {
  gameState.showInventory = !gameState.showInventory;
  if (gameState.showInventory) {
    gameState.menuSelection = 0;
  }
}

function handleDialogueInput(keyCode) {
  if (keyCode === 32 || keyCode === 16) { // SPACE or SHIFT
    gameState.showingDialogue = false;
    gameState.currentDialogue = null;
  }
}

function handleInventoryInput(keyCode) {
  if (keyCode === 90) { // Z - close
    gameState.showInventory = false;
  } else if (keyCode === 37 || keyCode === 39) { // LEFT/RIGHT arrows
    gameState.menuSelection = 1 - gameState.menuSelection;
  } else if (keyCode === 32 && gameState.menuSelection === 1) { // SPACE on deductions
    // Try to make a deduction
    const availableDeduction = checkDeductions();
    if (availableDeduction) {
      const success = makeDeduction(availableDeduction);
      if (success && checkWinCondition()) {
        gameState.gamePhase = "GAME_OVER_WIN";
      }
    }
  }
}

function handleLocationSelectionInput(keyCode) {
  const locations = getLocationsList();
  
  if (keyCode === 38) { // UP
    selectedLocationIndex = Math.max(0, selectedLocationIndex - 1);
  } else if (keyCode === 40) { // DOWN
    selectedLocationIndex = Math.min(locations.length - 1, selectedLocationIndex + 1);
  } else if (keyCode === 32) { // SPACE
    const selected = locations[selectedLocationIndex];
    switchLocation(selected.id);
    isSelectingLocation = false;
    selectedObjectIndex = 0;
  } else if (keyCode === 90) { // Z - cancel
    isSelectingLocation = false;
  }
}

function handleGameplayInput(p, keyCode) {
  const location = getCurrentLocation();
  
  if (keyCode === 37 || keyCode === 39) { // LEFT/RIGHT - change location
    isSelectingLocation = true;
    return;
  }
  
  if (keyCode === 38) { // UP - previous object
    selectedObjectIndex = Math.max(0, selectedObjectIndex - 1);
  } else if (keyCode === 40) { // DOWN - next object
    const totalInteractables = location.objects.length + location.suspects.length;
    selectedObjectIndex = Math.min(totalInteractables - 1, selectedObjectIndex + 1);
  } else if (keyCode === 32) { // SPACE - interact
    interactWithSelected(location);
  }
}

function interactWithSelected(location) {
  const totalObjects = location.objects.length;
  const totalSuspects = location.suspects.length;
  
  // Clear all highlights
  for (let obj of location.objects) {
    obj.highlighted = false;
  }
  for (let suspect of location.suspects) {
    suspect.highlighted = false;
  }
  
  if (selectedObjectIndex < totalObjects) {
    // Interact with object
    const obj = location.objects[selectedObjectIndex];
    const message = obj.interact();
    if (message) {
      gameState.currentDialogue = {
        speaker: "Edward",
        text: message
      };
      gameState.showingDialogue = true;
    }
  } else if (selectedObjectIndex < totalObjects + totalSuspects) {
    // Interact with suspect
    const suspect = location.suspects[selectedObjectIndex - totalObjects];
    const dialogue = suspect.interact();
    gameState.currentDialogue = dialogue;
    gameState.showingDialogue = true;
  }
}

export function updateHighlights(location) {
  const totalObjects = location.objects.length;
  
  // Clear all highlights
  for (let obj of location.objects) {
    obj.highlighted = false;
  }
  for (let suspect of location.suspects) {
    suspect.highlighted = false;
  }
  
  // Highlight selected
  if (!isSelectingLocation && !gameState.showInventory && !gameState.showingDialogue) {
    if (selectedObjectIndex < totalObjects) {
      location.objects[selectedObjectIndex].highlighted = true;
    } else {
      const suspectIndex = selectedObjectIndex - totalObjects;
      if (suspectIndex < location.suspects.length) {
        location.suspects[suspectIndex].highlighted = true;
      }
    }
  }
}

export function renderLocationSelection(p) {
  if (!isSelectingLocation) return;
  
  const locations = getLocationsList();
  
  p.push();
  
  // Panel
  p.fill(20, 20, 40, 240);
  p.stroke(150, 150, 200);
  p.strokeWeight(3);
  p.rect(150, 120, 300, 180);
  
  // Title
  p.fill(150, 150, 200);
  p.noStroke();
  p.textSize(16);
  p.textAlign(p.CENTER, p.TOP);
  p.text("SELECT LOCATION", 300, 135);
  
  // Locations list
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  let yOffset = 165;
  
  for (let i = 0; i < locations.length; i++) {
    const loc = locations[i];
    p.fill(i === selectedLocationIndex ? [255, 220, 100] : [200, 200, 220]);
    const prefix = i === selectedLocationIndex ? "▶ " : "  ";
    p.text(prefix + loc.name, 170, yOffset);
    yOffset += 25;
  }
  
  // Controls
  p.fill(180);
  p.textSize(11);
  p.textAlign(p.CENTER, p.BOTTOM);
  p.text("ARROWS: Select | SPACE: Go | Z: Cancel", 300, 285);
  
  p.pop();
}

export function getSelectedObjectIndex() {
  return selectedObjectIndex;
}

export function setSelectedObjectIndex(index) {
  selectedObjectIndex = index;
}

export function isLocationSelectionActive() {
  return isSelectingLocation;
}