// Input handling
import { gameState } from './globals.js';

const keys = {};

export function setupInput(p) {
  p.keyPressed = function() {
    keys[p.keyCode] = true;
    handleKeyPress(p);
  };
  
  p.keyReleased = function() {
    keys[p.keyCode] = false;
    handleKeyRelease(p);
  };
}

function handleKeyPress(p) {
  // Log input
  if (p.logs && p.logs.inputs) {
    p.logs.inputs.push({
      input_type: 'keyPressed',
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  // Game phase controls
  if (p.keyCode === 13) { // ENTER
    if (gameState.gamePhase === "START") {
      startGame(p);
    }
  }
  
  if (p.keyCode === 27) { // ESC
    if (gameState.gamePhase === "PLAYING") {
      gameState.gamePhase = "PAUSED";
    } else if (gameState.gamePhase === "PAUSED") {
      gameState.gamePhase = "PLAYING";
    }
  }
  
  if (p.keyCode === 82) { // R
    if (gameState.gamePhase === "GAME_OVER_LOSE" || 
        gameState.gamePhase === "GAME_OVER_WIN") {
      resetGame(p);
    }
  }
  
  // Gameplay controls
  if (gameState.gamePhase === "PLAYING" && gameState.player) {
    handleGameplayInput(p.keyCode);
  }
}

function handleKeyRelease(p) {
  // Log input
  if (p.logs && p.logs.inputs) {
    p.logs.inputs.push({
      input_type: 'keyReleased',
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

function handleGameplayInput(keyCode) {
  const player = gameState.player;
  if (!player || !player.isAlive) return;
  
  switch (keyCode) {
    case 37: // LEFT
      player.moveLeft();
      break;
    case 39: // RIGHT
      player.moveRight();
      break;
    case 38: // UP
    case 32: // SPACE
      player.jump();
      break;
    case 40: // DOWN
      player.slide();
      break;
  }
}

export function isKeyPressed(keyCode) {
  return keys[keyCode] === true;
}

function startGame(p) {
  gameState.gamePhase = "PLAYING";
  
  if (p.logs && p.logs.game_info) {
    p.logs.game_info.push({
      data: { gamePhase: "PLAYING" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

function resetGame(p) {
  // Import reset function
  if (window.gameResetFunction) {
    window.gameResetFunction(p);
  }
  gameState.gamePhase = "START";
}