// input.js - Input handling (TAP-BASED for VLM compatibility)

import { gameState, GAME_PHASES, GAME_STATES, TURN, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { placeMarkOnBoard, isCellEmpty } from './board.js';
import { startGame, restartGame, togglePause } from './gameLogic.js';

let p;

// Key state tracking to ensure tap-based input (prevent repeated firing when held)
const keyState = {};

export function initInput(p5Instance) {
  p = p5Instance;
}

// Reset key state when released - enables next tap
export function handleKeyReleased(keyCode) {
  keyState[keyCode] = false;
}

// TAP-BASED INPUT: Each keypress triggers ONE discrete action
// Keys must be released and pressed again to trigger another action
export function handleKeyPressed(key, keyCode) {
  // Prevent repeated firing if key is held down
  if (keyState[keyCode]) {
    return;
  }
  keyState[keyCode] = true;
  
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // ENTER - Start game (single tap)
  if (keyCode === 13) {
    if (gameState.gamePhase === GAME_PHASES.START) {
      startGame();
    }
    return;
  }
  
  // ESC - Pause/Unpause (single tap)
  if (keyCode === 27) {
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      togglePause();
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      togglePause();
    }
    return;
  }
  
  // R - Restart (single tap)
  if (keyCode === 82) {
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      restartGame();
    }
    return;
  }
  
  // Game controls during PLAYING phase
  if (gameState.gamePhase === GAME_PHASES.PLAYING && 
      gameState.gameStatus === GAME_STATES.PLAYING &&
      gameState.currentTurn === TURN.PLAYER) {
    
    // Arrow keys - Navigate grid (single tap moves one cell)
    if (keyCode === 37) { // Left arrow
      moveSelection(-1, 0);
    } else if (keyCode === 39) { // Right arrow
      moveSelection(1, 0);
    } else if (keyCode === 38) { // Up arrow
      moveSelection(0, -1);
    } else if (keyCode === 40) { // Down arrow
      moveSelection(0, 1);
    } else if (keyCode === 32 || keyCode === 90) { // Space or Z
      attemptPlaceMark();
    }
  }
  
  // Handle other game states
  if (gameState.gameStatus === GAME_STATES.LEVEL_COMPLETE) {
    if (keyCode === 32 || keyCode === 90) { // Space or Z
      proceedToNextLevel();
    }
  }
  
  if (gameState.gameStatus === GAME_STATES.GAME_OVER) {
    if (keyCode === 32 || keyCode === 90) { // Space or Z
      restartGame();
    }
  }
}

// TAP-BASED: Single tap moves selection by one cell
// No continuous movement - each tap is discrete
function moveSelection(deltaCol, deltaRow) {
  const [row, col] = gameState.selectedCell;
  let newCol = (col + deltaCol + gameState.boardSize) % gameState.boardSize;
  let newRow = (row + deltaRow + gameState.boardSize) % gameState.boardSize;
  
  gameState.selectedCell = [newRow, newCol];
  updatePlayerInfo();
}

// TAP-BASED: Single tap places one mark
function attemptPlaceMark() {
  const [row, col] = gameState.selectedCell;
  
  if (isCellEmpty(row, col)) {
    placeMarkOnBoard(row, col, "X");
    gameState.currentTurn = TURN.AI;
    gameState.aiMoveDelay = 30; // Delay AI move by 0.5 seconds (30 frames)
  }
}

function proceedToNextLevel() {
  if (gameState.currentLevel < 5) {
    gameState.currentLevel++;
    gameState.gameStatus = GAME_STATES.PLAYING;
    gameState.levelCompleteTimer = 0;
    
    // Initialize new level
    const { initializeLevel } = require('./gameLogic.js');
    initializeLevel();
  } else {
    // Game complete
    gameState.gameStatus = GAME_STATES.GAME_OVER;
    gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
    gameState.winner = "COMPLETE";
  }
}

function updatePlayerInfo() {
  const cellSize = calculateCellSize();
  const gridStartX = (CANVAS_WIDTH - cellSize * gameState.boardSize) / 2;
  const gridStartY = (CANVAS_HEIGHT - cellSize * gameState.boardSize) / 2 + 30;
  
  const [row, col] = gameState.selectedCell;
  gameState.player.selectedRow = row;
  gameState.player.selectedCol = col;
  gameState.player.x = gridStartX + col * cellSize + cellSize / 2;
  gameState.player.y = gridStartY + row * cellSize + cellSize / 2;
  
  p.logs.player_info.push({
    screen_x: gameState.player.x,
    screen_y: gameState.player.y,
    game_x: col,
    game_y: row,
    framecount: p.frameCount
  });
}

function calculateCellSize() {
  const maxSize = Math.min(CANVAS_WIDTH - 100, CANVAS_HEIGHT - 150);
  return Math.floor(maxSize / gameState.boardSize);
}