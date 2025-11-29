// input.js - Input handling

import { gameState, KEY_LEFT, KEY_RIGHT, KEY_UP, KEY_SPACE, KEY_ENTER, KEY_ESC, KEY_R } from './globals.js';

// Track key states
const keys = {};

export function setupInput(p) {
  p.keyPressed = function() {
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
    
    // Handle game phase controls
    handlePhaseControls(p);
  };
  
  p.keyReleased = function() {
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
  };
}

function handlePhaseControls(p) {
  // ENTER - Start game
  if (p.keyCode === KEY_ENTER && gameState.gamePhase === "START") {
    gameState.gamePhase = "PLAYING";
    if (p.logs && p.logs.game_info) {
      p.logs.game_info.push({
        data: { gamePhase: "PLAYING" },
        framecount: gameState.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  // ESC - Pause/Unpause
  if (p.keyCode === KEY_ESC) {
    if (gameState.gamePhase === "PLAYING") {
      gameState.gamePhase = "PAUSED";
    } else if (gameState.gamePhase === "PAUSED") {
      gameState.gamePhase = "PLAYING";
    }
    
    if (p.logs && p.logs.game_info) {
      p.logs.game_info.push({
        data: { gamePhase: gameState.gamePhase },
        framecount: gameState.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  // R - Restart
  if (p.keyCode === KEY_R) {
    if (gameState.gamePhase === "GAME_OVER_WIN" || 
        gameState.gamePhase === "GAME_OVER_LOSE" ||
        gameState.gamePhase === "PLAYING") {
      const { resetGame } = require('./game.js');
      resetGame();
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

export function handleGameplayInput(p) {
  if (!gameState.player) return;
  
  // Movement
  if (isKeyPressed(KEY_LEFT)) {
    gameState.player.moveLeft();
  }
  if (isKeyPressed(KEY_RIGHT)) {
    gameState.player.moveRight();
  }
  
  // Jump
  if (isKeyPressed(KEY_UP)) {
    gameState.player.jump();
  }
  
  // Interact
  if (isKeyPressed(KEY_SPACE)) {
    gameState.player.interact();
  }
}

export function isKeyPressed(keyCode) {
  return keys[keyCode] === true;
}

export function getKeys() {
  return keys;
}