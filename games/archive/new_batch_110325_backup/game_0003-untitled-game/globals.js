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
export const KEY_R = 82;
export const KEY_SPACE = 32;
export const KEY_SHIFT = 16;
export const KEY_Z = 90;
export const KEY_LEFT = 37;
export const KEY_UP = 38;
export const KEY_RIGHT = 39;
export const KEY_DOWN = 40;

// Game constants
export const GRAVITY = 0.8;
export const GROUND_Y = 320;
export const MAX_HEALTH = 100;
export const ROUND_WIN_REQUIREMENT = 2;
export const TOTAL_PROVINCES = 7;

// Combat constants
export const ATTACK_RANGE = 60;
export const PUNCH_DAMAGE = 8;
export const KICK_DAMAGE = 12;
export const COMBO_DAMAGE_MULTIPLIER = 1.5;
export const ATTACK_COOLDOWN = 15;
export const HIT_STUN_DURATION = 10;

// Upgrade costs
export const WEAPON_UPGRADE_COST = 50;
export const ARMOR_UPGRADE_COST = 40;
export const MAGIC_UPGRADE_COST = 60;

// Global game state
export const gameState = {
  player: null,
  enemy: null,
  entities: [],
  score: 0,
  coins: 0,
  gems: 0,
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  currentProvince: 1,
  currentRound: 1,
  playerRoundsWon: 0,
  enemyRoundsWon: 0,
  roundInProgress: false,
  roundTimer: 0,
  weapons: 0,
  armor: 0,
  magic: 0,
  showUpgradeMenu: false,
  enemiesDefeated: 0,
  comboCounter: 0,
  lastHitTime: 0
};

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}