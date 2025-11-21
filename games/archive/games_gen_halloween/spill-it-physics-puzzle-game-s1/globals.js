// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";

// Physics constants
export const GRAVITY = 1.0;
export const BALL_RADIUS = 12;
export const GLASS_WIDTH = 25;
export const GLASS_HEIGHT = 50;
export const GROUND_HEIGHT = 30;

// Gameplay constants
export const DROP_ZONE_Y = CANVAS_HEIGHT * 0.4;
export const MIN_DROP_X = 50;
export const MAX_DROP_X = CANVAS_WIDTH - 50;

// Level configuration
export const LEVELS = [
  { glasses: 3, balls: 3, obstacles: 0 },
  { glasses: 4, balls: 3, obstacles: 0 },
  { glasses: 5, balls: 4, obstacles: 1 },
  { glasses: 6, balls: 4, obstacles: 1 },
  { glasses: 7, balls: 5, obstacles: 2 },
  { glasses: 8, balls: 5, obstacles: 2 },
  { glasses: 9, balls: 5, obstacles: 3 },
  { glasses: 10, balls: 6, obstacles: 3 }
];

// Ball skins (color variations)
export const BALL_SKINS = [
  { name: "Classic", color: [255, 100, 100], unlockLevel: 0 },
  { name: "Ocean", color: [100, 150, 255], unlockLevel: 1 },
  { name: "Forest", color: [100, 200, 100], unlockLevel: 2 },
  { name: "Gold", color: [255, 215, 0], unlockLevel: 3 },
  { name: "Purple", color: [200, 100, 255], unlockLevel: 4 },
  { name: "Fire", color: [255, 69, 0], unlockLevel: 5 }
];

// Themes
export const THEMES = [
  { name: "Day", bg: [135, 206, 235], ground: [139, 69, 19], unlockLevel: 0 },
  { name: "Sunset", bg: [255, 140, 100], ground: [101, 67, 33], unlockLevel: 2 },
  { name: "Night", bg: [25, 25, 112], ground: [64, 64, 64], unlockLevel: 4 }
];

// Game state object
export const gameState = {
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  engine: null,
  world: null,
  
  // Entities
  player: null,
  entities: [],
  balls: [],
  glasses: [],
  obstacles: [],
  ground: null,
  walls: [],
  
  // Level state
  currentLevel: 0,
  ballsRemaining: 0,
  glassesKnockedOver: 0,
  totalGlasses: 0,
  
  // Drop position
  dropX: CANVAS_WIDTH / 2,
  
  // Customization
  selectedSkinIndex: 0,
  selectedThemeIndex: 0,
  levelsCompleted: 0,
  
  // Test automation
  testBallDropTimer: 0,
  testBallsDropped: 0
};

export function getGameState() {
  return gameState;
}

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}