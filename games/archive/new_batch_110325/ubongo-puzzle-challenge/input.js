// Input handling
import { gameState } from './globals.js';
import { isValidPlacement, placePiece, removePiece } from './puzzle.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
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
  
  if (keyCode === 27) { // ESC
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
    return;
  }
  
  if (keyCode === 82) { // R
    if (gameState.gamePhase.startsWith("GAME_OVER")) {
      resetGame(p);
    }
    return;
  }
  
  // Gameplay controls
  if (gameState.gamePhase === "PLAYING") {
    handleGameplayInput(p, keyCode);
  }
}

function handleGameplayInput(p, keyCode) {
  const piece = gameState.pieces[gameState.selectedPieceIndex];
  if (!piece || piece.placed) return;
  
  // Prevent rapid inputs
  const now = Date.now();
  if (now - gameState.lastMoveTime < gameState.moveDelay) {
    return;
  }
  gameState.lastMoveTime = now;
  
  const oldX = piece.x;
  const oldY = piece.y;
  
  // Movement
  if (keyCode === 37) { // LEFT
    piece.x--;
  } else if (keyCode === 39) { // RIGHT
    piece.x++;
  } else if (keyCode === 38) { // UP
    piece.y--;
  } else if (keyCode === 40) { // DOWN
    piece.y++;
  } else if (keyCode === 32) { // SPACE - Rotate
    piece.rotate();
  } else if (keyCode === 16) { // SHIFT - Flip
    piece.flip();
  } else if (keyCode === 90) { // Z - Select next piece
    selectNextPiece();
    return;
  } else {
    return;
  }
  
  // Validate movement
  if (!isValidPlacement(piece, gameState.puzzleBoard, gameState.targetCells)) {
    piece.x = oldX;
    piece.y = oldY;
    
    // Undo rotation/flip if invalid
    if (keyCode === 32) {
      piece.rotate();
      piece.rotate();
      piece.rotate();
    } else if (keyCode === 16) {
      piece.flip();
    }
  } else {
    // Try to place piece if valid
    tryPlacePiece(piece);
  }
  
  // Log player position
  if (gameState.player) {
    p.logs.player_info.push({
      screen_x: piece.x,
      screen_y: piece.y,
      game_x: piece.x,
      game_y: piece.y,
      framecount: p.frameCount
    });
  }
}

function selectNextPiece() {
  let nextIndex = (gameState.selectedPieceIndex + 1) % gameState.pieces.length;
  let attempts = 0;
  
  while (gameState.pieces[nextIndex].placed && attempts < gameState.pieces.length) {
    nextIndex = (nextIndex + 1) % gameState.pieces.length;
    attempts++;
  }
  
  if (!gameState.pieces[nextIndex].placed) {
    gameState.selectedPieceIndex = nextIndex;
  }
}

function tryPlacePiece(piece) {
  if (isValidPlacement(piece, gameState.puzzleBoard, gameState.targetCells)) {
    placePiece(piece, gameState.puzzleBoard);
    selectNextPiece();
  }
}

function startGame(p) {
  gameState.gamePhase = "PLAYING";
  gameState.startTime = Date.now();
  gameState.elapsedTime = 0;
  
  p.logs.game_info.push({
    data: { phase: "PLAYING", level: gameState.level },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function resetGame(p) {
  gameState.gamePhase = "START";
  gameState.elapsedTime = 0;
  
  p.logs.game_info.push({
    data: { phase: "START" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function processAutomatedInput(p, action) {
  if (action && action.keyCode) {
    handleKeyPressed(p, action.key, action.keyCode);
  }
}