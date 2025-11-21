// inputHandler.js
import { gameState, CAMERA_ROTATION_SPEED } from './globals.js';
import { interactWithObject, fixMechanismInPast } from './gameLogic.js';

export function handleKeyPressed(p, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: p.key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Phase control keys
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === "START") {
      gameState.gamePhase = "PLAYING";
      p.logs.game_info.push({
        data: { phase: "PLAYING" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  if (keyCode === 27) { // ESC
    if (gameState.gamePhase === "PLAYING") {
      gameState.gamePhase = "PAUSED";
      p.logs.game_info.push({
        data: { phase: "PAUSED" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === "PAUSED") {
      gameState.gamePhase = "PLAYING";
      p.logs.game_info.push({
        data: { phase: "PLAYING" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  if (keyCode === 82) { // R
    if (gameState.gamePhase.startsWith("GAME_OVER")) {
      gameState.gamePhase = "START";
      p.logs.game_info.push({
        data: { phase: "START" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  // Gameplay keys (only in PLAYING phase)
  if (gameState.gamePhase !== "PLAYING") return;
  
  // Arrow keys - camera rotation
  if (keyCode === 37) { // LEFT
    gameState.targetCameraAngle -= 90;
    if (gameState.targetCameraAngle < 0) gameState.targetCameraAngle += 360;
  } else if (keyCode === 39) { // RIGHT
    gameState.targetCameraAngle += 90;
    if (gameState.targetCameraAngle >= 360) gameState.targetCameraAngle -= 360;
  }
  
  // Space - interact
  if (keyCode === 32) {
    interactWithObject(p);
  }
  
  // Shift - examine / close examination
  if (keyCode === 16) {
    if (gameState.examinedObject) {
      gameState.examinedObject = null;
    } else if (gameState.highlightedObject && gameState.highlightedObject.type === "examine") {
      interactWithObject(p);
    }
  }
  
  // Z - toggle Oculus
  if (keyCode === 90) {
    gameState.oculusActive = !gameState.oculusActive;
    p.logs.game_info.push({
      data: { action: "oculus_toggle", active: gameState.oculusActive },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Special: Fix mechanism in past in Room 1
    if (gameState.oculusActive && gameState.currentRoom === 1) {
      fixMechanismInPast(p);
    }
  }
  
  // Number keys 1-3 - select inventory
  if (keyCode >= 49 && keyCode <= 51) {
    const slotIndex = keyCode - 49;
    if (slotIndex < gameState.inventory.length) {
      gameState.selectedItemIndex = slotIndex;
    }
  }
  
  // Log player position
  p.logs.player_info.push({
    screen_x: p.width / 2,
    screen_y: p.height / 2,
    game_x: gameState.cameraAngle,
    game_y: gameState.currentRoom,
    framecount: p.frameCount
  });
}

export function processAutomatedInput(p, action) {
  if (!action) return;
  
  if (action.keyCode) {
    handleKeyPressed(p, action.keyCode);
  }
}