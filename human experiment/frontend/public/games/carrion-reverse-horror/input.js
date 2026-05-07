// input.js - Input handling for keyboard controls

import { 
  gameState, 
  resetGame,
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

// Track key states
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
  if (p.keyCode === KEY_ENTER) {
    if (gameState.gamePhase === "START") {
      startGame();
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

export function handleGameplayInput(p) {
  if (gameState.gamePhase !== "PLAYING" || !gameState.player) return;
  
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
  
  // Lunge attack (Space)
  if (keys[KEY_SPACE]) {
    gameState.player.lunge();
    keys[KEY_SPACE] = false; // Prevent holding
  }
  
  // Tentacle attack (Shift)
  if (keys[KEY_SHIFT]) {
    gameState.player.spawnTentacle();
    keys[KEY_SHIFT] = false; // Prevent holding
  }
  
  // Blood trail ability (Z)
  if (keys[KEY_Z]) {
    gameState.player.useBloodTrail();
    keys[KEY_Z] = false; // Prevent holding
  }
}

// Initialize game when starting
function startGame() {
  resetGame();
  
  // Import here to avoid circular dependency
  import('./level.js').then(module => {
    module.initializeLevel();
  });
}