// input.js - Input handling

import { gameState } from './globals.js';
import { Player } from './entities.js';
import { generateLevel } from './levelgen.js';

// Key state tracking
const keys = {};

export function setupInput(p) {
  p.keyPressed = function() {
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
    
    // Handle phase controls
    if (p.keyCode === 13) { // ENTER
      if (gameState.gamePhase === "START") {
        startGame(p);
      }
    }
    
    if (p.keyCode === 27) { // ESC
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
    
    if (p.keyCode === 82) { // R - Restart
      if (gameState.gamePhase === "GAME_OVER_WIN" || 
          gameState.gamePhase === "GAME_OVER_LOSE") {
        resetGame(p);
      }
    }
    
    return false; // Prevent default behavior
  };
  
  p.keyReleased = function() {
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
    
    return false;
  };
}

export function handleInput(p) {
  if (gameState.gamePhase !== "PLAYING" || !gameState.player) return;
  
  // Reset crouching if not holding down
  if (!isKeyPressed(40)) {
    gameState.player.stopCrouching();
  }
  
  // Handle movement
  if (isKeyPressed(37)) { // Left
    gameState.player.moveLeft();
  } else if (isKeyPressed(39)) { // Right
    gameState.player.moveRight();
  } else {
    // No horizontal input, slow down
    gameState.player.vx *= 0.8;
  }
  
  // Jump
  if (isKeyPressed(32)) { // Space
    gameState.player.jump();
  }
  
  // Climb up (or enter door)
  if (isKeyPressed(38)) { // Up
    gameState.player.climbUp();
  }
  
  // Climb down / crouch
  if (isKeyPressed(40)) { // Down
    gameState.player.climbDown();
  }
  
  // Throw bomb (one-shot action)
  if (keys[90] && !keys.zPressed) { // Z
    gameState.player.throwBomb(p);
    keys.zPressed = true;
  }
  if (!keys[90]) {
    keys.zPressed = false;
  }
  
  // Use rope (one-shot action)
  if (keys[16] && !keys.shiftPressed) { // Shift
    gameState.player.useRope(p);
    keys.shiftPressed = true;
  }
  if (!keys[16]) {
    keys.shiftPressed = false;
  }
}

export function isKeyPressed(keyCode) {
  return keys[keyCode] === true;
}

function startGame(p) {
  gameState.gamePhase = "PLAYING";
  
  // Initialize level
  generateLevel();
  
  // Create player at spawn
  gameState.player = new Player(60, 320);
  
  if (p.logs && p.logs.game_info) {
    p.logs.game_info.push({
      data: { gamePhase: "PLAYING" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

function resetGame(p) {
  // Clear all game state
  gameState.entities = [];
  gameState.gems = [];
  gameState.enemies = [];
  gameState.bombs = [];
  gameState.ropes = [];
  gameState.particles = [];
  gameState.explosions = [];
  gameState.player = null;
  gameState.exitDoor = null;
  gameState.score = 0;
  gameState.gemsCollected = 0;
  gameState.totalGems = 0;
  gameState.gamePhase = "START";
  
  if (p.logs && p.logs.game_info) {
    p.logs.game_info.push({
      data: { gamePhase: "START" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}