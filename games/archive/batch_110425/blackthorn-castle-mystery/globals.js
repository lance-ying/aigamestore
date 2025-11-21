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

// Game state object
export const gameState = {
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  
  // Player state
  player: null,
  currentRoom: "entrance",
  
  // Inventory
  inventory: [],
  maxInventorySize: 12,
  selectedInventoryIndex: -1,
  inventoryOpen: false,
  
  // Camera photos
  photos: [],
  maxPhotos: 10,
  
  // UI state
  cursorX: CANVAS_WIDTH / 2,
  cursorY: CANVAS_HEIGHT / 2,
  hoveredHotspot: null,
  hoveredButton: null,
  
  // Map state
  mapOpen: false,
  visitedRooms: new Set(["entrance"]),
  
  // Hint system
  hintCooldown: 0,
  hintCooldownMax: 1800, // 30 seconds at 60 FPS
  hintsUsed: 0,
  
  // Puzzle state
  solvedPuzzles: new Set(),
  unlockedDoors: new Set(),
  
  // Game progress
  entities: [],
  score: 0,
  puzzlesSolved: 0,
  roomsExplored: 1,
  
  // Auto-save
  lastSaveFrame: 0,
  saveInterval: 18000, // 5 minutes at 60 FPS
  
  // Testing
  testingActionQueue: [],
  testingFrameCount: 0,
  positionHistory: []
};

// Expose gameState globally
window.getGameState = () => gameState;