export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const CARD_WIDTH = 45;
export const CARD_HEIGHT = 60;
export const CARD_OVERLAP = 18;
export const COLUMN_SPACING = 55;
export const TABLEAU_START_X = 30;
export const TABLEAU_START_Y = 80;

export const SUITS = ['♠', '♥', '♦', '♣'];
export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
export const RANK_VALUES = { 'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13 };

export const gameState = {
  player: null,
  entities: [],
  score: 500,
  gamePhase: "START",
  controlMode: "HUMAN",
  tableau: [],
  foundations: [],
  stockDealsRemaining: 5,
  selectedCardData: null,
  gameDifficultySuits: 1,
  currentLevelIdx: 0,
  movesCount: 0,
  gameTimerSeconds: 0,
  undoStack: [],
  draggedCards: null,
  animatingCards: [],
  lastFrameTime: 0,
  startTime: 0,
  isPaused: false,
  winMessage: "",
  loseMessage: "",
  hoveredButton: null,
  autoMoveHint: null
};

export const LEVEL_CONFIGS = [
  { name: "Solitaire Sprout", suits: 1, difficulty: "Easy" },
  { name: "Card Climber", suits: 2, difficulty: "Medium" },
  { name: "Web Weaver", suits: 4, difficulty: "Hard" },
  { name: "Arachnid Architect", suits: 4, difficulty: "Expert" }
];