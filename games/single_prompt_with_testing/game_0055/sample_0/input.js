// input.js - Input handling and keyboard state

import { gameState } from './globals.js';
import { Player } from './entities.js';
import { initializeGame } from './game.js';

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
        gameState.gamePhase = "PLAYING";
        initializeGame();
        
        if (p.logs && p.logs.game_info) {
          p.logs.game_info.push({
            data: { gamePhase: "PLAYING" },
            framecount: p.frameCount,
            timestamp: Date.now()
          });
        }
      }
    }
    
    if (p.keyCode === 27) { // ESC
      if (gameState.gamePhase === "PLAYING") {
        gameState.gamePhase = "PAUSED";
      } else if (gameState.gamePhase === "PAUSED") {
        gameState.gamePhase = "PLAYING";
      }
    }
    
    if (p.keyCode === 82) { // R - Restart
      if (gameState.gamePhase === "GAME_OVER_WIN" || 
          gameState.gamePhase === "GAME_OVER_LOSE") {
        resetGame();
        gameState.gamePhase = "START";
      }
    }
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
  };
}

export function isKeyPressed(keyCode) {
  return keys[keyCode] === true;
}

export function handlePlayerInput(p) {
  if (!gameState.player) return;
  
  let dx = 0;
  let dy = 0;
  
  // Arrow key movement
  if (isKeyPressed(37)) { // Left
    dx = -1;
  }
  if (isKeyPressed(39)) { // Right
    dx = 1;
  }
  if (isKeyPressed(38)) { // Up
    dy = -1;
  }
  if (isKeyPressed(40)) { // Down
    dy = 1;
  }
  
  // Normalize diagonal movement
  if (dx !== 0 && dy !== 0) {
    const mag = Math.sqrt(dx * dx + dy * dy);
    dx /= mag;
    dy /= mag;
  }
  
  gameState.player.move(dx, dy);
  
  // Dash (Space)
  if (isKeyPressed(32)) {
    gameState.player.dash();
  }
  
  // Attack (Z)
  if (isKeyPressed(90)) {
    gameState.player.attack(p);
  }
  
  // Slow motion (Shift)
  if (isKeyPressed(16)) {
    if (gameState.slowMoCharge > 0) {
      gameState.slowMotion = true;
      gameState.slowMoCharge -= gameState.GAME_CONSTANTS?.SLOW_MO_DRAIN_RATE || 2;
    } else {
      gameState.slowMotion = false;
    }
  } else {
    gameState.slowMotion = false;
    // Recharge slow-mo
    if (gameState.slowMoCharge < (gameState.GAME_CONSTANTS?.SLOW_MO_MAX || 180)) {
      gameState.slowMoCharge += gameState.GAME_CONSTANTS?.SLOW_MO_RECHARGE_RATE || 0.5;
    }
  }
}

export function resetGame() {
  // Clear all entities
  gameState.entities = [];
  gameState.enemies = [];
  gameState.powerups = [];
  gameState.particles = [];
  gameState.slashEffects = [];
  
  // Reset game state
  gameState.player = null;
  gameState.score = 0;
  gameState.enemiesDefeated = 0;
  gameState.survivalTime = 0;
  gameState.waveNumber = 1;
  gameState.enemySpawnTimer = 0;
  gameState.powerupSpawnTimer = 0;
  gameState.gameTimeSeconds = 0;
  gameState.difficultyMultiplier = 1.0;
  gameState.screenShake = 0;
  gameState.slowMotion = false;
  gameState.slowMoCharge = 180;
}