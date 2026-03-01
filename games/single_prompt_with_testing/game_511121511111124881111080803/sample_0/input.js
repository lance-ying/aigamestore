// input.js - Input handling and keyboard state management

import { gameState } from './globals.js';
import { resetGameState } from './globals.js';
import { initGame } from './game.js';

// Key state tracking
export const keys = {};

// Key code constants
export const KEY_LEFT = 37;
export const KEY_UP = 38;
export const KEY_RIGHT = 39;
export const KEY_DOWN = 40;
export const KEY_SPACE = 32;
export const KEY_SHIFT = 16;
export const KEY_Z = 90;
export const KEY_ENTER = 13;
export const KEY_ESC = 27;
export const KEY_R = 82;

// Handle key press events
export function handleKeyPress(p) {
  keys[p.keyCode] = true;
  
  // Log input
  if (p.logs && p.logs.inputs) {
    p.logs.inputs.push({
      input_type: 'keyPressed',
      data: { key: p.key, keyCode: p.keyCode },
      framecount: gameState.frameCount,
      timestamp: Date.now()
    });
  }
  
  // Phase-specific controls
  if (p.keyCode === KEY_ENTER) {
    if (gameState.gamePhase === "START") {
      gameState.gamePhase = "PLAYING";
      if (p.logs && p.logs.game_info) {
        p.logs.game_info.push({
          data: { gamePhase: "PLAYING" },
          framecount: gameState.frameCount,
          timestamp: Date.now()
        });
      }
    }
  }
  
  if (p.keyCode === KEY_ESC) {
    if (gameState.gamePhase === "PLAYING") {
      gameState.gamePhase = "PAUSED";
      if (p.logs && p.logs.game_info) {
        p.logs.game_info.push({
          data: { gamePhase: "PAUSED" },
          framecount: gameState.frameCount,
          timestamp: Date.now()
        });
      }
    } else if (gameState.gamePhase === "PAUSED") {
      gameState.gamePhase = "PLAYING";
      if (p.logs && p.logs.game_info) {
        p.logs.game_info.push({
          data: { gamePhase: "PLAYING" },
          framecount: gameState.frameCount,
          timestamp: Date.now()
        });
      }
    }
  }
  
  if (p.keyCode === KEY_R) {
    if (gameState.gamePhase === "GAME_OVER_WIN" || 
        gameState.gamePhase === "GAME_OVER_LOSE") {
      resetGameState();
      gameState.gamePhase = "START";
      if (p.logs && p.logs.game_info) {
        p.logs.game_info.push({
          data: { gamePhase: "START" },
          framecount: gameState.frameCount,
          timestamp: Date.now()
        });
      }
    }
  }
  
  // Gameplay controls (only in PLAYING phase)
  if (gameState.gamePhase === "PLAYING" && gameState.player) {
    if (p.keyCode === KEY_SPACE) {
      gameState.player.useSpecialWeapon();
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
      framecount: gameState.frameCount,
      timestamp: Date.now()
    });
  }
}

// Check if key is currently pressed
export function isKeyPressed(keyCode) {
  return keys[keyCode] === true;
}

// Process player input during gameplay
export function processPlayerInput() {
  if (gameState.gamePhase !== "PLAYING" || !gameState.player) return;
  
  // Handle automated testing
  if (gameState.controlMode !== "HUMAN") {
    processAutomatedInput();
    return;
  }
  
  // Turn left/right
  if (isKeyPressed(KEY_LEFT)) {
    gameState.player.turnLeft();
  }
  if (isKeyPressed(KEY_RIGHT)) {
    gameState.player.turnRight();
  }
  
  // Boost/brake
  if (isKeyPressed(KEY_UP)) {
    gameState.player.boost();
  }
  if (isKeyPressed(KEY_DOWN)) {
    gameState.player.brake();
  }
}

// Process automated testing input
function processAutomatedInput() {
  if (typeof window.get_automated_testing_action !== 'function') return;
  
  const action = window.get_automated_testing_action(gameState);
  if (!action) return;
  
  // Simulate key press
  if (action.keyCode === KEY_LEFT) {
    gameState.player.turnLeft();
  } else if (action.keyCode === KEY_RIGHT) {
    gameState.player.turnRight();
  } else if (action.keyCode === KEY_UP) {
    gameState.player.boost();
  } else if (action.keyCode === KEY_DOWN) {
    gameState.player.brake();
  } else if (action.keyCode === KEY_SPACE) {
    gameState.player.useSpecialWeapon();
  }
}