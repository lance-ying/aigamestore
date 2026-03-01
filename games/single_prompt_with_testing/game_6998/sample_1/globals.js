/**
 * Global constants and state management for Super Phantom Cat 2 Clone.
 * Contains the central gameState object and configuration constants.
 */

// Canvas Dimensions
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Physics Constants
export const GRAVITY = 0.6;
export const TERMINAL_VELOCITY = 12;
export const FRICTION = 0.85;
export const AIR_RESISTANCE = 0.95;

// Game Colors (Neon / Phantom World Theme)
export const COLORS = {
    background: '#1a1a2e',
    background_accent: '#16213e',
    player: '#ffffff',
    player_outline: '#e94560',
    ground: '#0f3460',
    ground_top: '#533483',
    enemy: '#e94560',
    collectible: '#fldc11', // Gold/Yellow
    powerup: '#00fff5', // Cyan
    text: '#ffffff',
    ui_bg: 'rgba(0, 0, 0, 0.7)',
    spike: '#ff2e63'
};

// Global Game State
export const gameState = {
    // Phase Management
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2

    // Performance
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0,

    // Entities
    player: null,
    entities: [], // All updateable entities
    platforms: [], // Static collision geometry
    enemies: [], // Hostile entities
    collectibles: [], // Stars, Powerups
    particles: [], // Visual effects
    projectiles: [], // Bullets

    // World State
    camera: {
        x: 0,
        y: 0
    },
    worldWidth: 3000,
    worldHeight: 800,
    
    // Player Progress
    score: 0,
    starsCollected: 0,
    totalStars: 0,
    
    // Debug/Logging
    debugMode: false
};

// Accessor for global state
export function getGameState() {
    return gameState;
}

// Ensure global access
if (typeof window !== 'undefined') {
    window.getGameState = getGameState;
}

/**
 * Resets the game state for a new game.
 * Clears arrays and resets counters.
 */
export function resetGameState() {
    gameState.entities = [];
    gameState.platforms = [];
    gameState.enemies = [];
    gameState.collectibles = [];
    gameState.particles = [];
    gameState.projectiles = [];
    gameState.score = 0;
    gameState.starsCollected = 0;
    gameState.camera.x = 0;
    gameState.camera.y = 0;
    // Player is recreated in setup
}