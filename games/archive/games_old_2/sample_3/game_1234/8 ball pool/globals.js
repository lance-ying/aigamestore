// globals.js - Global constants and game state
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Table dimensions
export const TABLE_X = 50;
export const TABLE_Y = 50;
export const TABLE_WIDTH = 500;
export const TABLE_HEIGHT = 300;

// Ball properties
export const BALL_RADIUS = 8;
export const CUE_BALL_RADIUS = 8;

// Pocket positions (6 pockets)
export const POCKETS = [
  { x: TABLE_X, y: TABLE_Y }, // Top-left
  { x: TABLE_X + TABLE_WIDTH / 2, y: TABLE_Y }, // Top-middle
  { x: TABLE_X + TABLE_WIDTH, y: TABLE_Y }, // Top-right
  { x: TABLE_X, y: TABLE_Y + TABLE_HEIGHT }, // Bottom-left
  { x: TABLE_X + TABLE_WIDTH / 2, y: TABLE_Y + TABLE_HEIGHT }, // Bottom-middle
  { x: TABLE_X + TABLE_WIDTH, y: TABLE_Y + TABLE_HEIGHT } // Bottom-right
];

export const POCKET_RADIUS = 12;

// Game state object
export const gameState = {
  player: null,
  entities: [],
  score: 0,
  level: 1,
  gamePhase: "START", // "START", "PLAYING", "PAUSED", "GAME_OVER_WIN", "GAME_OVER_LOSE"
  controlMode: "HUMAN",
  engine: null,
  world: null,
  
  // Pool-specific state
  playingPhase: "AIMING", // "AIMING", "SHOT", "WAITING", "FOUL"
  currentTurn: "PLAYER", // "PLAYER" or "AI"
  playerBallsType: "open", // "open", "solids", "stripes"
  aiBallsType: "open",
  pocketedBallsPlayer: [],
  pocketedBallsAI: [],
  ballsOnTable: [],
  cueBall: null,
  aimAngle: 0,
  shotPower: 0,
  maxShotPower: 100,
  spinEffect: { x: 0, y: 0 },
  foulStatus: false,
  foulMessage: "",
  ballInHand: false,
  ballInHandPosition: { x: TABLE_X + 100, y: TABLE_Y + TABLE_HEIGHT / 2 },
  isBreak: true,
  waitingForBallsToStop: false,
  aiThinkTime: 0,
  aiShotDelay: 120, // frames before AI takes shot
  lastPocketedBalls: [],
  firstContactBall: null,
  cushionHits: 0,
  
  // Visual elements
  cueStick: null,
  aimGuide: null,
  
  // Level parameters
  levelParams: {
    pocketSizeMultiplier: 1.0,
    tableFriction: 0.1,
    aiSkill: 0.2
  }
};

// Ball colors and types
export const BALL_COLORS = {
  0: { r: 255, g: 255, b: 255, type: "cue" }, // Cue ball
  1: { r: 255, g: 220, b: 0, type: "solid" }, // Yellow
  2: { r: 0, g: 100, b: 200, type: "solid" }, // Blue
  3: { r: 220, g: 0, b: 0, type: "solid" }, // Red
  4: { r: 100, g: 0, b: 150, type: "solid" }, // Purple
  5: { r: 255, g: 140, b: 0, type: "solid" }, // Orange
  6: { r: 0, g: 150, b: 0, type: "solid" }, // Green
  7: { r: 120, g: 0, b: 0, type: "solid" }, // Maroon
  8: { r: 0, g: 0, b: 0, type: "eight" }, // 8-ball
  9: { r: 255, g: 220, b: 0, type: "stripe" }, // Yellow stripe
  10: { r: 0, g: 100, b: 200, type: "stripe" }, // Blue stripe
  11: { r: 220, g: 0, b: 0, type: "stripe" }, // Red stripe
  12: { r: 100, g: 0, b: 150, type: "stripe" }, // Purple stripe
  13: { r: 255, g: 140, b: 0, type: "stripe" }, // Orange stripe
  14: { r: 0, g: 150, b: 0, type: "stripe" }, // Green stripe
  15: { r: 120, g: 0, b: 0, type: "stripe" } // Maroon stripe
};

export function getGameState() {
  return gameState;
}

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}