// input.js - Input handling

import { gameState, KEY_LEFT, KEY_RIGHT, KEY_UP, KEY_DOWN, KEY_SPACE, KEY_SHIFT, KEY_Z, KEY_ENTER, KEY_ESC, KEY_R } from './globals.js';

const keys = {};

export function initializeInput(p) {
  // Key pressed handler
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
    
    // Phase-specific controls
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
    
    if (p.keyCode === KEY_ESC) {
      if (gameState.gamePhase === "PLAYING") {
        gameState.gamePhase = "PAUSED";
      } else if (gameState.gamePhase === "PAUSED") {
        gameState.gamePhase = "PLAYING";
      }
    }
    
    if (p.keyCode === KEY_R) {
      if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
        resetGame(p);
        gameState.gamePhase = "START";
      }
    }
  };
  
  // Key released handler
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

export function isKeyPressed(keyCode) {
  return keys[keyCode] === true;
}

export function handleGameplayInput(p) {
  if (gameState.gamePhase !== "PLAYING") return;
  
  const player = gameState.player;
  if (!player) return;
  
  // Movement
  if (isKeyPressed(KEY_LEFT)) {
    player.moveLeft();
  }
  if (isKeyPressed(KEY_RIGHT)) {
    player.moveRight();
  }
  if (isKeyPressed(KEY_UP)) {
    player.jump();
  }
  
  // Character switching
  if (isKeyPressed(KEY_SPACE) && !keys.spaceUsed) {
    keys.spaceUsed = true;
    switchCharacter();
  }
  if (!isKeyPressed(KEY_SPACE)) {
    keys.spaceUsed = false;
  }
}

function switchCharacter() {
  if (gameState.activeCharacter === 'brother') {
    gameState.activeCharacter = 'sister';
    gameState.player = gameState.sister;
    gameState.brother.isActive = false;
    gameState.sister.isActive = true;
  } else {
    gameState.activeCharacter = 'brother';
    gameState.player = gameState.brother;
    gameState.sister.isActive = false;
    gameState.brother.isActive = true;
  }
}

function resetGame(p) {
  // This will be called from game.js initialization
  // Just change phase here
}