// input_handler.js - Input handling

import { gameState, FACILITY_TYPES } from './globals.js';
import { placeFacility, upgradeFacility, findFacilityAt } from './game_logic.js';

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
  
  // Phase transitions
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === "START") {
      gameState.gamePhase = "PLAYING";
      p.logs.game_info.push({
        data: { gamePhase: "PLAYING" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  if (keyCode === 27) { // ESC
    if (gameState.gamePhase === "PLAYING") {
      gameState.paused = !gameState.paused;
      p.logs.game_info.push({
        data: { paused: gameState.paused },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  if (keyCode === 82) { // R
    if (gameState.gamePhase === "GAME_OVER") {
      gameState.gamePhase = "START";
      p.logs.game_info.push({
        data: { gamePhase: "START" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  if (gameState.gamePhase !== "PLAYING" || gameState.paused) return;
  
  // Gameplay controls
  if (keyCode === 37) { // LEFT
    gameState.cursorX = Math.max(0, gameState.cursorX - 1);
  } else if (keyCode === 39) { // RIGHT
    gameState.cursorX = Math.min(8, gameState.cursorX + 1);
  } else if (keyCode === 38) { // UP
    gameState.cursorY = Math.max(0, gameState.cursorY - 1);
  } else if (keyCode === 40) { // DOWN
    gameState.cursorY = Math.min(7, gameState.cursorY + 1);
  } else if (keyCode === 32) { // SPACE
    placeFacility(gameState.selectedFacilityType);
  } else if (keyCode === 90) { // Z
    gameState.menuOpen = !gameState.menuOpen;
  } else if (keyCode === 16) { // SHIFT
    const facility = findFacilityAt(gameState.cursorX, gameState.cursorY);
    if (facility) {
      upgradeFacility(facility);
    }
  }
}

export function processAutomatedAction(action) {
  if (!action) return;
  
  if (action.type === "MOVE") {
    gameState.cursorX = action.x;
    gameState.cursorY = action.y;
  } else if (action.type === "PLACE") {
    if (action.facilityType) {
      gameState.selectedFacilityType = action.facilityType;
    }
    placeFacility(gameState.selectedFacilityType);
  } else if (action.type === "UPGRADE") {
    const facility = findFacilityAt(gameState.cursorX, gameState.cursorY);
    if (facility) {
      upgradeFacility(facility);
    }
  } else if (action.type === "SELECT") {
    if (action.facilityType) {
      gameState.selectedFacilityType = action.facilityType;
    }
  }
}