// input.js - Input handling

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { placeMark, isCellEmpty, checkWinner, isBoardFull } from './board.js';
import { makeAIMove } from './ai.js';
import { calculateRoundScore, updateScore, saveHighScore, resetScore } from './scoring.js';
import { initializeBoard } from './board.js';
import { LEVEL_CONFIGS } from './globals.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: 'keyPressed',
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Global controls
  if (keyCode === 13) { // ENTER
    handleEnterKey(p);
    return;
  }
  
  if (keyCode === 82) { // R
    handleRestartKey(p);
    return;
  }
  
  if (keyCode === 27) { // ESC
    handleEscapeKey(p);
    return;
  }
  
  // State-specific controls
  if (gameState.gamePhase === "PLAYING") {
    handlePlayingInput(p, keyCode);
  } else if (gameState.gamePhase === "LEVEL_SELECT") {
    handleLevelSelectInput(p, keyCode);
  } else if (gameState.gamePhase === "GAME_OVER_WIN" || 
             gameState.gamePhase === "GAME_OVER_LOSE" || 
             gameState.gamePhase === "GAME_OVER_DRAW") {
    handleGameOverInput(p, keyCode);
  } else if (gameState.gamePhase === "START") {
    handleStartInput(p, keyCode);
  } else if (gameState.gamePhase === "INSTRUCTIONS" || 
             gameState.gamePhase === "HIGH_SCORES") {
    handleMenuBackInput(p, keyCode);
  }
}

function handleEnterKey(p) {
  if (gameState.gamePhase === "START") {
    gameState.gamePhase = "LEVEL_SELECT";
    gameState.menuSelection = 0;
    logGameInfo(p);
  } else if (gameState.gamePhase === "LEVEL_SELECT") {
    startLevel(p, gameState.menuSelection + 1);
  } else if (gameState.gamePhase === "INSTRUCTIONS" || 
             gameState.gamePhase === "HIGH_SCORES") {
    gameState.gamePhase = "START";
    gameState.menuSelection = 0;
    logGameInfo(p);
  } else if (gameState.gamePhase === "GAME_OVER_WIN" || 
             gameState.gamePhase === "GAME_OVER_LOSE" || 
             gameState.gamePhase === "GAME_OVER_DRAW") {
    // Play again
    startLevel(p, gameState.currentLevel);
  }
}

function handleRestartKey(p) {
  gameState.gamePhase = "START";
  gameState.menuSelection = 0;
  resetScore();
  logGameInfo(p);
}

function handleEscapeKey(p) {
  if (gameState.gamePhase === "PLAYING") {
    gameState.gamePhase = "PAUSED";
    logGameInfo(p);
  } else if (gameState.gamePhase === "PAUSED") {
    gameState.gamePhase = "PLAYING";
    logGameInfo(p);
  }
}

function handlePlayingInput(p, keyCode) {
  if (gameState.currentPlayer !== 1) return; // Not player's turn
  
  const size = gameState.currentGridSize;
  
  // Arrow key navigation
  if (keyCode === 37 || keyCode === 65) { // LEFT or A
    gameState.selectedCell.col = Math.max(0, gameState.selectedCell.col - 1);
  } else if (keyCode === 39 || keyCode === 68) { // RIGHT or D
    gameState.selectedCell.col = Math.min(size - 1, gameState.selectedCell.col + 1);
  } else if (keyCode === 38 || keyCode === 87) { // UP or W
    gameState.selectedCell.row = Math.max(0, gameState.selectedCell.row - 1);
  } else if (keyCode === 40 || keyCode === 83) { // DOWN or S
    gameState.selectedCell.row = Math.min(size - 1, gameState.selectedCell.row + 1);
  } else if (keyCode === 32) { // SPACE
    handlePlayerMove(p);
  }
  
  updatePlayerPosition();
}

function handlePlayerMove(p) {
  const row = gameState.selectedCell.row;
  const col = gameState.selectedCell.col;
  
  if (placeMark(row, col, 1)) {
    logPlayerInfo(p);
    checkGameEnd(p);
    
    if (gameState.gamePhase === "PLAYING") {
      gameState.currentPlayer = 2;
      // AI will move in the next update
    }
  }
}

function handleLevelSelectInput(p, keyCode) {
  if (keyCode === 38) { // UP
    gameState.menuSelection = Math.max(0, gameState.menuSelection - 1);
  } else if (keyCode === 40) { // DOWN
    gameState.menuSelection = Math.min(gameState.unlockedLevels - 1, gameState.menuSelection + 1);
  } else if (keyCode === 32) { // SPACE
    startLevel(p, gameState.menuSelection + 1);
  }
}

function handleGameOverInput(p, keyCode) {
  if (keyCode === 16) { // SHIFT - replay current level
    startLevel(p, gameState.currentLevel);
  } else if (keyCode === 32) { // SPACE - next level or replay
    if (gameState.gamePhase === "GAME_OVER_WIN" && gameState.currentLevel < 5) {
      startLevel(p, gameState.currentLevel + 1);
    } else {
      startLevel(p, gameState.currentLevel);
    }
  }
}

function handleStartInput(p, keyCode) {
  if (keyCode === 38) { // UP
    gameState.menuSelection = Math.max(0, gameState.menuSelection - 1);
  } else if (keyCode === 40) { // DOWN
    gameState.menuSelection = Math.min(2, gameState.menuSelection + 1);
  } else if (keyCode === 32) { // SPACE
    if (gameState.menuSelection === 0) {
      gameState.gamePhase = "LEVEL_SELECT";
      gameState.menuSelection = 0;
      logGameInfo(p);
    } else if (gameState.menuSelection === 1) {
      gameState.gamePhase = "INSTRUCTIONS";
      logGameInfo(p);
    } else if (gameState.menuSelection === 2) {
      gameState.gamePhase = "HIGH_SCORES";
      logGameInfo(p);
    }
  }
}

function handleMenuBackInput(p, keyCode) {
  if (keyCode === 32 || keyCode === 27) { // SPACE or ESC
    gameState.gamePhase = "START";
    gameState.menuSelection = 0;
    logGameInfo(p);
  }
}

function startLevel(p, level) {
  const config = LEVEL_CONFIGS[level - 1];
  if (!config) return;
  
  gameState.currentLevel = level;
  gameState.maxTurnsForLevel = config.maxTurns;
  initializeBoard(config.gridSize);
  gameState.currentPlayer = 1;
  gameState.gamePhase = "PLAYING";
  
  logGameInfo(p);
}

function checkGameEnd(p) {
  const result = checkWinner();
  
  if (result) {
    gameState.lastWinningLine = result.line;
    gameState.winner = result.winner;
    
    if (result.winner === 1) {
      const roundScore = calculateRoundScore(true, gameState.turnCount);
      updateScore(roundScore);
      
      if (gameState.currentLevel >= gameState.unlockedLevels && gameState.currentLevel < 5) {
        gameState.unlockedLevels = gameState.currentLevel + 1;
      }
      
      gameState.gamePhase = "GAME_OVER_WIN";
      saveHighScore();
    } else {
      const roundScore = calculateRoundScore(false, gameState.turnCount);
      updateScore(roundScore);
      gameState.gamePhase = "GAME_OVER_LOSE";
      saveHighScore();
    }
    
    logGameInfo(p);
    return;
  }
  
  if (isBoardFull()) {
    gameState.winner = 'draw';
    const roundScore = calculateRoundScore(false, gameState.turnCount);
    updateScore(roundScore);
    gameState.gamePhase = "GAME_OVER_DRAW";
    saveHighScore();
    logGameInfo(p);
  }
}

function updatePlayerPosition() {
  const cellSize = getCellSize();
  const startX = getStartX();
  const startY = getStartY();
  
  gameState.player.screen_x = startX + gameState.selectedCell.col * cellSize + cellSize / 2;
  gameState.player.screen_y = startY + gameState.selectedCell.row * cellSize + cellSize / 2;
  gameState.player.game_x = gameState.selectedCell.col;
  gameState.player.game_y = gameState.selectedCell.row;
}

function getCellSize() {
  const boardSize = Math.min(CANVAS_WIDTH * 0.8, CANVAS_HEIGHT * 0.7);
  return boardSize / gameState.currentGridSize;
}

function getStartX() {
  const cellSize = getCellSize();
  const boardSize = cellSize * gameState.currentGridSize;
  return (CANVAS_WIDTH - boardSize) / 2;
}

function getStartY() {
  const cellSize = getCellSize();
  const boardSize = cellSize * gameState.currentGridSize;
  return 60 + (CANVAS_HEIGHT - 60 - boardSize) / 2;
}

function logGameInfo(p) {
  p.logs.game_info.push({
    data: { gamePhase: gameState.gamePhase },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function logPlayerInfo(p) {
  p.logs.player_info.push({
    screen_x: gameState.player.screen_x,
    screen_y: gameState.player.screen_y,
    game_x: gameState.player.game_x,
    game_y: gameState.player.game_y,
    framecount: p.frameCount
  });
}

export function updateAI(p) {
  if (gameState.gamePhase === "PLAYING" && gameState.currentPlayer === 2) {
    // Add slight delay for AI move
    if (p.frameCount % 30 === 0) {
      makeAIMove(p);
      checkGameEnd(p);
      
      if (gameState.gamePhase === "PLAYING") {
        gameState.currentPlayer = 1;
      }
    }
  }
}