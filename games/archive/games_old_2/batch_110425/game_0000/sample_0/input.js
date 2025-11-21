// input.js - Input handling

import { gameState } from './globals.js';
import get_automated_testing_action from './automated_testing_controller.js';

export function handleInput(p) {
  if (gameState.controlMode === "HUMAN") {
    return;
  }
  
  // Get automated action
  let action = get_automated_testing_action(gameState);
  
  // Clear previous keys for automated mode
  for (let key in gameState.keys) {
    gameState.keys[key] = false;
  }
  
  // Apply automated actions
  if (action) {
    if (action.left) gameState.keys[37] = true;
    if (action.right) gameState.keys[39] = true;
    if (action.jump) gameState.keys[38] = true;
    if (action.attack) gameState.keys[32] = true;
    if (action.shield) gameState.keys[90] = true;
  }
}

export function setupKeyHandlers(p) {
  p.keyPressed = function() {
    // Log input
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Handle game phase transitions
    if (p.keyCode === 13) { // ENTER
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
    
    if (p.keyCode === 27) { // ESC
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
    
    if (p.keyCode === 82) { // R
      if (gameState.gamePhase.startsWith("GAME_OVER")) {
        resetGame(p);
        gameState.gamePhase = "START";
        p.logs.game_info.push({
          data: { gamePhase: "START" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
      return;
    }
    
    // Gameplay keys
    if (gameState.gamePhase === "PLAYING") {
      gameState.keys[p.keyCode] = true;
      
      if (p.keyCode === 32 && gameState.player) { // Space - Attack
        gameState.player.attack();
      }
      
      if (p.keyCode === 90 && gameState.player) { // Z - Shield
        gameState.player.useShield();
      }
    }
  };
  
  p.keyReleased = function() {
    // Log input
    p.logs.inputs.push({
      input_type: "keyReleased",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    if (gameState.gamePhase === "PLAYING") {
      gameState.keys[p.keyCode] = false;
    }
  };
}

function resetGame(p) {
  gameState.score = 0;
  gameState.currentLevel = 0;
  gameState.levelComplete = false;
  gameState.cameraX = 0;
  gameState.entities = [];
  gameState.platforms = [];
  gameState.enemies = [];
  gameState.items = [];
  gameState.hazards = [];
  gameState.particles = [];
  gameState.player = null;
  
  for (let key in gameState.keys) {
    gameState.keys[key] = false;
  }
}