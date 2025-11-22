// globals.js - Global constants and game state
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Base table dimensions (will be adjusted per level)
export const BASE_TABLE_X = 50;
export const BASE_TABLE_Y = 50;
export const BASE_TABLE_WIDTH = 500;
export const BASE_TABLE_HEIGHT = 300;

// Dynamic table dimensions (updated per level)
export let TABLE_X = BASE_TABLE_X;
export let TABLE_Y = BASE_TABLE_Y;
export let TABLE_WIDTH = BASE_TABLE_WIDTH;
export let TABLE_HEIGHT = BASE_TABLE_HEIGHT;

export function updateTableDimensions(x, y, width, height) {
  TABLE_X = x;
  TABLE_Y = y;
  TABLE_WIDTH = width;
  TABLE_HEIGHT = height;
}

// Ball properties
export const BALL_RADIUS = 8;
export const CUE_BALL_RADIUS = 8;

// Pocket positions (6 pockets) - dynamically calculated based on provided dimensions
export function getPockets(tableX, tableY, tableWidth, tableHeight) {
  // If no parameters provided, try to use levelParams, otherwise use base dimensions
  if (tableX === undefined) {
    if (typeof gameState !== 'undefined' && gameState.levelParams) {
      tableX = gameState.levelParams.tableX;
      tableY = gameState.levelParams.tableY;
      tableWidth = gameState.levelParams.tableWidth;
      tableHeight = gameState.levelParams.tableHeight;
    } else {
      tableX = TABLE_X;
      tableY = TABLE_Y;
      tableWidth = TABLE_WIDTH;
      tableHeight = TABLE_HEIGHT;
    }
  }
  
  return [
    { x: tableX, y: tableY }, // Top-left
    { x: tableX + tableWidth / 2, y: tableY }, // Top-middle
    { x: tableX + tableWidth, y: tableY }, // Top-right
    { x: tableX, y: tableY + tableHeight }, // Bottom-left
    { x: tableX + tableWidth / 2, y: tableY + tableHeight }, // Bottom-middle
    { x: tableX + tableWidth, y: tableY + tableHeight } // Bottom-right
  ];
}

export const POCKET_RADIUS = 12;

// Game state object
export const gameState = {
  player: null,
  entities: [],
  score: 0,
  level: 1,
  maxLevel: 9, // Updated to 9 levels
  gamePhase: "START", // "START", "PLAYING", "PAUSED", "GAME_OVER_WIN", "GAME_OVER_LOSE"
  controlMode: "HUMAN",
  engine: null,
  world: null,
  
  // Pool-specific state
  playingPhase: "AIMING", // "AIMING", "SHOT", "WAITING", "FOUL"
  pocketedBalls: [],
  ballsOnTable: [],
  cueBall: null,
  aimAngle: 0,
  shotPower: 0,
  maxShotPower: 85, // Increased from 60 for stronger shots
  spinEffect: { x: 0, y: 0 },
  foulStatus: false,
  foulMessage: "",
  ballInHand: false,
  ballInHandPosition: { x: TABLE_X + 100, y: TABLE_Y + TABLE_HEIGHT / 2 },
  isBreak: true,
  waitingForBallsToStop: false,
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
    tableScale: 1.0,
    rackPosition: "far", // "close", "medium", "far"
    difficulty: "easy", // "easy", "medium", "hard"
    numberOfBalls: 15 // Number of balls to pocket in this level
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