// input_handler.js
import { gameState } from './globals.js';
import { initGame, resetToStart } from './game_logic.js';

export function handleKeyPressed(p) {
  const key = p.key;
  const keyCode = p.keyCode;
  
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Game phase transitions
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === "START") {
      gameState.gamePhase = "PLAYING";
      gameState.upgradeShopOpen = false;
      if (!gameState.runStarted) {
        initGame(p);
      }
    } else if (gameState.gamePhase === "PLAYING" && gameState.upgradeShopOpen) {
      gameState.upgradeShopOpen = false;
    }
    return;
  }
  
  if (keyCode === 27) { // ESC
    if (gameState.gamePhase === "PLAYING") {
      gameState.gamePhase = "PAUSED";
      p.logs.game_info.push({
        data: { phase: "PAUSED", event: "game_paused" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === "PAUSED") {
      gameState.gamePhase = "PLAYING";
      p.logs.game_info.push({
        data: { phase: "PLAYING", event: "game_resumed" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  if (keyCode === 82) { // R
    if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
      gameState.gamePhase = "START";
      resetToStart(p);
    }
    return;
  }
  
  // Gameplay keys
  if (gameState.gamePhase === "PLAYING") {
    gameState.keys[keyCode] = true;
    
    // Nitro activation
    if (keyCode === 38 || keyCode === 32) { // UP or SPACE
      if (gameState.player) {
        gameState.player.nitroActive = true;
      }
    }
  }
}

export function handleKeyReleased(p) {
  const keyCode = p.keyCode;
  
  // Log input
  p.logs.inputs.push({
    input_type: "keyReleased",
    data: { key: p.key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  if (gameState.gamePhase === "PLAYING") {
    gameState.keys[keyCode] = false;
    
    // Nitro deactivation
    if (keyCode === 38 || keyCode === 32) {
      if (gameState.player) {
        gameState.player.nitroActive = false;
      }
    }
  }
}

export function applyAutomatedAction(action) {
  if (!action) return;
  
  // Clear previous keys
  Object.keys(gameState.keys).forEach(key => {
    gameState.keys[key] = false;
  });
  
  // Apply new action
  if (action.nitro && gameState.player) {
    gameState.keys[38] = true;
    gameState.player.nitroActive = true;
  }
  
  if (action.brake) {
    gameState.keys[40] = true;
  }
  
  if (action.pitchLeft) {
    gameState.keys[37] = true;
  }
  
  if (action.pitchRight) {
    gameState.keys[39] = true;
  }
}