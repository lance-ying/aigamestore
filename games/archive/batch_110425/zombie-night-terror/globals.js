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

// Mutation types
export const MUTATION_BLOCKER = "BLOCKER";
export const MUTATION_EXPLODER = "EXPLODER";
export const MUTATION_JUMPER = "JUMPER";
export const MUTATION_RUNNER = "RUNNER";
export const MUTATION_TANK = "TANK";

// Mutation costs
export const MUTATION_COSTS = {
  [MUTATION_BLOCKER]: 10,
  [MUTATION_EXPLODER]: 15,
  [MUTATION_JUMPER]: 12,
  [MUTATION_RUNNER]: 8,
  [MUTATION_TANK]: 20
};

// Entity types
export const ENTITY_ZOMBIE = "ZOMBIE";
export const ENTITY_HUMAN = "HUMAN";
export const ENTITY_OBSTACLE = "OBSTACLE";
export const ENTITY_EXIT = "EXIT";
export const ENTITY_PIT = "PIT";

// Game state object
export const gameState = {
  player: null, // Not used in this game, but required by spec
  entities: [],
  zombies: [],
  humans: [],
  obstacles: [],
  exits: [],
  pits: [],
  score: 0,
  mutationPoints: 50, // Starting points
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  selectedMutation: MUTATION_BLOCKER,
  cameraX: 0,
  levelWidth: 1200,
  minHordeSize: 5,
  humanCount: 0,
  zombieCount: 0,
  frameCounter: 0,
  timeScale: 1.0,
  levelComplete: false
};

// Expose game state getter
export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;