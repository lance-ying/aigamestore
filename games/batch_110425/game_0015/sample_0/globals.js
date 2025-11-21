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

// Key codes
export const KEY_ENTER = 13;
export const KEY_ESC = 27;
export const KEY_SPACE = 32;
export const KEY_SHIFT = 16;
export const KEY_Z = 90;
export const KEY_R = 82;
export const KEY_LEFT = 37;
export const KEY_UP = 38;
export const KEY_RIGHT = 39;
export const KEY_DOWN = 40;

// Game constants
export const PLAYER_SPEED = 3;
export const PLAYER_SIZE = 20;
export const ENEMY_SIZE = 18;
export const ITEM_SIZE = 12;
export const ATTACK_RANGE = 35;
export const PROJECTILE_SPEED = 5;
export const PROJECTILE_SIZE = 8;

// Room layout
export const ROOM_PADDING = 40;
export const ROOM_WIDTH = CANVAS_WIDTH - ROOM_PADDING * 2;
export const ROOM_HEIGHT = CANVAS_HEIGHT - ROOM_PADDING * 2;

// Skill cooldowns (in frames at 60 FPS)
export const FIREBALL_COOLDOWN = 300; // 5 seconds
export const HEAL_COOLDOWN = 600; // 10 seconds
export const ATTACK_COOLDOWN = 30; // 0.5 seconds

// Game state object
export const gameState = {
  player: null,
  entities: [],
  projectiles: [],
  items: [],
  enemies: [],
  score: 0,
  gold: 0,
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  currentRoom: 0,
  totalRooms: 5,
  roomsCleared: 0,
  bossDefeated: false,
  attackCooldown: 0,
  fireballCooldown: 0,
  healCooldown: 0,
  roomCleared: false,
  transitionTimer: 0
};

// Expose getGameState globally
if (typeof window !== 'undefined') {
  window.getGameState = function() {
    return gameState;
  };
}