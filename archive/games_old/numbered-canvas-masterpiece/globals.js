// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const PALETTE_HEIGHT = 80;
export const GAME_HEIGHT = CANVAS_HEIGHT - PALETTE_HEIGHT;

export const gameState = {
  gamePhase: "START", // "START", "PLAYING", "PAUSED", "GAME_OVER_WIN", "GAME_OVER_LOSE"
  controlMode: "HUMAN", // "HUMAN", "TEST_1", "TEST_2"
  
  // Player/gameplay state
  currentLevel: 1,
  score: 0,
  highScore: 0,
  
  // Artwork state
  artworkSegments: [],
  currentSelectedColorID: null,
  
  // Canvas transform
  canvasTransform: {
    zoomLevel: 1.0,
    panOffsetX: 0,
    panOffsetY: 0
  },
  
  // Timing
  levelStartTime: 0,
  
  // Level data
  currentArtworkData: null,
  colorPalette: [],
  
  // Input state
  keys: {},
  
  // Completion tracking
  totalSegments: 0,
  filledSegments: 0,
  
  // Animation state
  completionAnimation: {
    active: false,
    startTime: 0,
    particles: []
  }
};

// Level configurations
export const LEVELS = [
  {
    level: 1,
    name: "Beginner's Canvas",
    maxTime: 300,
    colors: 6,
    segments: 80
  },
  {
    level: 2,
    name: "Pastel Challenge",
    maxTime: 300,
    colors: 9,
    segments: 150
  },
  {
    level: 3,
    name: "Intricate Details",
    maxTime: 300,
    colors: 12,
    segments: 250
  },
  {
    level: 4,
    name: "Masterpiece Mosaic",
    maxTime: 300,
    colors: 16,
    segments: 400
  },
  {
    level: 5,
    name: "Grand Finale",
    maxTime: 300,
    colors: 20,
    segments: 500
  }
];

export const ZOOM_MIN = 0.5;
export const ZOOM_MAX = 3.0;
export const ZOOM_SPEED = 0.1;
export const PAN_SPEED = 10;