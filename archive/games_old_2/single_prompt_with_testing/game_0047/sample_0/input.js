// input.js
import { gameState, PLAYERS, BOARD_ROWS, BOARD_COLS } from './globals.js';
import { movePiece, dropPiece, getValidDropSquares, checkWinCondition } from './board.js';

export function handleGameInput(p) {
  if (gameState.controlMode !== 'HUMAN') return;

  const piece = gameState.board[gameState.cursorRow][gameState.cursorCol];

  // Handle drop mode
  if (gameState.dropMode) {
    handleDropModeInput(p, piece);
  } else {
    handleNormalModeInput(p, piece);
  }
}

function handleNormalModeInput(p, piece) {
  // Space to select/move
  if (p.keyCode === 32) { // SPACE
    if (gameState.selectedPiece === null) {
      // Try to select a piece
      if (piece && piece.player === gameState.currentPlayer) {
        gameState.selectedPiece = piece;
        gameState.selectedRow = gameState.cursorRow;
        gameState.selectedCol = gameState.cursorCol;
        gameState.validMoves = piece.getValidMoves(gameState.board);
      }
    } else {
      // Try to move selected piece
      const isValidMove = gameState.validMoves.some(
        move => move.row === gameState.cursorRow && move.col === gameState.cursorCol
      );
      
      if (isValidMove) {
        movePiece(
          gameState.selectedPiece, 
          gameState.cursorRow, 
          gameState.cursorCol, 
          gameState.board
        );
        
        // Log player move
        p.logs.player_info.push({
          screen_x: gameState.cursorCol * 80 + 150,
          screen_y: gameState.cursorRow * 80 + 50,
          game_x: gameState.cursorCol,
          game_y: gameState.cursorRow,
          framecount: p.frameCount,
          timestamp: Date.now()
        });
        
        // Check win condition
        const winner = checkWinCondition(gameState.board);
        if (winner) {
          gameState.winner = winner;
          gameState.gamePhase = 'GAME_OVER_WIN';
          
          p.logs.game_info.push({
            data: { gamePhase: 'GAME_OVER_WIN', winner: winner },
            framecount: p.frameCount,
            timestamp: Date.now()
          });
        } else {
          // Switch turns
          gameState.currentPlayer = gameState.currentPlayer === PLAYERS.PLAYER1 
            ? PLAYERS.PLAYER2 
            : PLAYERS.PLAYER1;
        }
        
        // Clear selection
        gameState.selectedPiece = null;
        gameState.validMoves = [];
      } else {
        // Deselect if clicking on invalid square
        gameState.selectedPiece = null;
        gameState.validMoves = [];
      }
    }
  }
}

function handleDropModeInput(p, piece) {
  const hand = gameState.currentPlayer === PLAYERS.PLAYER1 
    ? gameState.player1Hand 
    : gameState.player2Hand;

  // Space to select from hand or place piece
  if (p.keyCode === 32) { // SPACE
    if (gameState.selectedHandIndex === -1) {
      // Try to select from hand (for now, just select first piece)
      if (hand.length > 0) {
        gameState.selectedHandIndex = 0;
        gameState.validMoves = getValidDropSquares(gameState.board);
      }
    } else {
      // Try to drop piece
      const isValidDrop = gameState.validMoves.some(
        move => move.row === gameState.cursorRow && move.col === gameState.cursorCol
      );
      
      if (isValidDrop) {
        const pieceToPlace = hand[gameState.selectedHandIndex];
        pieceToPlace.player = gameState.currentPlayer;
        dropPiece(pieceToPlace, gameState.cursorRow, gameState.cursorCol, gameState.board);
        
        // Log drop
        p.logs.player_info.push({
          screen_x: gameState.cursorCol * 80 + 150,
          screen_y: gameState.cursorRow * 80 + 50,
          game_x: gameState.cursorCol,
          game_y: gameState.cursorRow,
          framecount: p.frameCount,
          timestamp: Date.now()
        });
        
        // Check win condition
        const winner = checkWinCondition(gameState.board);
        if (winner) {
          gameState.winner = winner;
          gameState.gamePhase = 'GAME_OVER_WIN';
          
          p.logs.game_info.push({
            data: { gamePhase: 'GAME_OVER_WIN', winner: winner },
            framecount: p.frameCount,
            timestamp: Date.now()
          });
        } else {
          // Switch turns
          gameState.currentPlayer = gameState.currentPlayer === PLAYERS.PLAYER1 
            ? PLAYERS.PLAYER2 
            : PLAYERS.PLAYER1;
        }
        
        // Clear selection and exit drop mode
        gameState.selectedHandIndex = -1;
        gameState.validMoves = [];
        gameState.dropMode = false;
      }
    }
  }
}

export function handleCursorMovement(p) {
  // Arrow keys
  if (p.keyCode === 37) { // LEFT
    gameState.cursorCol = Math.max(0, gameState.cursorCol - 1);
  } else if (p.keyCode === 39) { // RIGHT
    gameState.cursorCol = Math.min(BOARD_COLS - 1, gameState.cursorCol + 1);
  } else if (p.keyCode === 38) { // UP
    gameState.cursorRow = Math.max(0, gameState.cursorRow - 1);
  } else if (p.keyCode === 40) { // DOWN
    gameState.cursorRow = Math.min(BOARD_ROWS - 1, gameState.cursorRow + 1);
  }
}

export function toggleDropMode(p) {
  if (p.keyCode === 68) { // D key
    gameState.dropMode = !gameState.dropMode;
    
    if (!gameState.dropMode) {
      // Exiting drop mode
      gameState.selectedHandIndex = -1;
      gameState.validMoves = [];
    } else {
      // Entering drop mode
      gameState.selectedPiece = null;
      gameState.validMoves = [];
    }
  }
}