export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const gameState = {
  gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
  controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2, TEST_3
  
  // Physics engine
  engine: null,
  world: null,
  
  // Game logic
  currentLevelIndex: 0,
  score: 0,
  inputString: "", // The text typed by the player
  isSimulating: false, // True when physics is running, False when typing
  
  // Entities
  entities: [], // Matter.js bodies wrapped in entity classes
  targets: [], // Target objects
  obstacles: [], // Static geometry
  activeBodies: [], // The letters currently physically simulated
  
  // Camera
  camera: {
    x: 0,
    y: 0,
    zoom: 1
  },
  
  // Input handling
  cursorPos: 0,
  
  // Performance
  deltaTime: 0,
  lastFrameTime: 0,
  frameCount: 0
};

// Expose globally
window.getGameState = () => gameState;

// Colors
export const PALETTE = {
  background: '#222222',
  text: '#ffffff',
  accent: '#4488ff',
  target: '#ffff00',
  obstacle: '#444444',
  letter: '#eeeeee',
  letterStroke: '#111111'
};

// Physics Constants
export const CATEGORIES = {
  DEFAULT: 0x0001,
  LETTER: 0x0002,
  OBSTACLE: 0x0004,
  TARGET: 0x0008,
  SENSOR: 0x0010
};