/**
 * globals.js
 * Contains global state management, constants, and shared utilities.
 */

// ------------------------------------------------------------------
// CONSTANTS
// ------------------------------------------------------------------

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const KEYS = {
    ENTER: 13,
    ESC: 27,
    SPACE: 32,
    SHIFT: 16,
    Z: 90,
    R: 82,
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40
};

export const COLORS = {
    BACKGROUND: [20, 15, 30],
    GROUND: [40, 35, 50],
    PLATFORM: [60, 55, 80],
    PLAYER_MAIN: [0, 255, 150], // Neon Cyan/Green
    PLAYER_ACCENT: [255, 255, 255],
    ENEMY_MAIN: [255, 50, 50], // Red
    ENEMY_ACCENT: [100, 0, 0],
    HOOK: [255, 180, 0], // Gold/Orange
    COLLECTIBLE: [0, 200, 255],
    TEXT: [230, 230, 230],
    UI_BG: [0, 0, 0, 150]
};

// Physics Constants
export const GRAVITY = 0.6;
export const TERMINAL_VELOCITY = 12;
export const FRICTION = 0.85;
export const AIR_RESISTANCE = 0.95;

// Game State Management
export const gameState = {
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2
    
    // Time tracking
    frameCount: 0,
    deltaTime: 0,
    lastFrameTime: 0,
    
    // World State
    camera: { x: 0, y: 0, target: null },
    worldWidth: 4000,
    worldHeight: 800,
    
    // Entities lists
    player: null,
    entities: [],
    enemies: [],
    platforms: [],
    projectiles: [],
    collectibles: [],
    particles: [],
    
    // Gameplay Stats
    score: 0,
    combo: 0,
    comboTimer: 0,
    
    // Debug/Logging
    debugMode: false
};

// Expose gameState globally
export function getGameState() {
    return gameState;
}
window.getGameState = getGameState;

// Reset Game State for Restart
export function resetGameState() {
    gameState.score = 0;
    gameState.combo = 0;
    gameState.entities = [];
    gameState.enemies = [];
    gameState.platforms = [];
    gameState.projectiles = [];
    gameState.collectibles = [];
    gameState.particles = [];
    gameState.camera = { x: 0, y: 0, target: null };
    gameState.player = null;
    // Note: frameCount and gamePhase are managed by the main loop controller
}