// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;

// Game phase constants
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";
export const PHASE_LEVEL_COMPLETE = "LEVEL_COMPLETE";

// Control modes
export const CONTROL_HUMAN = "HUMAN";

// Game state object
export const gameState = {
  player: null,
  entities: [],
  aiSnakes: [],
  pellets: [],
  massDrops: [],
  obstacles: [],
  score: 0,
  lives: 3,
  currentLevel: 1,
  gamePhase: PHASE_START,
  controlMode: CONTROL_HUMAN,
  playerLength: 0,
  targetLength: 50,
  framesSurvived: 0,
  lastSurvivalBonus: 0,
  playerSkinColor: [50, 200, 50],
  levelStartTime: 0,
  dynamicObstaclePhase: 0,
};

// Level configurations
export const LEVEL_CONFIGS = {
  1: {
    name: "The Nursery",
    targetLength: 50,
    aiCount: 3,
    aiStartLength: 5,
    aiSpeed: 1.8,
    aiAggression: 0.15,
    pelletDensity: 30,
    arenaSize: { width: CANVAS_WIDTH - 40, height: CANVAS_HEIGHT - 40 },
    playerStartLength: 10,
    staticObstacles: 0,
    dynamicObstacles: false,
  },
  2: {
    name: "The Gauntlet",
    targetLength: 120,
    aiCount: 5,
    aiStartLength: 15,
    aiSpeed: 2.4,
    aiAggression: 0.35,
    pelletDensity: 20,
    arenaSize: { width: CANVAS_WIDTH - 40, height: CANVAS_HEIGHT - 40 },
    playerStartLength: 15,
    staticObstacles: 3,
    dynamicObstacles: false,
  },
  3: {
    name: "Apex Hunter Arena",
    targetLength: 250,
    aiCount: 8,
    aiStartLength: 25,
    aiSpeed: 3.0,
    aiAggression: 0.65,
    pelletDensity: 10,
    arenaSize: { width: CANVAS_WIDTH - 40, height: CANVAS_HEIGHT - 40 },
    playerStartLength: 20,
    staticObstacles: 2,
    dynamicObstacles: true,
  },
};

// Snake constants
export const SEGMENT_SIZE = 8;
export const BASE_SPEED = 2.5;
export const BOOST_SPEED = 5;
export const BOOST_COST = 3;
export const MIN_BOOST_LENGTH = 15;

// Pellet constants
export const PELLET_SIZE = 5;
export const PELLET_VALUE = 1;
export const MASS_VALUE = 5;

// Collision constants
export const COLLISION_BUFFER = 3;

// Scoring constants
export const SURVIVAL_BONUS_INTERVAL = 300; // 5 seconds at 60 FPS
export const SURVIVAL_BONUS_POINTS = 1;
export const LEVEL_COMPLETE_BONUS = 100;