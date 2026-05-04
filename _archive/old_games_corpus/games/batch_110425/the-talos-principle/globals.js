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

// Key codes
export const KEY_ENTER = 13;
export const KEY_ESC = 27;
export const KEY_SPACE = 32;
export const KEY_SHIFT = 16;
export const KEY_R = 82;
export const KEY_Z = 90;
export const KEY_LEFT = 37;
export const KEY_UP = 38;
export const KEY_RIGHT = 39;
export const KEY_DOWN = 40;

// Tool types
export const TOOL_JAMMER = "JAMMER";
export const TOOL_CONNECTOR = "CONNECTOR";
export const TOOL_BOX = "BOX";

// Entity types
export const ENTITY_TURRET = "TURRET";
export const ENTITY_GATE = "GATE";
export const ENTITY_SIGIL = "SIGIL";
export const ENTITY_SWITCH = "SWITCH";
export const ENTITY_RECEIVER = "RECEIVER";

// Game state object
export const gameState = {
  player: null,
  entities: [],
  tools: [],
  puzzles: [],
  score: 0,
  sigilsCollected: 0,
  totalSigils: 3,
  gamePhase: PHASE_START,
  controlMode: CONTROL_HUMAN,
  currentPuzzle: 0,
  cameraAngle: 0,
  messages: [],
  framesSinceLastAction: 0
};

// Expose gameState globally
window.getGameState = () => gameState;