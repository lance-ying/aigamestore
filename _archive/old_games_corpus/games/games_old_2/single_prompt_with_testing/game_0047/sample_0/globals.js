// globals.js
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const BOARD_ROWS = 4;
export const BOARD_COLS = 3;
export const CELL_SIZE = 80;
export const BOARD_OFFSET_X = 150;
export const BOARD_OFFSET_Y = 50;

export const PIECE_TYPES = {
  LION: 'lion',
  GIRAFFE: 'giraffe',
  ELEPHANT: 'elephant',
  CHICK: 'chick',
  CHICKEN: 'chicken'
};

export const PLAYERS = {
  PLAYER1: 1,
  PLAYER2: 2
};

export const gameState = {
  gamePhase: "START",
  controlMode: "HUMAN",
  currentPlayer: PLAYERS.PLAYER1,
  board: [],
  selectedPiece: null,
  selectedRow: -1,
  selectedCol: -1,
  validMoves: [],
  player1Hand: [],
  player2Hand: [],
  cursorRow: 1,
  cursorCol: 1,
  dropMode: false,
  selectedHandIndex: -1,
  winner: null,
  testSequenceIndex: 0,
  lastLoggedPosition: { row: -1, col: -1 }
};

export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;