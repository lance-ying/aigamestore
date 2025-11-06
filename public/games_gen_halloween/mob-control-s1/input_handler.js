// input_handler.js - Input handling
import { gameState, resetGameState } from './globals.js';
import { Cannon } from './entities.js';
import { initializeGates } from './game_logic.js';
import get_automated_testing_action from './automated_testing_controller.js';

export function setupInputHandlers(p) {
  p.keyPressed = function() {
    // Log input
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Game phase transitions
    if (p.keyCode === 13) { // ENTER
      if (gameState.gamePhase === "START") {
        startGame(p);
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
        resetToStart(p);
      }
      return;
    }
    
    // Gameplay keys
    if (gameState.gamePhase === "PLAYING") {
      handleGameplayKey(p.keyCode, true);
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
      handleGameplayKey(p.keyCode, false);
    }
  };
}

export function handleGameplayKey(keyCode, isPressed) {
  switch(keyCode) {
    case 37: // LEFT
      gameState.keys.left = isPressed;
      break;
    case 39: // RIGHT
      gameState.keys.right = isPressed;
      break;
    case 32: // SPACE
      gameState.keys.space = isPressed;
      break;
    case 90: // Z
      gameState.keys.z = isPressed;
      break;
    case 16: // SHIFT
      gameState.keys.shift = isPressed;
      break;
  }
}

export function updatePlayerControls(p) {
  if (gameState.gamePhase !== "PLAYING") return;
  
  // Handle automated testing
  if (gameState.controlMode !== "HUMAN") {
    const action = get_automated_testing_action(gameState);
    if (action) {
      // Clear all keys first
      gameState.keys.left = false;
      gameState.keys.right = false;
      gameState.keys.space = false;
      gameState.keys.z = false;
      gameState.keys.shift = false;
      
      // Set action keys
      if (action.left) gameState.keys.left = true;
      if (action.right) gameState.keys.right = true;
      if (action.space) gameState.keys.space = true;
      if (action.z) gameState.keys.z = true;
      if (action.shift) gameState.keys.shift = true;
    }
  }
  
  // Update cannon angle
  if (gameState.player) {
    const rotationSpeed = 0.05;
    if (gameState.keys.left) {
      gameState.cannonAngle -= rotationSpeed;
    }
    if (gameState.keys.right) {
      gameState.cannonAngle += rotationSpeed;
    }
    gameState.cannonAngle = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, gameState.cannonAngle));
    gameState.player.setAngle(gameState.cannonAngle);
  }
}

export function startGame(p) {
  resetGameState();
  gameState.gamePhase = "PLAYING";
  
  // Initialize player
  gameState.player = new Cannon(300, CANVAS_HEIGHT - 40);
  
  // Initialize gates
  initializeGates(p);
  
  p.logs.game_info.push({
    data: { gamePhase: "PLAYING", message: "Game Started" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function resetToStart(p) {
  resetGameState();
  gameState.gamePhase = "START";
  gameState.player = null;
  
  p.logs.game_info.push({
    data: { gamePhase: "START", message: "Reset to Start" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

// Import CANVAS_HEIGHT at the end to avoid circular dependency issues
import { CANVAS_HEIGHT } from './globals.js';