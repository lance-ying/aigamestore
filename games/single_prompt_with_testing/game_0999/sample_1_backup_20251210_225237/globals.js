/**
 * Global constants and state management for the game.
 * Contains the central gameState object and configuration values.
 */

// Canvas Dimensions
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Physics Constants
export const GRAVITY = 0.6;
export const TERMINAL_VELOCITY = 12;
export const FRICTION = 0.85; // Ground friction
export const AIR_RESISTANCE = 0.98;

// Game Colors (Retro Palette)
export const PALETTE = {
    bg: [20, 10, 20],           // Dark Purple/Black
    ground: [45, 30, 60],       // Dark Purple Base
    groundDetail: [70, 50, 90], // Lighter Purple
    uiText: [255, 255, 255],
    uiBarBg: [50, 0, 0],
    uiHealth: [200, 20, 20],
    uiMana: [20, 20, 200],
    
    // Character Colors
    zangetsu: {
        main: [180, 40, 40],    // Red coat
        skin: [255, 200, 180],
        hair: [50, 50, 50],
        weapon: [200, 200, 200]
    },
    miriam: {
        main: [40, 40, 180],    // Blue dress
        skin: [255, 220, 200],
        hair: [20, 20, 20],
        weapon: [100, 100, 255]
    },
    
    // Enemy Colors
    skeleton: [220, 220, 200],
    bat: [80, 60, 100],
    boss: [100, 0, 0]
};

// Global Game State
export const gameState = {
    gamePhase: "START",     // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN",   // HUMAN, TEST_1, TEST_2, etc.
    
    player: null,           // Reference to the main player entity
    currentLevel: null,     // Reference to the map/level object
    
    // Entity Collections
    entities: [],           // All updateable entities
    enemies: [],            // Specific list for collision checks
    particles: [],          // Visual effects
    projectiles: [],        // Bullets, magic, etc.
    collectibles: [],       // Hearts, upgrades
    
    // Camera
    camera: {
        x: 0,
        y: 0,
        target: null
    },
    
    // Session Stats
    score: 0,
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0,
    
    // Debug/Logging
    debugMode: false
};

/**
 * Resets the game state for a new session.
 */
export function resetGameState() {
    gameState.entities = [];
    gameState.enemies = [];
    gameState.particles = [];
    gameState.projectiles = [];
    gameState.collectibles = [];
    gameState.score = 0;
    gameState.camera.x = 0;
    gameState.camera.y = 0;
    // Player and Level need to be re-initialized in game.js setup
}

/**
 * Expose gameState globally for debugging and requirements.
 */
export function getGameState() {
    return gameState;
}
window.getGameState = getGameState;