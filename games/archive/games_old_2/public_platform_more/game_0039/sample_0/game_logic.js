// Core game logic
import { gameState } from './globals.js';
import { generatePuzzle, isPuzzleComplete, calculateGems } from './puzzle.js';

export function initializeGame(p) {
  // Generate first puzzle
  const puzzle = generatePuzzle(gameState.level);
  gameState.pieces = puzzle.pieces;
  gameState.targetCells = puzzle.targetCells;
  gameState.puzzleBoard = puzzle.board;
  gameState.selectedPieceIndex = 0;
  gameState.placedPieces = [];
  
  // Set player reference (use first piece as player entity)
  gameState.player = gameState.pieces[0];
  gameState.entities = [...gameState.pieces];
  
  // Initialize timing
  gameState.startTime = 0;
  gameState.elapsedTime = 0;
  gameState.score = 0;
  
  p.logs.game_info.push({
    data: { event: "game_initialized", level: gameState.level },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function updateGame(p) {
  if (gameState.gamePhase === "PLAYING") {
    // Update timer
    gameState.elapsedTime = Date.now() - gameState.startTime;
    
    // Check time limit
    if (gameState.elapsedTime >= gameState.timeLimit) {
      gameOver(p, false);
      return;
    }
    
    // Check win condition
    if (isPuzzleComplete(gameState.puzzleBoard, gameState.targetCells)) {
      gameOver(p, true);
    }
  }
}

function gameOver(p, won) {
  if (won) {
    gameState.gamePhase = "GAME_OVER_WIN";
    const gemsEarned = calculateGems(gameState.elapsedTime, gameState.level);
    gameState.score = gemsEarned;
    gameState.gems += gemsEarned;
    gameState.level++;
    
    p.logs.game_info.push({
      data: { 
        phase: "GAME_OVER_WIN", 
        time: gameState.elapsedTime,
        gems: gemsEarned,
        totalGems: gameState.gems
      },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  } else {
    gameState.gamePhase = "GAME_OVER_LOSE";
    gameState.score = 0;
    
    p.logs.game_info.push({
      data: { phase: "GAME_OVER_LOSE" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

export function resetToNewPuzzle(p) {
  const puzzle = generatePuzzle(gameState.level);
  gameState.pieces = puzzle.pieces;
  gameState.targetCells = puzzle.targetCells;
  gameState.puzzleBoard = puzzle.board;
  gameState.selectedPieceIndex = 0;
  gameState.placedPieces = [];
  gameState.player = gameState.pieces[0];
  gameState.entities = [...gameState.pieces];
  gameState.startTime = Date.now();
  gameState.elapsedTime = 0;
  gameState.score = 0;
}