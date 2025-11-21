// input.js - Input handling for keyboard

import { gameState } from './globals.js';
import { drawFromStockpile, undoLastMove, autoMoveToFoundation } from './gameLogic.js';

export function handleKeyPressed(p) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: p.key, keyCode: p.keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });

  if (gameState.controlMode !== "HUMAN") return;

  // ENTER - Start game
  if (p.keyCode === 13 && gameState.gamePhase === "START") {
    startGame(p);
  }
  
  // ESC - Pause/Unpause
  if (p.keyCode === 27 && (gameState.gamePhase === "PLAYING" || gameState.gamePhase === "PAUSED")) {
    togglePause(p);
  }
  
  // R - Restart
  if (p.keyCode === 82) {
    restartGame(p);
  }
  
  // Gameplay controls
  if (gameState.gamePhase === "PLAYING") {
    // Space - Draw from stockpile
    if (p.keyCode === 32) {
      drawFromStockpile();
      gameState.moves++;
    }
    
    // Z - Undo
    if (p.keyCode === 90) {
      undoLastMove();
    }
    
    // A - Auto-move
    if (p.keyCode === 65) {
      let moved = true;
      while (moved) {
        moved = autoMoveToFoundation();
      }
    }
  }
}

export function startGame(p) {
  gameState.gamePhase = "PLAYING";
  p.logs.game_info.push({
    data: { phase: "PLAYING", level: gameState.level },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function togglePause(p) {
  if (gameState.gamePhase === "PLAYING") {
    gameState.gamePhase = "PAUSED";
    p.logs.game_info.push({
      data: { phase: "PAUSED" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  } else if (gameState.gamePhase === "PAUSED") {
    gameState.gamePhase = "PLAYING";
    p.logs.game_info.push({
      data: { phase: "PLAYING" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

export function restartGame(p) {
  gameState.gamePhase = "START";
  gameState.score = 0;
  gameState.level = 1;
  gameState.timer = 300;
  gameState.moves = 0;
  gameState.numStockpileResets = 0;
  gameState.undoStack = [];
  
  p.logs.game_info.push({
    data: { phase: "START", action: "restart" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}