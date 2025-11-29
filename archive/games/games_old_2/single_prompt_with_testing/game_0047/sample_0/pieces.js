// pieces.js
import { PIECE_TYPES, PLAYERS, BOARD_ROWS, BOARD_COLS } from './globals.js';

export class Piece {
  constructor(type, player, row, col) {
    this.type = type;
    this.player = player;
    this.row = row;
    this.col = col;
    this.promoted = false;
  }

  getValidMoves(board) {
    const moves = [];
    const direction = this.player === PLAYERS.PLAYER1 ? -1 : 1;

    switch (this.type) {
      case PIECE_TYPES.LION:
        // Lion moves one square in any direction
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const newRow = this.row + dr;
            const newCol = this.col + dc;
            if (this.isValidSquare(newRow, newCol, board)) {
              moves.push({ row: newRow, col: newCol });
            }
          }
        }
        break;

      case PIECE_TYPES.GIRAFFE:
        // Giraffe moves one square horizontally or vertically
        const giraffeOffsets = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        for (const [dr, dc] of giraffeOffsets) {
          const newRow = this.row + dr;
          const newCol = this.col + dc;
          if (this.isValidSquare(newRow, newCol, board)) {
            moves.push({ row: newRow, col: newCol });
          }
        }
        break;

      case PIECE_TYPES.ELEPHANT:
        // Elephant moves one square diagonally
        const elephantOffsets = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
        for (const [dr, dc] of elephantOffsets) {
          const newRow = this.row + dr;
          const newCol = this.col + dc;
          if (this.isValidSquare(newRow, newCol, board)) {
            moves.push({ row: newRow, col: newCol });
          }
        }
        break;

      case PIECE_TYPES.CHICK:
        // Chick moves one square forward
        const newRow = this.row + direction;
        const newCol = this.col;
        if (this.isValidSquare(newRow, newCol, board)) {
          moves.push({ row: newRow, col: newCol });
        }
        break;

      case PIECE_TYPES.CHICKEN:
        // Chicken moves one square in any direction except backward diagonally
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            // Exclude backward diagonal moves
            if (dr === -direction && dc !== 0) continue;
            const newRow = this.row + dr;
            const newCol = this.col + dc;
            if (this.isValidSquare(newRow, newCol, board)) {
              moves.push({ row: newRow, col: newCol });
            }
          }
        }
        break;
    }

    return moves;
  }

  isValidSquare(row, col, board) {
    if (row < 0 || row >= BOARD_ROWS || col < 0 || col >= BOARD_COLS) {
      return false;
    }
    const targetPiece = board[row][col];
    if (targetPiece && targetPiece.player === this.player) {
      return false;
    }
    return true;
  }

  promote() {
    if (this.type === PIECE_TYPES.CHICK) {
      this.type = PIECE_TYPES.CHICKEN;
      this.promoted = true;
    }
  }

  shouldPromote() {
    if (this.type === PIECE_TYPES.CHICK) {
      const promotionRow = this.player === PLAYERS.PLAYER1 ? 0 : BOARD_ROWS - 1;
      return this.row === promotionRow;
    }
    return false;
  }
}