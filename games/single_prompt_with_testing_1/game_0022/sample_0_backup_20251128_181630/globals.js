// globals.js
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";

// World settings
export const WORLD_SIZE = 3000;
export const BUILDING_COUNT = 15;
export const ENEMY_COUNT = 8;

// Player settings
export const PLAYER_SPEED = 2;
export const PLAYER_SPRINT_SPEED = 3.5;
export const PLAYER_TURN_SPEED = 0.05;
export const PLAYER_MAX_HEALTH = 100;
export const PLAYER_MAX_HUNGER = 100;
export const PLAYER_MAX_THIRST = 100;
export const PLAYER_MAX_RADIATION = 100;

// Depletion rates (per second)
export const HUNGER_DEPLETION = 100 / 60;
export const THIRST_DEPLETION = 100 / 60;
export const RADIATION_INCREASE = 100 / 120;
export const SPRINT_HUNGER_MULTIPLIER = 2.5;

// Combat
export const PLAYER_ATTACK_RANGE = 60;
export const PLAYER_ATTACK_DAMAGE = 25;
export const PLAYER_ATTACK_COOLDOWN = 30; // frames

// Enemy settings
export const ENEMY_SPEED = 1;
export const ENEMY_ATTACK_RANGE = 40;
export const ENEMY_ATTACK_DAMAGE = 15;
export const ENEMY_HEALTH = 50;
export const ENEMY_DETECTION_RANGE = 200;

// Item settings
export const ITEM_FOOD_RESTORE = 30;
export const ITEM_WATER_RESTORE = 35;
export const ITEM_ANTIRAD_RESTORE = 40;

// Building settings
export const BUILDING_SIZE = 80;
export const BUILDING_INTERACTION_RANGE = 100;

// Evacuation point
export const EVAC_X = WORLD_SIZE - 200;
export const EVAC_Y = WORLD_SIZE - 200;
export const EVAC_SIZE = 100;

// Game state
export const gameState = {
  player: null,
  entities: [],
  buildings: [],
  enemies: [],
  score: 0,
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  lastTime: 0,
  evacuationPoint: null
};

// Make gameState globally accessible
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}