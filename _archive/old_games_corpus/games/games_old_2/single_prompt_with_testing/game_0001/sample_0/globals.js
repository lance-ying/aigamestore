// globals.js
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const MUTATION_TYPES = {
  OVERLORD: "OVERLORD",
  EXPLODER: "EXPLODER",
  RUNNER: "RUNNER"
};

export const MUTATION_COSTS = {
  OVERLORD: 15,
  EXPLODER: 25,
  RUNNER: 10
};

export const MUTATION_COOLDOWNS = {
  OVERLORD: 180,   // 3 seconds at 60fps
  EXPLODER: 240,   // 4 seconds
  RUNNER: 120      // 2 seconds
};

export const gameState = {
  player: null,
  entities: [],
  zombies: [],
  humans: [],
  walls: [],
  hazards: [],
  explosions: [],
  score: 0,
  dnaPoints: 50,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  cameraX: 0,
  levelWidth: 1200,
  selectedZombie: null,
  selectedMutation: MUTATION_TYPES.OVERLORD,
  mutationCooldowns: {
    OVERLORD: 0,
    EXPLODER: 0,
    RUNNER: 0
  },
  selectorX: 300,
  totalHumans: 0,
  humansConverted: 0,
  frameCount: 0
};

export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;