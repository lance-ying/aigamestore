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

// Game state object
export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gamePhase: PHASE_START,
  controlMode: CONTROL_HUMAN,
  
  // Camera and view
  cameraAngle: 0, // horizontal angle in degrees
  cameraPitch: 0, // vertical angle in degrees
  
  // Room and puzzle state
  currentRoom: 0,
  totalRooms: 3,
  roomsCompleted: 0,
  
  // Oculus Perpetua state
  oculusActive: false,
  oculusEnergy: 100,
  oculusRechargeRate: 0.5,
  oculusDrainRate: 1.0,
  
  // Puzzle state for current room
  puzzleElements: [],
  puzzlesSolved: 0,
  puzzlesInRoom: 0,
  
  // Interaction
  interactionRange: 150,
  targetElement: null,
  
  // Progression
  narrativeStage: 0,
  hintsShown: [],
  
  // Input tracking
  keysPressed: {},
  
  // Frame tracking
  frameCount: 0
};

// Expose game state globally
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}