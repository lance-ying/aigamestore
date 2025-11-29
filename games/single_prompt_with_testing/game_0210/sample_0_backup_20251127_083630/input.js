// Input handling
import { gameState, KEY_LEFT, KEY_RIGHT, KEY_SPACE, KEY_ENTER, KEY_ESC, KEY_R } from './globals.js';
import { resetGame } from './game.js';

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
    if (p.keyCode === KEY_ENTER) {
      if (gameState.gamePhase === "START") {
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
        gameState.gamePhase = "START";
      }
    }
    
    // Gameplay inputs
    if (gameState.gamePhase === "PLAYING") {
      if (p.keyCode === KEY_SPACE && gameState.player) {
        gameState.player.flipGravity(p);
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
  if (!gameState.player || gameState.gamePhase !== "PLAYING") return;
  
  if (isKeyPressed(KEY_LEFT)) {
    gameState.player.moveLeft();
  }
  
  if (isKeyPressed(KEY_RIGHT)) {
    gameState.player.moveRight();
  }
}