// globals.js - Global constants and state management

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";

// Control modes
export const CONTROL_MODE_HUMAN = "HUMAN";
export const CONTROL_MODE_TEST_1 = "TEST_1";
export const CONTROL_MODE_TEST_2 = "TEST_2";

// Item types
export const ITEM_TYPES = [
  { name: 'RedCircle', color: [220, 60, 60], shape: 'circle' },
  { name: 'BlueSquare', color: [60, 120, 220], shape: 'square' },
  { name: 'GreenTriangle', color: [80, 200, 80], shape: 'triangle' },
  { name: 'YellowCircle', color: [240, 220, 60], shape: 'circle' },
  { name: 'PurpleSquare', color: [180, 80, 200], shape: 'square' },
  { name: 'OrangeTriangle', color: [255, 140, 40], shape: 'triangle' }
];

// Game state object
export const gameState = {
  gamePhase: PHASE_START,
  controlMode: CONTROL_MODE_HUMAN,
  currentLevel: 1,
  score: 0,
  highScore: 0,
  timeRemaining: 0,
  selectorX: 0,
  selectorY: 0,
  selectorIndex: 0,
  isHoldingItem: false,
  heldItemId: null,
  items: [],
  containers: [],
  player: null, // Reference to selector state
  entities: [], // All interactive entities
  levelConfig: null
};

// Level configurations
export const LEVEL_CONFIGS = [
  { level: 1, timeLimit: 60, itemCount: 6, types: ['RedCircle', 'BlueSquare', 'GreenTriangle'] },
  { level: 2, timeLimit: 50, itemCount: 9, types: ['RedCircle', 'BlueSquare', 'GreenTriangle', 'YellowCircle'] },
  { level: 3, timeLimit: 45, itemCount: 12, types: ['RedCircle', 'BlueSquare', 'GreenTriangle', 'YellowCircle', 'PurpleSquare'] },
  { level: 4, timeLimit: 40, itemCount: 15, types: ['RedCircle', 'BlueSquare', 'GreenTriangle', 'YellowCircle', 'PurpleSquare', 'OrangeTriangle'] },
  { level: 5, timeLimit: 35, itemCount: 18, types: ['RedCircle', 'BlueSquare', 'GreenTriangle', 'YellowCircle', 'PurpleSquare', 'OrangeTriangle'] }
];

// Scoring
export const POINTS_CORRECT = 100;
export const POINTS_INCORRECT = -25;

// Expose gameState globally
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}