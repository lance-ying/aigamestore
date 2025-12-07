/**
 * globals.js
 * Contains global constants, game state structure, and shared configuration.
 */

// Canvas Dimensions
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Grid Configuration
export const TILE_SIZE = 40;
export const GRID_ROWS = 10; // 400 / 40
export const GRID_COLS_VISIBLE = 16; // 600 / 40 = 15 + buffer

// Game Colors
export const COLORS = {
    BACKGROUND: [20, 18, 25],
    WALL: [60, 55, 70],
    WALL_TOP: [80, 75, 90],
    FLOOR_1: [30, 28, 35],
    FLOOR_2: [35, 33, 40],
    PLAYER: [50, 150, 255],
    PLAYER_OUTLINE: [255, 255, 255],
    DOOM_WALL: [180, 20, 20],
    SPIKE_SAFE: [100, 100, 100],
    SPIKE_DANGER: [200, 200, 200],
    COIN: [255, 215, 0],
    SLIME: [50, 200, 50],
    TEXT: [255, 255, 255],
    UI_BG: [0, 0, 0, 200]
};

// Physics Constants
export const MOVE_SPEED = 0.2; // Time in seconds to move one tile
export const DOOM_WALL_SPEED_INITIAL = 1.0; // Pixels per frame
export const DOOM_WALL_ACCELERATION = 0.0005;

// Game State Object
export const gameState = {
    // Core references
    player: null,
    grid: new Map(), // Key: "x,y", Value: TileObject
    entities: [],
    particles: [],
    
    // Game Status
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN",
    
    // Scoring & Progression
    score: 0,
    distanceTraveled: 0,
    coinsCollected: 0,
    
    // World Generation State
    generatedColMax: -5, // Track furthest generated column
    cameraX: 0,
    cameraY: 0,
    doomWallX: -200,
    doomWallSpeed: DOOM_WALL_SPEED_INITIAL,
    
    // Time tracking
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0,
    
    // Input Buffer for smooth controls
    inputQueue: [],
    
    // Helper to reset state
    reset: function() {
        this.player = null;
        this.grid.clear();
        this.entities = [];
        this.particles = [];
        this.score = 0;
        this.distanceTraveled = 0;
        this.coinsCollected = 0;
        this.generatedColMax = -5;
        this.cameraX = 0;
        this.cameraY = 0;
        this.doomWallX = -300; // Start further back
        this.doomWallSpeed = DOOM_WALL_SPEED_INITIAL;
        this.inputQueue = [];
        this.frameCount = 0;
    }
};

// Helper to access global state
export function getGameState() {
    return gameState;
}

// Ensure global access
if (typeof window !== 'undefined') {
    window.getGameState = getGameState;
}