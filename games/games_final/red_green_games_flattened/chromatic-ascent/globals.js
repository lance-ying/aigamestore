/**
 * globals.js
 * Contains global constants, state management, and shared utilities.
 */

// Canvas Dimensions
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Game Colors (Neon/Vibrant Palette)
export const COLORS = {
    CYAN: '#00FFFF',    // 0
    MAGENTA: '#FF00FF', // 1
    YELLOW: '#FFFF00',  // 2
    PURPLE: '#8C00FF',  // 3
    WHITE: '#FFFFFF',
    BACKGROUND: '#1a1a24'
};

// Map indices to color hex strings for logic
export const COLOR_KEYS = [COLORS.CYAN, COLORS.MAGENTA, COLORS.YELLOW, COLORS.PURPLE];

// Game State Object
// Centralized state management for the entire game lifecycle
export const gameState = {
    // Phase Management
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    
    // Core Entities
    player: null,
    entities: [],       // General entity list for updates
    obstacles: [],      // Specific list for obstacle logic
    particles: [],      // Particle system
    items: [],          // Collectibles (Stars, Color Changers)
    
    // Scoring and Progression
    score: 0,
    highScore: 0,
    level: 1,
    
    // Camera / Viewport
    cameraY: 0,
    cameraScrollSpeed: 0,
    
    // World Generation
    lastObstacleY: 0,   // Y position of the highest generated obstacle
    
    // Physics Globals
    gravity: 0.25,
    terminalVelocity: 8,
    
    // Input/Control
    controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2
    keys: {},             // Current key states
    
    // Performance / Time
    frameCount: 0,
    deltaTime: 0,
    lastFrameTime: 0
};

/**
 * Expose gameState globally for debugging and hard constraints
 */
export function getGameState() {
    return gameState;
}
window.getGameState = getGameState;

/**
 * Reset game state for a new game
 */
export function resetGameState() {
    gameState.gamePhase = "START";
    gameState.score = 0;
    gameState.level = 1;
    gameState.cameraY = 0;
    gameState.entities = [];
    gameState.obstacles = [];
    gameState.particles = [];
    gameState.items = [];
    gameState.lastObstacleY = 0;
    gameState.player = null;
    gameState.frameCount = 0;
}

/**
 * Utility to get a random game color
 */
export function getRandomColor(p) {
    const idx = Math.floor(p.random(COLOR_KEYS.length));
    return COLOR_KEYS[idx];
}

/**
 * Utility to convert hex to p5 color
 */
export function hexToP5Color(p, hex) {
    const c = p.color(hex);
    return c;
}