// globals.js
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const FPS = 60;

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";

// Game state object
export const gameState = {
  player: null,
  entities: [],
  goodBalls: [],
  monsterBalls: [],
  movableBlocks: [],
  walls: [],
  score: 0,
  level: 1,
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  engine: null,
  world: null,
  movesRemaining: 0,
  maxMoves: 0,
  selectedBlock: null,
  monsterActivationTimer: 0,
  monsterActivationDuration: 5, // seconds
  monsterActivated: false,
  levelComplete: false,
  gameOverReason: "",
  lastMoveTime: 0,
  moveDelay: 150 // ms between moves
};

// Expose getGameState globally
export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;