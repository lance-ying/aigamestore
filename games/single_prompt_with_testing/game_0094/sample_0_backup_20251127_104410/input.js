// input.js - Input handling

import { gameState } from './globals.js';
import { resetGame } from './game.js';

// Key state tracking
const keys = {};

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
  if (p.keyCode === 13) { // ENTER
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
  
  if (p.keyCode === 27) { // ESC
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
  
  if (p.keyCode === 82) { // R - Restart
    if (gameState.gamePhase === "GAME_OVER_WIN" || 
        gameState.gamePhase === "GAME_OVER_LOSE") {
      resetGame(p);
      gameState.gamePhase = "START";
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

export function isKeyPressed(keyCode) {
  return keys[keyCode] === true;
}

export function handlePlayerInput(player) {
  if (!player) return;
  
  // Movement
  if (isKeyPressed(37)) { // Left arrow
    player.moveLeft();
  }
  if (isKeyPressed(39)) { // Right arrow
    player.moveRight();
  }
  
  // Jump
  if (isKeyPressed(32)) { // Space
    player.jump();
    keys[32] = false; // Prevent holding
  }
  
  // Attack
  if (isKeyPressed(90)) { // Z
    player.attack();
    keys[90] = false; // Prevent holding
  }
  
  // Shovel drop
  if (isKeyPressed(40) && !player.onGround) { // Down arrow
    player.shovelDrop();
  }
}

export function clearKeys() {
  for (const key in keys) {
    keys[key] = false;
  }
}