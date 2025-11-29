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

// Control modes
export const CONTROL_HUMAN = "HUMAN";
export const CONTROL_TEST_1 = "TEST_1";
export const CONTROL_TEST_2 = "TEST_2";

// Game constants
export const GROUND_Y = 320;
export const STAGE_WIDTH = 1200;
export const CAMERA_OFFSET = 200;

// Player constants
export const PLAYER_HEALTH = 100;
export const PLAYER_SPEED = 3;
export const PLAYER_ATTACK_DAMAGE = 10;
export const PLAYER_SPECIAL_DAMAGE = 25;
export const PLAYER_SPECIAL_COST = 15;
export const PLAYER_COMBO_WINDOW = 800;

// Enemy constants
export const ENEMY_SPAWN_DISTANCE = 400;
export const BOSS_HEALTH_MULTIPLIER = 5;

// Game state
export const gameState = {
  player: null,
  entities: [],
  camera: { x: 0 },
  score: 0,
  stage: 1,
  totalStages: 3,
  enemiesDefeated: 0,
  gamePhase: PHASE_START,
  controlMode: CONTROL_HUMAN,
  stageProgress: 0,
  currentWave: 0,
  bossDefeated: false,
  frameCount: 0
};

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}

export function getGameState() {
  return gameState;
}