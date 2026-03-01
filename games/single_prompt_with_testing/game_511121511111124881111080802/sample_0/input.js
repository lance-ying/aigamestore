// input.js - Input handling and keyboard state management

import { gameState, CANVAS_WIDTH, clamp } from './globals.js';
import { resetGame } from './game.js';

// Key state tracking
const keys = {};

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

  // Handle phase-specific controls
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
      resetGame(p);
      if (p.logs && p.logs.game_info) {
        p.logs.game_info.push({
          data: { gamePhase: "START", action: "restart" },
          framecount: gameState.frameCount,
          timestamp: Date.now()
        });
      }
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

// Handle player movement input
export function handlePlayerInput(p) {
  if (!gameState.player) return;

  // Handle left/right movement
  if (isKeyPressed(KEY_LEFT)) {
    gameState.targetX -= 8;
    gameState.targetX = clamp(gameState.targetX, 20, CANVAS_WIDTH - 20);
  }

  if (isKeyPressed(KEY_RIGHT)) {
    gameState.targetX += 8;
    gameState.targetX = clamp(gameState.targetX, 20, CANVAS_WIDTH - 20);
  }

  // Update player target
  gameState.player.setTargetX(gameState.targetX);
}

// Get automated testing action
export function getAutomatedAction() {
  if (typeof window.get_automated_testing_action === 'function') {
    return window.get_automated_testing_action(gameState);
  }
  return null;
}

// Process automated testing input
export function processAutomatedInput(action) {
  if (!action || !action.keyCode) return;

  // Simulate key press
  keys[action.keyCode] = true;

  // Process the action based on keyCode
  if (action.keyCode === KEY_LEFT) {
    gameState.targetX -= 8;
    gameState.targetX = clamp(gameState.targetX, 20, CANVAS_WIDTH - 20);
  } else if (action.keyCode === KEY_RIGHT) {
    gameState.targetX += 8;
    gameState.targetX = clamp(gameState.targetX, 20, CANVAS_WIDTH - 20);
  }

  if (gameState.player) {
    gameState.player.setTargetX(gameState.targetX);
  }

  // Reset key state after processing (simulate key release)
  setTimeout(() => {
    keys[action.keyCode] = false;
  }, 50);
}