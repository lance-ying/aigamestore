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

// Game state object
export const gameState = {
  player: null,
  opponent: null,
  entities: [],
  platforms: [],
  projectiles: [],
  effects: [],
  score: 0,
  opponentScore: 0,
  playerKOs: 0,
  opponentKOs: 0,
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  selectedCharacter: 0, // 0=Fire, 1=Water, 2=Air, 3=Earth
  frameCount: 0,
  respawnTimer: 0,
  roundStartTimer: 60,
  KO_LIMIT: 3
};

// Character data
export const CHARACTERS = [
  {
    name: "ZETTERBURN",
    element: "FIRE",
    color: [255, 100, 50],
    accentColor: [255, 200, 100],
    description: "Fire warrior with burn damage"
  },
  {
    name: "ORCANE",
    element: "WATER",
    color: [50, 150, 255],
    accentColor: [150, 220, 255],
    description: "Water manipulator with puddles"
  },
  {
    name: "WRASTOR",
    element: "AIR",
    color: [200, 200, 255],
    accentColor: [255, 255, 255],
    description: "Aerial ace with multiple jumps"
  },
  {
    name: "KRAGG",
    element: "EARTH",
    color: [139, 90, 60],
    accentColor: [180, 140, 100],
    description: "Earth defender with armor"
  }
];

// Physics constants
export const GRAVITY = 0.6;
export const MAX_FALL_SPEED = 12;
export const JUMP_POWER = -12;
export const MOVE_SPEED = 4;
export const AIR_MOVE_SPEED = 3.5;
export const GROUND_FRICTION = 0.8;
export const AIR_FRICTION = 0.95;
export const KNOCKBACK_DECAY = 0.92;

// Combat constants
export const BASE_KNOCKBACK = 3;
export const KNOCKBACK_SCALING = 0.015;
export const RESPAWN_TIME = 120; // 2 seconds at 60 FPS
export const HITSTUN_FRAMES = 20;
export const ATTACK_COOLDOWN = 15;

// Stage data
export const STAGE_BOUNDS = {
  left: -50,
  right: CANVAS_WIDTH + 50,
  top: -50,
  bottom: CANVAS_HEIGHT + 50
};