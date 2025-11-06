// Global game constants and state
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const CENTER_X = CANVAS_WIDTH / 2;
export const CENTER_Y = CANVAS_HEIGHT / 2;
export const TUNNEL_RADIUS = 150;
export const PLAYER_RADIUS = 20;
export const PLAYER_ORBIT_RADIUS = TUNNEL_RADIUS - 30;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const gameState = {
  player: null,
  entities: [],
  projectiles: [],
  enemies: [],
  particles: [],
  score: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  waveNumber: 1,
  enemiesDestroyed: 0,
  survivalTime: 0,
  lastShotTime: 0,
  shootCooldown: 400, // milliseconds
  difficultyMultiplier: 1.0,
  lastDifficultyIncrease: 0,
  inputState: {
    leftPressed: false,
    rightPressed: false
  }
};

export function getGameState() {
  return gameState;
}

// Attach to window
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}