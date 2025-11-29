// Input handling
import { gameState, KEY_LEFT, KEY_UP, KEY_RIGHT, KEY_DOWN, KEY_SPACE, KEY_SHIFT, KEY_Z, KEY_ENTER, KEY_ESC, KEY_R } from './globals.js';
import { resetGame } from './game_logic.js';

// Track key states
export const keys = {};

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
  
  // Phase controls
  if (p.keyCode === KEY_ENTER) {
    if (gameState.gamePhase === "START") {
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
      resetGame(p);
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

export function handlePlayerInput(p) {
  if (!gameState.player || gameState.gamePhase !== "PLAYING") return;
  
  let dx = 0;
  let dy = 0;
  
  if (isKeyPressed(KEY_LEFT)) dx -= 1;
  if (isKeyPressed(KEY_RIGHT)) dx += 1;
  if (isKeyPressed(KEY_UP)) dy -= 1;
  if (isKeyPressed(KEY_DOWN)) dy += 1;
  
  const focused = isKeyPressed(KEY_SHIFT);
  
  if (dx !== 0 || dy !== 0) {
    gameState.player.move(dx, dy, focused);
  }
  
  if (isKeyPressed(KEY_SPACE)) {
    gameState.player.shoot();
  }
  
  if (isKeyPressed(KEY_SHIFT) && !focused) {
    gameState.player.activateShield();
  }
  
  if (isKeyPressed(KEY_Z)) {
    gameState.player.useChargedSpell();
  }
}