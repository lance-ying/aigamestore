// input.js - Input handling

import { gameState } from './globals.js';
import { initGame, resetGame } from './game.js';

// Key codes
const KEY_LEFT = 37;
const KEY_UP = 38;
const KEY_RIGHT = 39;
const KEY_DOWN = 40;
const KEY_SPACE = 32;
const KEY_SHIFT = 16;
const KEY_Z = 90;
const KEY_ENTER = 13;
const KEY_ESC = 27;
const KEY_R = 82;

export function handleKeyPress(p) {
  gameState.keys[p.keyCode] = true;
  
  // Log input
  p.logs.inputs.push({
    input_type: 'keyPressed',
    data: { key: p.key, keyCode: p.keyCode },
    framecount: gameState.frameCount,
    timestamp: Date.now()
  });
  
  // Phase controls
  if (p.keyCode === KEY_ENTER) {
    if (gameState.gamePhase === "START") {
      gameState.gamePhase = "PLAYING";
      initGame(p);
      gameState.gameStartTime = Date.now();
      p.logs.game_info.push({
        data: { gamePhase: "PLAYING" },
        framecount: gameState.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  if (p.keyCode === KEY_ESC) {
    if (gameState.gamePhase === "PLAYING") {
      gameState.gamePhase = "PAUSED";
      p.logs.game_info.push({
        data: { gamePhase: "PAUSED" },
        framecount: gameState.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === "PAUSED") {
      gameState.gamePhase = "PLAYING";
      p.logs.game_info.push({
        data: { gamePhase: "PLAYING" },
        framecount: gameState.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  if (p.keyCode === KEY_R) {
    if (gameState.gamePhase === "GAME_OVER_WIN" || 
        gameState.gamePhase === "GAME_OVER_LOSE") {
      resetGame(p);
      gameState.gamePhase = "START";
      p.logs.game_info.push({
        data: { gamePhase: "START" },
        framecount: gameState.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  // Gameplay controls (only during PLAYING)
  if (gameState.gamePhase === "PLAYING") {
    if (p.keyCode === KEY_Z) {
      toggleFlashlight();
    }
  }
}

export function handleKeyRelease(p) {
  gameState.keys[p.keyCode] = false;
  
  // Log input
  p.logs.inputs.push({
    input_type: 'keyReleased',
    data: { key: p.key, keyCode: p.keyCode },
    framecount: gameState.frameCount,
    timestamp: Date.now()
  });
}

export function updatePlayerInput(p) {
  if (gameState.gamePhase !== "PLAYING") return;
  if (!gameState.player) return;
  
  // Movement
  if (isKeyPressed(KEY_UP)) {
    gameState.player.moveForward();
  }
  if (isKeyPressed(KEY_DOWN)) {
    gameState.player.moveBackward();
  }
  if (isKeyPressed(KEY_LEFT)) {
    gameState.player.turnLeft();
  }
  if (isKeyPressed(KEY_RIGHT)) {
    gameState.player.turnRight();
  }
  
  // Flashlight shake (hold Shift)
  if (isKeyPressed(KEY_SHIFT)) {
    shakeFlashlight(p);
  }
  
  // Interact with Tattletail
  if (isKeyPressed(KEY_SPACE)) {
    interactWithTattletail(p);
  }
}

function isKeyPressed(keyCode) {
  return gameState.keys[keyCode] === true;
}

function toggleFlashlight() {
  gameState.flashlightOn = !gameState.flashlightOn;
  if (gameState.flashlightOn) {
    gameState.noiseLevel += 0.5;
  }
}

function shakeFlashlight(p) {
  const now = Date.now();
  if (now - gameState.lastShakeTime > 100) { // Limit shake rate
    gameState.flashlightBattery = Math.min(100, gameState.flashlightBattery + 2);
    gameState.noiseLevel += 1.2;
    gameState.lastShakeTime = now;
  }
}

function interactWithTattletail(p) {
  if (!gameState.player || !gameState.tattletail) return;
  
  const dist = Math.sqrt(
    Math.pow(gameState.player.x - gameState.tattletail.x, 2) +
    Math.pow(gameState.player.y - gameState.tattletail.y, 2)
  );
  
  // Must be close to interact
  if (dist > 80) return;
  
  // Perform action based on need
  if (gameState.tattletailNeedType === "food") {
    gameState.tattletail.feed();
    gameState.noiseLevel += 0.5;
  } else if (gameState.tattletailNeedType === "brush") {
    gameState.tattletail.brush();
    gameState.noiseLevel += 0.3;
  } else if (gameState.tattletailNeedType === "charge") {
    gameState.tattletail.charge();
    gameState.noiseLevel += 0.2;
  }
}

// Automated testing support
export function processAutomatedAction(action) {
  if (!action) return;
  
  // Simulate key press
  gameState.keys[action.keyCode] = true;
  
  // Handle immediate actions (non-continuous)
  if (action.keyCode === KEY_Z || action.keyCode === KEY_SPACE) {
    // These are handled in update
  }
  
  // Clear key after a frame
  setTimeout(() => {
    gameState.keys[action.keyCode] = false;
  }, 50);
}