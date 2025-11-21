// input.js - Input handling

import { gameState, GRID_SIZE } from './globals.js';
import { setCellValue, clearCell, undoLastMove, checkPuzzleComplete } from './sudoku.js';

export function handleKeyPress(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  if (gameState.gamePhase === "START") {
    if (keyCode === 13) { // ENTER
      startGame(p);
    }
  } else if (gameState.gamePhase === "PLAYING") {
    // Arrow keys - navigation
    if (keyCode === 37) { // LEFT
      gameState.selectedCol = Math.max(0, gameState.selectedCol - 1);
    } else if (keyCode === 39) { // RIGHT
      gameState.selectedCol = Math.min(GRID_SIZE - 1, gameState.selectedCol + 1);
    } else if (keyCode === 38) { // UP
      gameState.selectedRow = Math.max(0, gameState.selectedRow - 1);
    } else if (keyCode === 40) { // DOWN
      gameState.selectedRow = Math.min(GRID_SIZE - 1, gameState.selectedRow + 1);
    }
    // Number keys 1-9
    else if (keyCode >= 49 && keyCode <= 57) { // 1-9
      const num = keyCode - 48;
      setCellValue(gameState.selectedRow, gameState.selectedCol, num);
      
      // Check win condition
      if (checkPuzzleComplete(gameState.grid)) {
        gameState.gamePhase = "GAME_OVER_WIN";
        logGameInfo(p, "Game Over - Win", { completedCells: gameState.completedCells });
      }
    }
    // Space - toggle mode
    else if (keyCode === 32) { // SPACE
      gameState.inputMode = gameState.inputMode === "SOLUTION" ? "PENCIL" : "SOLUTION";
    }
    // Shift - clear cell
    else if (keyCode === 16) { // SHIFT
      clearCell(gameState.selectedRow, gameState.selectedCol);
    }
    // Z - undo
    else if (keyCode === 90) { // Z
      undoLastMove();
    }
    // ESC - pause
    else if (keyCode === 27) { // ESC
      gameState.gamePhase = "PAUSED";
      logGameInfo(p, "Game Paused", {});
      p.noLoop();
    }
  } else if (gameState.gamePhase === "PAUSED") {
    if (keyCode === 27) { // ESC
      gameState.gamePhase = "PLAYING";
      logGameInfo(p, "Game Resumed", {});
      p.loop();
    }
  } else if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
    if (keyCode === 82) { // R
      resetGame(p);
    }
  }
  
  // R key - restart from any phase except START
  if (keyCode === 82 && gameState.gamePhase !== "START") {
    resetGame(p);
  }
}

function startGame(p) {
  gameState.gamePhase = "PLAYING";
  gameState.startTime = Date.now();
  gameState.timeElapsed = 0;
  logGameInfo(p, "Game Started", {});
}

function resetGame(p) {
  gameState.gamePhase = "START";
  gameState.score = 0;
  gameState.mistakes = 0;
  gameState.hintsUsed = 0;
  gameState.moveHistory = [];
  gameState.selectedRow = 4;
  gameState.selectedCol = 4;
  gameState.inputMode = "SOLUTION";
  logGameInfo(p, "Game Reset", {});
}

function logGameInfo(p, event, data) {
  p.logs.game_info.push({
    event,
    data: { ...data, gamePhase: gameState.gamePhase },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function logPlayerInfo(p) {
  // Log player position periodically
  if (p.frameCount % 60 === 0 && gameState.gamePhase === "PLAYING") {
    p.logs.player_info.push({
      screen_x: gameState.selectedCol,
      screen_y: gameState.selectedRow,
      game_x: gameState.selectedCol,
      game_y: gameState.selectedRow,
      framecount: p.frameCount
    });
  }
}