// globals.js
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gamePhase: "START", // "START", "PLAYING", "GAME_OVER_WIN", "GAME_OVER_LOSE", "PAUSED"
  controlMode: "HUMAN", // "HUMAN", "TEST_1", "TEST_2"
  
  // Game specific state
  currentRoom: 1,
  maxRoom: 1,
  cameraAngle: 0, // 0-360 degrees
  targetCameraAngle: 0,
  
  inventory: [], // array of item objects
  selectedItemIndex: -1,
  
  highlightedObject: null,
  examinedObject: null,
  
  oculusActive: false, // past/present toggle
  
  // Room states
  rooms: {
    1: { completed: false, doorUnlocked: false, puzzleState: {} },
    2: { completed: false, doorUnlocked: false, puzzleState: {} },
    3: { completed: false, doorUnlocked: false, puzzleState: {} }
  },
  
  // Frame counter for animations
  animationFrame: 0,
  
  // Position tracking for automated testing
  positionHistory: []
};

// Game constants
export const CAMERA_ROTATION_SPEED = 3;
export const MAX_INVENTORY_SIZE = 5;
export const INTERACTION_RANGE = 80;

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}