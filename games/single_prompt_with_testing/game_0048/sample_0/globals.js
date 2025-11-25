// globals.js - Game constants and state management

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";

// Game modes
export const MODE_DESIGNER = "DESIGNER";
export const MODE_TARGET_PRACTICE = "TARGET_PRACTICE";

// Designer options
export const DESIGNER_OPTIONS = [
  { id: 'lineLength', name: 'Line Length', min: 5, max: 50, default: 20 },
  { id: 'lineWidth', name: 'Line Width', min: 1, max: 10, default: 2 },
  { id: 'lineOpacity', name: 'Line Opacity', min: 0, max: 255, default: 255 },
  { id: 'lineOffset', name: 'Line Offset', min: 0, max: 20, default: 5 },
  { id: 'centerDotSize', name: 'Center Dot Size', min: 0, max: 15, default: 3 },
  { id: 'centerDotOpacity', name: 'Dot Opacity', min: 0, max: 255, default: 255 },
  { id: 'outlineThickness', name: 'Outline Thickness', min: 0, max: 5, default: 1 },
  { id: 'outlineOpacity', name: 'Outline Opacity', min: 0, max: 255, default: 200 },
  { id: 'colorR', name: 'Color Red', min: 0, max: 255, default: 0 },
  { id: 'colorG', name: 'Color Green', min: 0, max: 255, default: 255 },
  { id: 'colorB', name: 'Color Blue', min: 0, max: 255, default: 0 },
  { id: 'rotation', name: 'Rotation', min: 0, max: 360, default: 0 },
];

// Game state
export const gameState = {
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  gameMode: MODE_DESIGNER,
  
  // Player
  player: null,
  
  // Entities
  entities: [],
  targets: [],
  bullets: [],
  
  // Crosshair design
  crosshairDesign: {},
  
  // Designer state
  selectedOptionIndex: 0,
  
  // Target practice stats
  score: 0,
  hits: 0,
  shots: 0,
  targetsDestroyed: 0,
  requiredHits: 15,
  
  // Timing
  lastShotTime: 0,
  shotCooldown: 250,
  
  // Position history for automated testing
  positionHistory: [],
};

// Initialize crosshair design with defaults
DESIGNER_OPTIONS.forEach(option => {
  gameState.crosshairDesign[option.id] = option.default;
});

// Global accessor
export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;