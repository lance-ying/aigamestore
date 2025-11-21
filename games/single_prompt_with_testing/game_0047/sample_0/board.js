// board.js
import { BOARD_ROWS, BOARD_COLS, PLAYERS, PIECE_TYPES, gameState } from './globals.js';
import { Piece } from './pieces.js';

export function initializeBoard() {
  const board = [];
  for (let i = 0; i < BOARD_ROWS; i++) {
    board[i] = [];
    for (let j = 0; j < BOARD_COLS; j++) {
      board[i][j] = null;
    }
  }

  // Player 2 (top) - row 0
  board[0][0] = new Piece(PIECE_TYPES.GIRAFFE, PLAYERS.PLAYER2, 0, 0);
  board[0][1] = new Piece(PIECE_TYPES.LION, PLAYERS.PLAYER2, 0, 1);
  board[0][2] = new Piece(PIECE_TYPES.ELEPHANT, PLAYERS.PLAYER2, 0, 2);
  
  // Player 2 chick - row 1
  board[1][1] = new Piece(PIECE_TYPES.CHICK, PLAYERS.PLAYER2, 1, 1);

  // Player 1 chick - row 2
  board[2][1] = new Piece(PIECE_TYPES.CHICK, PLAYERS.PLAYER1, 2, 1);

  // Player 1 (bottom) - row 3
  board[3][0] = new Piece(PIECE_TYPES.ELEPHANT, PLAYERS.PLAYER1, 3, 0);
  board[3][1] = new Piece(PIECE_TYPES.LION, PLAYERS.PLAYER1, 3, 1);
  board[3][2] = new Piece(PIECE_TYPES.GIRAFFE, PLAYERS.PLAYER1, 3, 2);

  return board;
}

export function movePiece(piece, toRow, toCol, board) {
  const fromRow = piece.row;
  const fromCol = piece.col;

  // Check for capture
  const capturedPiece = board[toRow][toCol];
  if (capturedPiece) {
    capturePiece(capturedPiece);
  }

  // Move the piece
  board[fromRow][fromCol] = null;
  piece.row = toRow;
  piece.col = toCol;
  board[toRow][toCol] = piece;

  // Check for promotion
  if (piece.shouldPromote()) {
    piece.promote();
  }

  return capturedPiece;
}

export function capturePiece(piece) {
  // Reset to original type if promoted
  if (piece.promoted && piece.type === PIECE_TYPES.CHICKEN) {
    piece.type = PIECE_TYPES.CHICK;
    piece.promoted = false;
  }

  // Add to capturing player's hand (opposite of captured piece's player)
  if (piece.player === PLAYERS.PLAYER1) {
    gameState.player2Hand.push(piece);
  } else {
    gameState.player1Hand.push(piece);
  }
}

export function dropPiece(piece, toRow, toCol, board) {
  piece.row = toRow;
  piece.col = toCol;
  board[toRow][toCol] = piece;

  // Remove from hand
  if (piece.player === PLAYERS.PLAYER1) {
    const index = gameState.player1Hand.indexOf(piece);
    if (index > -1) {
      gameState.player1Hand.splice(index, 1);
    }
  } else {
    const index = gameState.player2Hand.indexOf(piece);
    if (index > -1) {
      gameState.player2Hand.splice(index, 1);
    }
  }
}

export function getValidDropSquares(board) {
  const validSquares = [];
  for (let row = 0; row < BOARD_ROWS; row++) {
    for (let col = 0; col < BOARD_COLS; col++) {
      if (board[row][col] === null) {
        validSquares.push({ row, col });
      }
    }
  }
  return validSquares;
}

export function checkWinCondition(board) {
  // Check if Lion is captured (not on board)
  let player1LionExists = false;
  let player2LionExists = false;

  for (let row = 0; row < BOARD_ROWS; row++) {
    for (let col = 0; col < BOARD_COLS; col++) {
      const piece = board[row][col];
      if (piece && piece.type === PIECE_TYPES.LION) {
        if (piece.player === PLAYERS.PLAYER1) {
          player1LionExists = true;
          // Check if in opponent's promotion zone (Tri)
          if (piece.row === 0) {
            return PLAYERS.PLAYER1;
          }
        } else {
          player2LionExists = true;
          // Check if in opponent's promotion zone (Tri)
          if (piece.row === BOARD_ROWS - 1) {
            return PLAYERS.PLAYER2;
          }
        }
      }
    }
  }

  if (!player1LionExists) {
    return PLAYERS.PLAYER2;
  }
  if (!player2LionExists) {
    return PLAYERS.PLAYER1;
  }

  return null;
}