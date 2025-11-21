// Input handling
import { gameState } from './globals.js';
import { getDotPosition, areTouching } from './puzzles.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Game phase transitions
  if (keyCode === 13 && gameState.gamePhase === "START") { // ENTER
    startGame(p);
    return;
  }
  
  if (keyCode === 27) { // ESC
    togglePause(p);
    return;
  }
  
  if (keyCode === 82) { // R
    restartGame(p);
    return;
  }
  
  // Playing controls
  if (gameState.gamePhase === "PLAYING") {
    handlePlayingInput(p, keyCode);
  }
}

function handlePlayingInput(p, keyCode) {
  const { rows, cols } = gameState.puzzleData;
  
  // Arrow keys - move cursor
  if (keyCode >= 37 && keyCode <= 40) {
    const { row, col } = gameState.cursorPosition;
    let newRow = row;
    let newCol = col;
    
    if (keyCode === 37) newCol = Math.max(0, col - 1); // LEFT
    if (keyCode === 38) newRow = Math.max(0, row - 1); // UP
    if (keyCode === 39) newCol = Math.min(cols - 1, col + 1); // RIGHT
    if (keyCode === 40) newRow = Math.min(rows - 1, row + 1); // DOWN
    
    gameState.cursorPosition = { row: newRow, col: newCol };
    gameState.lastMoveTime = Date.now();
  }
  
  // Space - select dot and create connection
  if (keyCode === 32) {
    selectDot(p);
  }
  
  // Shift - undo last connection
  if (keyCode === 16) {
    undoLastConnection(p);
  }
  
  // Z - reset puzzle
  if (keyCode === 90) {
    resetPuzzle(p);
  }
}

function selectDot(p) {
  const { row, col } = gameState.cursorPosition;
  const { cols } = gameState.puzzleData;
  const dotIndex = row * cols + col;
  
  if (gameState.currentPath.length === 0) {
    // Start new path
    gameState.currentPath.push(dotIndex);
    logPlayerInfo(p);
  } else {
    const lastDot = gameState.currentPath[gameState.currentPath.length - 1];
    
    // Check if dots are adjacent
    if (!areTouching(lastDot, dotIndex, gameState.puzzleData.rows, gameState.puzzleData.cols)) {
      return; // Not adjacent
    }
    
    // Check if this connection exists in puzzle
    const connKey = `${Math.min(lastDot, dotIndex)}-${Math.max(lastDot, dotIndex)}`;
    if (!gameState.requiredConnections.has(connKey)) {
      return; // Not a valid connection
    }
    
    // Check if already completed
    if (gameState.completedConnections.has(connKey)) {
      return; // Already used
    }
    
    // Valid connection!
    gameState.currentPath.push(dotIndex);
    gameState.completedConnections.add(connKey);
    logPlayerInfo(p);
    
    // Check for completion
    checkPuzzleCompletion(p);
  }
}

function undoLastConnection(p) {
  if (gameState.currentPath.length <= 1) {
    gameState.currentPath = [];
    return;
  }
  
  // Remove last connection
  const lastDot = gameState.currentPath.pop();
  const secondLastDot = gameState.currentPath[gameState.currentPath.length - 1];
  
  const connKey = `${Math.min(lastDot, secondLastDot)}-${Math.max(lastDot, secondLastDot)}`;
  gameState.completedConnections.delete(connKey);
  
  logPlayerInfo(p);
}

function resetPuzzle(p) {
  gameState.currentPath = [];
  gameState.completedConnections.clear();
  gameState.puzzleComplete = false;
  logPlayerInfo(p);
}

function checkPuzzleCompletion(p) {
  if (gameState.completedConnections.size === gameState.requiredConnections.size) {
    // Puzzle complete!
    gameState.puzzleComplete = true;
    gameState.score += 100 * (gameState.currentPuzzle + 1);
    
    setTimeout(() => {
      if (gameState.currentPuzzle < gameState.totalPuzzles - 1) {
        // Next puzzle
        gameState.currentPuzzle++;
        loadPuzzle(p, gameState.currentPuzzle);
        resetPuzzle(p);
      } else {
        // All puzzles complete
        gameState.gamePhase = "GAME_OVER_WIN";
        p.logs.game_info.push({
          data: { gamePhase: "GAME_OVER_WIN" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }, 1000);
  }
}

function startGame(p) {
  gameState.gamePhase = "PLAYING";
  gameState.score = 0;
  gameState.currentPuzzle = 0;
  loadPuzzle(p, 0);
  
  p.logs.game_info.push({
    data: { gamePhase: "PLAYING" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function togglePause(p) {
  if (gameState.gamePhase === "PLAYING") {
    gameState.gamePhase = "PAUSED";
  } else if (gameState.gamePhase === "PAUSED") {
    gameState.gamePhase = "PLAYING";
  }
  
  p.logs.game_info.push({
    data: { gamePhase: gameState.gamePhase },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function restartGame(p) {
  gameState.gamePhase = "START";
  gameState.score = 0;
  gameState.currentPuzzle = 0;
  gameState.currentPath = [];
  gameState.completedConnections.clear();
  gameState.puzzleComplete = false;
  
  p.logs.game_info.push({
    data: { gamePhase: "START" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function loadPuzzle(p, puzzleIndex) {
  const puzzles = p.puzzles;
  if (puzzleIndex >= puzzles.length) return;
  
  const puzzle = puzzles[puzzleIndex];
  gameState.puzzleData = puzzle;
  gameState.gridSize = { rows: puzzle.rows, cols: puzzle.cols };
  
  // Build required connections set
  gameState.requiredConnections.clear();
  for (const [dot1, dot2] of puzzle.connections) {
    const connKey = `${Math.min(dot1, dot2)}-${Math.max(dot1, dot2)}`;
    gameState.requiredConnections.add(connKey);
  }
  
  gameState.cursorPosition = { row: 0, col: 0 };
}

function logPlayerInfo(p) {
  if (!gameState.puzzleData) return;
  
  const { row, col } = gameState.cursorPosition;
  
  p.logs.player_info.push({
    screen_x: col,
    screen_y: row,
    game_x: col,
    game_y: row,
    framecount: p.frameCount
  });
}