// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 600;
export const TARGET_FPS = 60;

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";
export const PHASE_LEVEL_COMPLETE = "LEVEL_COMPLETE";

// Key codes
export const KEY_ENTER = 13;
export const KEY_ESC = 27;
export const KEY_R = 82;
export const KEY_LEFT = 37;
export const KEY_RIGHT = 39;
export const KEY_SPACE = 32;
export const KEY_Q = 81;
export const KEY_E = 69;

// Game state object
export const gameState = {
  player: null,
  entities: [],
  score: 0,
  currentLevel: 1,
  totalLevels: 5,
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  levelObjectives: {
    objectsRequired: 0,
    objectsCaught: 0,
    objectsLost: 0,
    timeLimit: 0,
    timeRemaining: 0
  },
  highScore: 0,
  levelScore: 0,
  fallingObjects: [],
  obstacles: [],
  targetZone: null,
  levelStartTime: 0,
  transitionTimer: 0,
  inputState: {
    left: false,
    right: false,
    tiltLeft: false,
    tiltRight: false
  }
};

// Level definitions
export const LEVEL_CONFIGS = [
  {
    level: 1,
    name: "The Drop",
    objectsRequired: 5,
    totalObjects: 7,
    timeLimit: 60,
    objectSpeed: 1.5,
    objectSpawnInterval: 120,
    targetWidth: 120,
    targetSpeed: 0,
    platformWidth: 120,
    platformSpeed: 4,
    obstacles: [],
    gravity: 0.2
  },
  {
    level: 2,
    name: "Bouncing Walls",
    objectsRequired: 7,
    totalObjects: 10,
    timeLimit: 70,
    objectSpeed: 2,
    objectSpawnInterval: 100,
    targetWidth: 100,
    targetSpeed: 0,
    platformWidth: 100,
    platformSpeed: 5,
    obstacles: [
      { x: 150, y: 150, width: 8, height: 80, type: 'static' },
      { x: 450, y: 250, width: 8, height: 80, type: 'static' }
    ],
    gravity: 0.25
  },
  {
    level: 3,
    name: "Shifting Sands",
    objectsRequired: 8,
    totalObjects: 12,
    timeLimit: 80,
    objectSpeed: 2.5,
    objectSpawnInterval: 90,
    targetWidth: 90,
    targetSpeed: 1,
    platformWidth: 90,
    platformSpeed: 5.5,
    obstacles: [
      { x: 200, y: 120, width: 8, height: 100, type: 'static' },
      { x: 400, y: 200, width: 8, height: 100, type: 'static' },
      { x: 300, y: 160, width: 80, height: 8, type: 'static' }
    ],
    gravity: 0.3
  },
  {
    level: 4,
    name: "The Gauntlet",
    objectsRequired: 9,
    totalObjects: 15,
    timeLimit: 90,
    objectSpeed: 3,
    objectSpawnInterval: 80,
    targetWidth: 70,
    targetSpeed: 2,
    platformWidth: 80,
    platformSpeed: 6,
    obstacles: [
      { x: 150, y: 100, width: 8, height: 120, type: 'static' },
      { x: 450, y: 180, width: 8, height: 120, type: 'static' },
      { x: 300, y: 140, width: 100, height: 8, type: 'static' },
      { x: 350, y: 220, width: 80, height: 8, type: 'moving', moveRange: 100, moveSpeed: 1 }
    ],
    gravity: 0.35
  },
  {
    level: 5,
    name: "The Funnel",
    objectsRequired: 10,
    totalObjects: 15,
    timeLimit: 100,
    objectSpeed: 3.5,
    objectSpawnInterval: 75,
    targetWidth: 60,
    targetSpeed: 2.5,
    platformWidth: 70,
    platformSpeed: 7,
    obstacles: [
      { x: 120, y: 80, width: 8, height: 140, type: 'static' },
      { x: 480, y: 80, width: 8, height: 140, type: 'static' },
      { x: 250, y: 150, width: 100, height: 8, type: 'static' },
      { x: 350, y: 220, width: 100, height: 8, type: 'static' },
      { x: 180, y: 180, width: 60, height: 8, type: 'moving', moveRange: 80, moveSpeed: 1.5 },
      { x: 420, y: 260, width: 60, height: 8, type: 'moving', moveRange: 80, moveSpeed: 1.2 }
    ],
    gravity: 0.4
  }
];