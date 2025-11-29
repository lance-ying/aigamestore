// input.js - Input handling

import { gameState, KEY_LEFT, KEY_UP, KEY_RIGHT, KEY_DOWN, KEY_SPACE, KEY_SHIFT, KEY_Z, KEY_ENTER, KEY_ESC, KEY_R } from './globals.js';
import { resetGameState } from './globals.js';
import { initGame } from './game.js';

// Track key states
const keys = {};

// Handle key press
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
  
  // Handle phase controls
  if (p.keyCode === KEY_ENTER) {
    if (gameState.gamePhase === "START") {
      gameState.gamePhase = "PLAYING";
      initGame(p);
      
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
    } else if (gameState.gamePhase === "PAUSED") {
      gameState.gamePhase = "PLAYING";
    }
  }
  
  if (p.keyCode === KEY_R) {
    if (gameState.gamePhase === "GAME_OVER_WIN" || 
        gameState.gamePhase === "GAME_OVER_LOSE") {
      resetGameState();
      
      if (p.logs && p.logs.game_info) {
        p.logs.game_info.push({
          data: { gamePhase: "START" },
          framecount: gameState.frameCount,
          timestamp: Date.now()
        });
      }
    }
  }
}

// Handle key release
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

// Check if key is pressed
export function isKeyPressed(keyCode) {
  return keys[keyCode] === true;
}

// Process player input
export function processPlayerInput(p) {
  if (!gameState.player) return;
  
  const player = gameState.player;
  
  // Movement
  if (isKeyPressed(KEY_LEFT)) {
    player.move(-1, 0);
  }
  if (isKeyPressed(KEY_RIGHT)) {
    player.move(1, 0);
  }
  if (isKeyPressed(KEY_UP)) {
    player.move(0, -1);
  }
  if (isKeyPressed(KEY_DOWN)) {
    player.move(0, 1);
  }
  
  // Afterburner
  player.setAfterburner(isKeyPressed(KEY_SHIFT));
  
  // Weapons
  if (isKeyPressed(KEY_SPACE)) {
    player.fireBullet(p);
  }
  
  if (isKeyPressed(KEY_Z)) {
    player.fireMissile(p);
  }
}

// Get automated testing action
export function getAutomatedAction() {
  if (typeof window.get_automated_testing_action === 'function') {
    return window.get_automated_testing_action(gameState);
  }
  return null;
}

// Process automated testing input
export function processAutomatedInput(p) {
  const action = getAutomatedAction();
  
  if (action && action.keyCode) {
    // Simulate key press
    keys[action.keyCode] = true;
    
    // Log automated input
    if (p.logs && p.logs.inputs) {
      p.logs.inputs.push({
        input_type: 'automated',
        data: { keyCode: action.keyCode, mode: gameState.controlMode },
        framecount: gameState.frameCount,
        timestamp: Date.now()
      });
    }
    
    // Process the input
    processPlayerInput(p);
    
    // Release key immediately
    keys[action.keyCode] = false;
  }
}