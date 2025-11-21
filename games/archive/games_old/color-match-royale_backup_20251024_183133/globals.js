export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const CARD_WIDTH = 50;
export const CARD_HEIGHT = 75;

export const COLORS = {
  RED: 'RED',
  GREEN: 'GREEN',
  BLUE: 'BLUE',
  YELLOW: 'YELLOW'
};

export const COLOR_VALUES = {
  RED: [255, 0, 0],
  GREEN: [0, 200, 0],
  BLUE: [0, 100, 255],
  YELLOW: [255, 220, 0]
};

export const CARD_TYPES = {
  NUMBER: 'NUMBER',
  SKIP: 'SKIP',
  REVERSE: 'REVERSE',
  DRAW_TWO: 'DRAW_TWO',
  WILD: 'WILD',
  WILD_DRAW_FOUR: 'WILD_DRAW_FOUR'
};

export const GAME_PHASES = {
  START: 'START',
  LEVEL_INTRO: 'LEVEL_INTRO',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  GAME_OVER_WIN: 'GAME_OVER_WIN',
  GAME_OVER_LOSE: 'GAME_OVER_LOSE',
  GAME_COMPLETE: 'GAME_COMPLETE',
  HIGH_SCORES: 'HIGH_SCORES'
};

export const DIRECTION = {
  CLOCKWISE: 'CLOCKWISE',
  COUNTER_CLOCKWISE: 'COUNTER_CLOCKWISE'
};

export const gameState = {
  gamePhase: GAME_PHASES.START,
  controlMode: 'HUMAN',
  player: null,
  entities: [],
  score: 0,
  currentLevel: 1,
  maxLevels: 5,
  players: [],
  currentPlayerIndex: 0,
  direction: DIRECTION.CLOCKWISE,
  drawPile: [],
  discardPile: [],
  currentColor: null,
  selectedCardIndex: -1,
  colorSelectionMode: false,
  unoCalledThisTurn: false,
  mustCallUno: false,
  turnStartTime: 0,
  roundStartTime: 0,
  highScores: [],
  aiThinkDelay: 0,
  pendingAction: null,
  colorChoiceButtons: []
};

export function getGameState() {
  return gameState;
}

if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}