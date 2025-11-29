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
export const CONTROL_TEST_3 = "TEST_3";
export const CONTROL_TEST_4 = "TEST_4";
export const CONTROL_TEST_5 = "TEST_5";

// Room dimensions
export const ROOM_WIDTH = 600;
export const ROOM_HEIGHT = 400;
export const WALL_THICKNESS = 20;

// Player constants
export const PLAYER_SIZE = 20;
export const PLAYER_SPEED = 3;
export const PLAYER_DASH_SPEED = 12;
export const PLAYER_DASH_DURATION = 10;
export const PLAYER_DASH_COOLDOWN = 30;
export const PLAYER_MAX_HEALTH = 100;
export const PLAYER_ATTACK_RANGE = 40;
export const PLAYER_ATTACK_DAMAGE = 20;
export const PLAYER_ATTACK_COOLDOWN = 20;
export const PLAYER_INVULN_FRAMES = 10;

// Enemy constants
export const ENEMY_SIZE = 18;
export const ENEMY_SPEED = 1.5;
export const ENEMY_DAMAGE = 10;
export const ENEMY_ATTACK_COOLDOWN = 60;
export const ENEMY_HEALTH = 60;
export const ENEMY_DETECTION_RANGE = 300;

// Boon types
export const BOON_ATTACK = "ATTACK";
export const BOON_SPEED = "SPEED";
export const BOON_HEALTH = "HEALTH";
export const BOON_DASH = "DASH";

// Game state object
export const gameState = {
  player: null,
  enemies: [],
  projectiles: [],
  particles: [],
  entities: [],
  
  currentRoom: 0,
  roomsCleared: 0,
  roomData: [],
  
  boonOffered: false,
  boonChoice: null,
  selectingBoon: false,
  
  score: 0,
  gamePhase: PHASE_START,
  controlMode: CONTROL_HUMAN,
  
  frameCount: 0,
  
  // Power-ups collected
  attackBonus: 0,
  speedBonus: 0,
  dashBonus: 0,
  
  // Camera offset for room transitions
  cameraX: 0,
  cameraY: 0,
  
  // Transition state
  transitioning: false,
  transitionProgress: 0,
  targetRoom: 0
};

// Expose gameState globally
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}