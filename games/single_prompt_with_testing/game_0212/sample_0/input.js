// input.js - Input handling

import { 
  gameState, 
  KEY_LEFT, 
  KEY_UP, 
  KEY_RIGHT, 
  KEY_DOWN,
  KEY_SPACE,
  KEY_SHIFT,
  KEY_Z,
  KEY_ENTER,
  KEY_ESC,
  KEY_R
} from './globals.js';

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
    
    // Handle phase controls
    if (p.keyCode === KEY_ENTER) {
      if (gameState.gamePhase === "START") {
        startGame();
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
        framecount: gameState.frameCount,
        timestamp: Date.now()
      });
    }
  };
}

export function handleGameplayInput() {
  if (gameState.gamePhase !== "PLAYING") return;
  if (!gameState.player) return;
  
  // Movement
  if (isKeyPressed(KEY_LEFT)) {
    gameState.player.moveLeft();
  }
  if (isKeyPressed(KEY_RIGHT)) {
    gameState.player.moveRight();
  }
  if (isKeyPressed(KEY_UP)) {
    gameState.player.moveUp();
  }
  if (isKeyPressed(KEY_DOWN)) {
    gameState.player.moveDown();
  }
  
  // Fire
  if (isKeyPressed(KEY_SPACE)) {
    gameState.player.fire();
  }
  
  // Shield
  if (isKeyPressed(KEY_SHIFT)) {
    gameState.player.activateShield();
  } else {
    gameState.player.deactivateShield();
  }
  
  // Boost
  if (isKeyPressed(KEY_Z)) {
    gameState.player.activateBoost();
  } else {
    gameState.player.deactivateBoost();
  }
}

export function isKeyPressed(keyCode) {
  return keys[keyCode] === true;
}

function startGame() {
  gameState.gamePhase = "PLAYING";
}

function resetGame() {
  // Clear all arrays
  gameState.entities = [];
  gameState.asteroids = [];
  gameState.drones = [];
  gameState.crystals = [];
  gameState.projectiles = [];
  gameState.enemyProjectiles = [];
  gameState.particles = [];
  
  // Reset stats
  gameState.score = 0;
  gameState.crystalsCollected = 0;
  gameState.enemiesDestroyed = 0;
  gameState.asteroidsDestroyed = 0;
  
  // Reset player
  gameState.player = null;
}