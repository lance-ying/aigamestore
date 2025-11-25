import { gameState } from './globals.js';

const keys = {};

export function setupInput() {
  document.addEventListener('keydown', (event) => {
    logInput('keydown', event.key, event.keyCode);
    keys[event.keyCode] = true;
    
    // Phase controls
    if (event.keyCode === 13 && gameState.gamePhase === "START") { // ENTER
      startGame();
    }
    
    if (event.keyCode === 27) { // ESC
      if (gameState.gamePhase === "PLAYING") {
        pauseGame();
      } else if (gameState.gamePhase === "PAUSED") {
        resumeGame();
      }
    }
    
    if (event.keyCode === 82) { // R - Restart
      if (gameState.gamePhase === "GAME_OVER_WIN" || 
          gameState.gamePhase === "GAME_OVER_LOSE") {
        restartGame();
      }
    }
    
    // Gameplay controls
    if (gameState.gamePhase === "PLAYING" && gameState.player) {
      if (event.keyCode === 37 || event.keyCode === 65) { // Left Arrow or A
        gameState.player.moveLeft();
      }
      if (event.keyCode === 39 || event.keyCode === 68) { // Right Arrow or D
        gameState.player.moveRight();
      }
      if (event.keyCode === 38 || event.keyCode === 87) { // Up Arrow or W
        gameState.player.jump();
      }
      if (event.keyCode === 40 || event.keyCode === 83) { // Down Arrow or S
        gameState.player.slide();
      }
    }
  });
  
  document.addEventListener('keyup', (event) => {
    logInput('keyup', event.key, event.keyCode);
    keys[event.keyCode] = false;
  });
}

function logInput(inputType, key, keyCode) {
  if (window.logs && window.logs.inputs) {
    window.logs.inputs.push({
      input_type: inputType,
      data: { key, keyCode },
      framecount: gameState.frameCount,
      timestamp: Date.now()
    });
  }
}

function startGame() {
  gameState.gamePhase = "PLAYING";
  
  if (window.logs && window.logs.game_info) {
    window.logs.game_info.push({
      game_status: "PLAYING",
      data: {},
      framecount: gameState.frameCount,
      timestamp: Date.now()
    });
  }
}

function pauseGame() {
  gameState.gamePhase = "PAUSED";
  
  if (window.logs && window.logs.game_info) {
    window.logs.game_info.push({
      game_status: "PAUSED",
      data: {},
      framecount: gameState.frameCount,
      timestamp: Date.now()
    });
  }
}

function resumeGame() {
  gameState.gamePhase = "PLAYING";
  
  if (window.logs && window.logs.game_info) {
    window.logs.game_info.push({
      game_status: "PLAYING",
      data: {},
      framecount: gameState.frameCount,
      timestamp: Date.now()
    });
  }
}

function restartGame() {
  // Will be handled in game.js
  gameState.gamePhase = "START";
}

export function getKeys() {
  return keys;
}