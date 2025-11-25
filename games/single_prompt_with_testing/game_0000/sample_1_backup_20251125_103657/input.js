// input.js - Input handling and keyboard state

import { gameState, KEYS } from './globals.js';

export const keys = {};

export function handleKeyPress(p) {
  keys[p.keyCode] = true;
  
  // Log input
  p.logs.inputs.push({
    input_type: 'keyPressed',
    data: { key: p.key, keyCode: p.keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Phase control keys
  if (p.keyCode === KEYS.ENTER && gameState.gamePhase === "START") {
    gameState.gamePhase = "PLAYING";
    p.logs.game_info.push({
      data: { gamePhase: "PLAYING", event: "game_started" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  if (p.keyCode === KEYS.ESC) {
    if (gameState.gamePhase === "PLAYING") {
      gameState.gamePhase = "PAUSED";
      p.logs.game_info.push({
        data: { gamePhase: "PAUSED" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === "PAUSED") {
      gameState.gamePhase = "PLAYING";
      p.logs.game_info.push({
        data: { gamePhase: "PLAYING" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  if (p.keyCode === KEYS.R) {
    if (gameState.gamePhase === "GAME_OVER_WIN" || 
        gameState.gamePhase === "GAME_OVER_LOSE") {
      p.logs.game_info.push({
        data: { event: "restart_requested" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
}

export function handleKeyRelease(p) {
  keys[p.keyCode] = false;
  
  // Log input
  p.logs.inputs.push({
    input_type: 'keyReleased',
    data: { key: p.key, keyCode: p.keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function isKeyPressed(keyCode) {
  return keys[keyCode] === true;
}