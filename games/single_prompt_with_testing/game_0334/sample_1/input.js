// input.js - Input handling

import { gameState, KEY_SPACE, KEY_Z, KEY_SHIFT, KEY_ENTER, KEY_ESC, KEY_R } from './globals.js';

export function handleKeyPress(p) {
  gameState.keys[p.keyCode] = true;
  
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
      startGame(p);
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
      resetGame(p);
    }
  }
  
  // Gameplay actions
  if (gameState.gamePhase === "PLAYING" && gameState.player) {
    if (p.keyCode === KEY_SPACE) {
      gameState.player.dash();
    }
    
    if (p.keyCode === KEY_Z) {
      gameState.player.attack(p);
    }
    
    if (p.keyCode === KEY_SHIFT) {
      gameState.showMap = !gameState.showMap;
    }
  }
}

export function handleKeyRelease(p) {
  gameState.keys[p.keyCode] = false;
  
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

function startGame(p) {
  gameState.gamePhase = "PLAYING";
  
  if (p.logs && p.logs.game_info) {
    p.logs.game_info.push({
      data: { gamePhase: "PLAYING", action: "game_started" },
      framecount: gameState.frameCount,
      timestamp: Date.now()
    });
  }
}

function resetGame(p) {
  // Clear all entities
  gameState.entities = [];
  gameState.enemies = [];
  gameState.collectibles = [];
  gameState.hazards = [];
  gameState.particles = [];
  gameState.projectiles = [];
  
  // Reset stats
  gameState.score = 0;
  gameState.artifactsCollected = 0;
  gameState.crystalsCollected = 0;
  gameState.enemiesDefeated = 0;
  
  // Reset camera
  gameState.cameraX = 0;
  gameState.cameraY = 0;
  gameState.cameraShakeX = 0;
  gameState.cameraShakeY = 0;
  gameState.cameraShakeIntensity = 0;
  
  // Reset input
  gameState.keys = {};
  gameState.showMap = false;
  
  gameState.gamePhase = "START";
  
  if (p.logs && p.logs.game_info) {
    p.logs.game_info.push({
      data: { gamePhase: "START", action: "game_reset" },
      framecount: gameState.frameCount,
      timestamp: Date.now()
    });
  }
}