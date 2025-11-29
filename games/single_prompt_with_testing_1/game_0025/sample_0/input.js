import { gameState, GAME_CONFIG } from './globals.js';
import { revealCell, quickOpen, toggleFlag, placeMines, checkWinCondition, initializeGrid } from './grid.js';
import { Player } from './player.js';

export function handleKeyPressed(key, keyCode, p) {
  // Log the input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Game phase transitions
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === "START") {
      startGame(p);
    }
    return;
  }
  
  if (keyCode === 82) { // R
    if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
      resetToStart(p);
    }
    return;
  }
  
  if (keyCode === 27) { // ESC
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
    return;
  }
  
  // Gameplay controls
  if (gameState.gamePhase !== "PLAYING") return;
  
  const player = gameState.player;
  if (!player) return;
  
  // Movement
  if (keyCode === 37) { // LEFT
    player.moveCursor(-1, 0);
    logPlayerInfo(p);
  } else if (keyCode === 39) { // RIGHT
    player.moveCursor(1, 0);
    logPlayerInfo(p);
  } else if (keyCode === 38) { // UP
    player.moveCursor(0, -1);
    logPlayerInfo(p);
  } else if (keyCode === 40) { // DOWN
    player.moveCursor(0, 1);
    logPlayerInfo(p);
  }
  
  // Reveal / Quick Open
  else if (keyCode === 32) { // SPACE
    handleRevealAction(p);
  }
  
  // Toggle Flag
  else if (keyCode === 90) { // Z
    handleFlagAction(p);
  }
  
  // Toggle Quick Flag Mode
  else if (keyCode === 16) { // SHIFT
    gameState.quickFlagMode = !gameState.quickFlagMode;
  }
}

function handleRevealAction(p) {
  const row = gameState.player.cursorRow;
  const col = gameState.player.cursorCol;
  const cell = gameState.grid[row][col];
  
  // First click - place mines
  if (gameState.firstClick) {
    placeMines(gameState.grid, row, col, GAME_CONFIG.mines);
    gameState.firstClick = false;
    gameState.startTime = Date.now();
  }
  
  // If cell is revealed and has a number, try quick open
  if (cell.revealed && cell.adjacentMines > 0) {
    const result = quickOpen(gameState.grid, row, col, p);
    if (result === -1) {
      gameOver(false, p);
    } else if (result > 0) {
      gameState.revealedCount += result;
      checkWin(p);
    }
  }
  // Otherwise reveal the cell
  else if (!cell.revealed && !cell.flagged) {
    const result = revealCell(gameState.grid, row, col, p);
    if (result === -1) {
      gameOver(false, p);
    } else if (result > 0) {
      gameState.revealedCount += result;
      checkWin(p);
    }
  }
  
  logPlayerInfo(p);
}

function handleFlagAction(p) {
  const row = gameState.player.cursorRow;
  const col = gameState.player.cursorCol;
  
  const result = toggleFlag(gameState.grid, row, col);
  gameState.flagCount += result;
  
  logPlayerInfo(p);
}

function checkWin(p) {
  if (checkWinCondition(gameState.grid)) {
    gameOver(true, p);
  }
}

function gameOver(won, p) {
  gameState.gamePhase = won ? "GAME_OVER_WIN" : "GAME_OVER_LOSE";
  gameState.gameResult = won ? "WIN" : "LOSE";
  
  if (won) {
    gameState.elapsedTime = Math.floor((Date.now() - gameState.startTime) / 1000);
    gameState.score = gameState.elapsedTime;
  }
  
  // Reveal all mines if lost
  if (!won) {
    for (let row = 0; row < GAME_CONFIG.rows; row++) {
      for (let col = 0; col < GAME_CONFIG.cols; col++) {
        if (gameState.grid[row][col].isMine) {
          gameState.grid[row][col].revealed = true;
        }
      }
    }
  }
  
  p.logs.game_info.push({
    data: { gamePhase: gameState.gamePhase, won },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function startGame(p) {
  gameState.gamePhase = "PLAYING";
  gameState.grid = initializeGrid();
  gameState.cursorX = 0;
  gameState.cursorY = 0;
  gameState.flagCount = 0;
  gameState.revealedCount = 0;
  gameState.firstClick = true;
  gameState.quickFlagMode = false;
  gameState.score = 0;
  gameState.elapsedTime = 0;
  gameState.startTime = 0;
  gameState.gameResult = null;
  
  gameState.player = new Player(0, 0);
  gameState.entities = [gameState.player];
  
  p.logs.game_info.push({
    data: { gamePhase: "PLAYING" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function resetToStart(p) {
  gameState.gamePhase = "START";
  gameState.grid = [];
  gameState.player = null;
  gameState.entities = [];
  gameState.cursorX = 0;
  gameState.cursorY = 0;
  gameState.flagCount = 0;
  gameState.revealedCount = 0;
  gameState.firstClick = true;
  gameState.score = 0;
  gameState.elapsedTime = 0;
  gameState.gameResult = null;
  
  p.logs.game_info.push({
    data: { gamePhase: "START" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function logPlayerInfo(p) {
  if (!gameState.player) return;
  
  const { gridOffsetX, gridOffsetY, cellSize } = GAME_CONFIG;
  const screenX = gridOffsetX + gameState.player.cursorCol * cellSize;
  const screenY = gridOffsetY + gameState.player.cursorRow * cellSize;
  
  p.logs.player_info.push({
    screen_x: screenX,
    screen_y: screenY,
    game_x: gameState.player.cursorCol,
    game_y: gameState.player.cursorRow,
    framecount: p.frameCount
  });
}