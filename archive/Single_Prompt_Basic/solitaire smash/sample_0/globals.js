export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const CARD_WIDTH = 50;
export const CARD_HEIGHT = 70;
export const CARD_SPACING = 5;
export const CARD_OFFSET_Y = 20;

export const SUITS = ['♠', '♥', '♦', '♣'];
export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gamePhase: "START",
  controlMode: "HUMAN",
  currentLevel: 1,
  totalScore: 0,
  moveCount: 0,
  timeElapsed: 0,
  startTime: 0,
  undoStack: [],
  selectedCards: [],
  selectedSource: null,
  highlightedArea: { type: 'tableau', index: 0 },
  stockpile: [],
  waste: [],
  foundations: [[], [], [], []],
  tableau: [[], [], [], [], [], [], []],
  allCards: [],
  stockpileCycles: 0,
  levelScores: [0, 0, 0, 0, 0]
};

export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;