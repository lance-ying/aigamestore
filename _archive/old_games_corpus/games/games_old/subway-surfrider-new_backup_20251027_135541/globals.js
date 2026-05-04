// globals.js - Game state and constants

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER: "GAME_OVER",
  WIN: "WIN"
};

export const LANE_POSITIONS = [150, 300, 450]; // X positions for the three lanes
export const PLAYER_START_Y = 300;
export const PLAYER_WIDTH = 30;
export const PLAYER_HEIGHT = 50;

export const JUMP_HEIGHT = 100;
export const JUMP_DURATION = 30; // frames
export const SLIDE_DURATION = 20; // frames

export const INITIAL_GAME_SPEED = 5;
export const MAX_GAME_SPEED = 20;
export const SPEED_INCREMENT = 0.005;

export const LEVELS = [
  {
    level: 1,
    name: "Subway Beginner",
    distanceGoal: 2000,
    initialSpeed: 5,
    speedIncrement: 0.005,
    obstacleChance: 0.20,
    powerupInterval: 500,
    multiplier: 1
  },
  {
    level: 2,
    name: "Urban Explorer",
    distanceGoal: 4000,
    initialSpeed: 7,
    speedIncrement: 0.008,
    obstacleChance: 0.30,
    powerupInterval: 750,
    multiplier: 1.5
  },
  {
    level: 3,
    name: "Track Master",
    distanceGoal: 7000,
    initialSpeed: 10,
    speedIncrement: 0.012,
    obstacleChance: 0.40,
    powerupInterval: 1000,
    multiplier: 2
  },
  {
    level: 4,
    name: "Speed Demon",
    distanceGoal: 11000,
    initialSpeed: 13,
    speedIncrement: 0.015,
    obstacleChance: 0.50,
    powerupInterval: 1250,
    multiplier: 2.5
  },
  {
    level: 5,
    name: "Endless Legend",
    distanceGoal: 16000,
    initialSpeed: 16,
    speedIncrement: 0.018,
    obstacleChance: 0.60,
    powerupInterval: 1500,
    multiplier: 3
  }
];

export const gameState = {
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  player: null,
  entities: [],
  obstacles: [],
  coins: [],
  powerups: [],
  score: 0,
  coinsCollected: 0,
  distanceRun: 0,
  currentLevel: 0,
  gameSpeed: INITIAL_GAME_SPEED,
  lastPowerupDistance: 0,
  framesSinceStart: 0,
  highScores: []
};

// Global function to get game state
export function getGameState() {
  return gameState;
}

// Attach to window for testing
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}