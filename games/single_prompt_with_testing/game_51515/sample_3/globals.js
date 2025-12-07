/**
 * globals.js
 * Contains global constants, configuration, and the main game state object.
 * Used to share data between modules without circular dependencies.
 */

// Canvas Dimensions
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Grid System Configuration
export const TILE_SIZE = 40;
export const GRID_COLS = 15; // Visible columns
export const GRID_ROWS = 10; // Visible rows

// Game Physics & Timing
export const TARGET_FPS = 60;
export const ANIMATION_SPEED_NORMAL = 0.15; // Speed of hop interpolation (0-1)
export const ANIMATION_SPEED_SPRINT = 0.30;
export const VOID_SPEED_INITIAL = 0.02;     // Tiles per frame
export const VOID_SPEED_INC = 0.0001;       // Acceleration per frame

// Colors Palette (Dungeon Theme)
export const COLORS = {
    BACKGROUND: '#1a1a24',
    GRID_LIGHT: '#232330',
    GRID_DARK: '#1f1f2a',
    WALL_TOP: '#5d5d60',
    WALL_SIDE: '#3e3e42',
    PLAYER: '#3498db',
    PLAYER_SHADOW: '#2980b9',
    VOID: '#e74c3c',
    VOID_GLOW: '#c0392b',
    COIN: '#f1c40f',
    COIN_SHADOW: '#f39c12',
    SPIKE_SAFE: '#7f8c8d',
    SPIKE_DANGER: '#bdc3c7',
    SLIME: '#2ecc71',
    BAT: '#9b59b6',
    UI_TEXT: '#ecf0f1',
    UI_OVERLAY: 'rgba(0, 0, 0, 0.7)'
};

/**
 * Key Codes Mapping
 */
export const KEYS = {
    ENTER: 13,
    ESC: 27,
    SPACE: 32,
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    SHIFT: 16,
    Z: 90,
    R: 82
};

/**
 * The Main Game State Object.
 * Tracks everything happening in the game.
 */
export const gameState = {
    // Core State
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2
    frameCount: 0,
    deltaTime: 0,
    lastFrameTime: 0,
    
    // Player State
    player: null,
    score: 0,
    highScore: 0,
    
    // World State
    cameraX: 0,
    cameraY: 0,
    worldOffsetX: 0, // Global world offset in tiles
    
    // The Void (Doom Wall)
    voidX: -5, // Starts behind player (in tile coordinates)
    voidSpeed: VOID_SPEED_INITIAL,
    
    // Entities collections
    entities: [],     // All updateable/renderable entities
    tiles: new Map(), // Sparse map of static tiles "x,y" -> TileObject
    particles: [],    // Visual effects
    
    // Level Generation
    nextLoadX: 0,     // The x-coordinate (in tiles) where we need to generate next
    chunkSize: 10,    // Width of chunks in tiles
    
    // Input Buffer
    inputQueue: [],
    lastInputTime: 0
};

/**
 * Global Logger for debug/replay info
 */
export function initLogs(p) {
    p.logs = {
        "game_info": [],
        "inputs": [],
        "player_info": []
    };
}

/**
 * Reset the game state for a new run.
 * Keeps high score and logs structure but clears gameplay data.
 */
export function resetGameState() {
    gameState.gamePhase = "START";
    gameState.frameCount = 0;
    gameState.score = 0;
    
    gameState.cameraX = 0;
    gameState.cameraY = 0;
    gameState.worldOffsetX = 0;
    
    gameState.voidX = -5;
    gameState.voidSpeed = VOID_SPEED_INITIAL;
    
    gameState.entities = [];
    gameState.tiles.clear();
    gameState.particles = [];
    
    gameState.nextLoadX = -5; // Start generating a bit behind
    gameState.inputQueue = [];
}

/**
 * Expose gameState globally
 */
export function getGameState() {
    return gameState;
}
window.getGameState = getGameState;