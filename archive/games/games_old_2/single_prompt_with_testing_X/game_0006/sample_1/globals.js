// globals.js - Game constants and state management

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";

// Player colors
export const PLAYER_COLORS = {
  BLUE: { r: 50, g: 150, b: 255 },
  RED: { r: 255, g: 80, b: 80 },
  GREEN: { r: 80, g: 255, b: 120 },
  YELLOW: { r: 255, g: 220, b: 50 }
};

// Game state object
export const gameState = {
  player: null,
  entities: [],
  blocks: [],
  bridges: [],
  platforms: [],
  aiOpponents: [],
  score: 0,
  level: 1,
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  startTime: 0,
  finishTime: 0,
  playerRank: 0,
  totalRacers: 4
};

// Expose getGameState globally
if (typeof window !== 'undefined') {
  window.getGameState = function() {
    return gameState;
  };
}