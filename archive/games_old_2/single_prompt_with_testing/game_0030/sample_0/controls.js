// controls.js - Input handling

import { gameState, GRID_SIZE, ABILITIES } from './globals.js';
import { executePlayerTurn } from './combat.js';
import { useAbility, canUseAbility } from './abilities.js';

export function handleKeyPressed(p) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: p.key, keyCode: p.keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Phase controls
  if (p.keyCode === 13 && gameState.gamePhase === "START") { // ENTER
    gameState.gamePhase = "PLAYING";
    p.logs.game_info.push({
      data: { gamePhase: "PLAYING" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return false;
  }
  
  if (p.keyCode === 27) { // ESC - Pause/Unpause
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
    return false;
  }
  
  if (p.keyCode === 82) { // R - Restart
    if (gameState.gamePhase === "GAME_OVER_WIN" || 
        gameState.gamePhase === "GAME_OVER_LOSE") {
      p.logs.game_info.push({
        data: { action: "restart" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      return true; // Signal restart needed
    }
  }
  
  // Gameplay controls (only during player turn)
  if (gameState.gamePhase === "PLAYING" && gameState.isPlayerTurn) {
    handleGameplayInput(p);
  }
  
  return false;
}

function handleGameplayInput(p) {
  // Cursor movement
  if (p.keyCode === 37 || p.keyCode === 65) { // LEFT or A
    gameState.cursorX = Math.max(0, gameState.cursorX - 1);
  }
  if (p.keyCode === 39 || p.keyCode === 68) { // RIGHT or D
    gameState.cursorX = Math.min(GRID_SIZE - 1, gameState.cursorX + 1);
  }
  if (p.keyCode === 38 || p.keyCode === 87) { // UP or W
    gameState.cursorY = Math.max(0, gameState.cursorY - 1);
  }
  if (p.keyCode === 40 || p.keyCode === 83) { // DOWN or S
    gameState.cursorY = Math.min(GRID_SIZE - 1, gameState.cursorY + 1);
  }
  
  // Fire shot
  if (p.keyCode === 32) { // SPACE
    executePlayerTurn(p);
  }
  
  // Ability selection
  if (p.keyCode === 90) { // Z - Cycle abilities
    const abilityKeys = Object.keys(ABILITIES);
    const currentIndex = abilityKeys.indexOf(gameState.selectedAbility);
    const nextIndex = (currentIndex + 1) % abilityKeys.length;
    gameState.selectedAbility = abilityKeys[nextIndex];
  }
  
  // Activate ability
  if (p.keyCode === 16 && gameState.selectedAbility) { // SHIFT
    if (canUseAbility(gameState.selectedAbility)) {
      useAbility(gameState.selectedAbility, p);
    }
  }
}