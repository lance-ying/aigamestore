// input.js - Input handling and keyboard state management

import { 
  gameState, 
  KEY_LEFT, 
  KEY_RIGHT, 
  KEY_SPACE, 
  KEY_Z,
  KEY_ENTER,
  KEY_ESC,
  KEY_R
} from './globals.js';
import { resetGame, startGame } from './game.js';

// Key state tracking
export const keys = {};

// Handle key press events
export function handleKeyPress(p) {
  keys[p.keyCode] = true;
  
  // Log input
  if (p.logs && p.logs.inputs) {
    p.logs.inputs.push({
      input_type: 'keyPressed',
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  // Handle phase-specific controls
  if (p.keyCode === KEY_ENTER) {
    if (gameState.gamePhase === "START") {
      startGame(p);
    }
  }
  
  if (p.keyCode === KEY_ESC) {
    if (gameState.gamePhase === "PLAYING") {
      gameState.gamePhase = "PAUSED";
      if (p.logs && p.logs.game_info) {
        p.logs.game_info.push({
          data: { gamePhase: "PAUSED" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    } else if (gameState.gamePhase === "PAUSED") {
      gameState.gamePhase = "PLAYING";
      if (p.logs && p.logs.game_info) {
        p.logs.game_info.push({
          data: { gamePhase: "PLAYING" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
  }
  
  if (p.keyCode === KEY_R) {
    if (gameState.gamePhase === "GAME_OVER_WIN" || 
        gameState.gamePhase === "GAME_OVER_LOSE") {
      resetGame(p);
    }
  }
  
  // Gameplay controls logging
  if (gameState.gamePhase === "PLAYING" && gameState.player) {
    if (p.keyCode === KEY_SPACE) {
      gameState.player.jumpPressed = true;
    }
    if (p.keyCode === KEY_Z) {
      gameState.player.grapplePressed = true;
    }
  }
}

// Handle key release events
export function handleKeyRelease(p) {
  keys[p.keyCode] = false;
  
  // Log input
  if (p.logs && p.logs.inputs) {
    p.logs.inputs.push({
      input_type: 'keyReleased',
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  // Handle grapple release
  if (gameState.gamePhase === "PLAYING" && gameState.player) {
    if (p.keyCode === KEY_Z) {
      gameState.player.grapplePressed = false;
      gameState.player.releaseGrapple();
    }
  }
}

// Check if key is currently pressed
export function isKeyPressed(keyCode) {
  return keys[keyCode] === true;
}

// Process player input based on control mode
export function processPlayerInput(p) {
  if (gameState.gamePhase !== "PLAYING" || !gameState.player) {
    return;
  }
  
  let action = null;
  
  // Get automated testing action if in test mode
  if (gameState.controlMode !== "HUMAN") {
    if (window.get_automated_testing_action) {
      action = window.get_automated_testing_action(gameState);
    }
  }
  
  // Apply action (either from player or automated test)
  if (action) {
    // Simulate key press from automated action
    applyAction(action, p);
  } else if (gameState.controlMode === "HUMAN") {
    // Handle human input
    applyHumanInput(p);
  }
}

// Apply automated test action
function applyAction(action, p) {
  if (!action || !action.keyCode) return;
  
  const keyCode = action.keyCode;
  
  // Simulate key state
  if (!keys[keyCode]) {
    keys[keyCode] = true;
    
    // Trigger press events
    if (keyCode === KEY_SPACE) {
      gameState.player.jumpPressed = true;
    }
    if (keyCode === KEY_Z) {
      gameState.player.grapplePressed = true;
    }
    
    // Auto-release after a frame for some keys
    setTimeout(() => {
      keys[keyCode] = false;
      if (keyCode === KEY_SPACE) {
        gameState.player.jumpPressed = false;
      }
      if (keyCode === KEY_Z && action.hold !== true) {
        gameState.player.grapplePressed = false;
        gameState.player.releaseGrapple();
      }
    }, 50);
  }
  
  // Apply continuous movement
  applyHumanInput(p);
}

// Apply human keyboard input
function applyHumanInput(p) {
  if (!gameState.player) return;
  
  // Movement
  if (isKeyPressed(KEY_LEFT)) {
    gameState.player.moveLeft();
  }
  if (isKeyPressed(KEY_RIGHT)) {
    gameState.player.moveRight();
  }
  
  // Jump
  if (isKeyPressed(KEY_SPACE) && gameState.player.jumpPressed) {
    gameState.player.jump();
    gameState.player.jumpPressed = false; // One jump per press
  }
  
  // Grapple
  if (isKeyPressed(KEY_Z) && gameState.player.grapplePressed && !gameState.isGrappling) {
    gameState.player.launchGrapple();
    gameState.player.grapplePressed = false; // One launch per press
  }
  
  // Maintain grapple
  if (isKeyPressed(KEY_Z) && gameState.isGrappling) {
    gameState.player.maintainGrapple();
  }
}

// Reset key states (useful for phase transitions)
export function resetKeyStates() {
  for (let key in keys) {
    keys[key] = false;
  }
}