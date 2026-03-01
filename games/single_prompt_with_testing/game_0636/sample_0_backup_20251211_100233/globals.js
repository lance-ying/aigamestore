/**
 * globals.js
 * Contains global constants, game state management, and configuration.
 */

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;

// Game Configuration
export const GAME_CONFIG = {
    gravity: 0.5,
    knifeSpeed: 25,
    knifeSpawnY: 340,
    targetCenterY: 140, // Center of the log
    targetRadius: 60,
    stickDepth: 20, // How deep the knife goes into the log
    collisionTolerance: 0.15, // Radians distance to consider a collision
    bossInterval: 5, // Every 5 levels is a boss
    colors: {
        bg: [30, 30, 40],
        ui: [255, 255, 255],
        accent: [255, 100, 100],
        woodLight: [160, 120, 60],
        woodDark: [100, 70, 30],
        knifeHandle: [50, 50, 60],
        knifeBlade: [200, 200, 210]
    }
};

// Global Game State
// initialized in game.js setup, updated in draw
export const gameState = {
    // Core state
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE, LEVEL_TRANSITION
    controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2
    
    // Level progress
    score: 0,
    stage: 1,
    applesCollected: 0,
    
    // Level specific data
    knivesRemaining: 0, // Knives player needs to throw to clear level
    
    // Entities
    player: null, // Virtual player object for stats
    target: null, // The current rotating log/boss
    activeKnife: null, // The knife currently being prepared or thrown
    projectiles: [], // Array of flying knives (usually just one, but good for extensibility)
    stuckKnives: [], // Knives attached to the target
    particles: [], // Visual effects
    
    // Physics & Time
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0,
    
    // Screen Shake
    shakeAmplitude: 0,
    shakeDuration: 0,

    // Input state
    keys: {}
};

/**
 * Returns the global game state.
 * Exposed to window for debugging and external access.
 */
export function getGameState() {
    return gameState;
}

// Expose globally
window.getGameState = getGameState;

/**
 * Resets the level-specific state (called when advancing level or restarting)
 */
export function resetLevelState() {
    gameState.projectiles = [];
    gameState.stuckKnives = [];
    gameState.activeKnife = null;
    gameState.particles = [];
}

/**
 * Full game reset
 */
export function resetGame() {
    gameState.score = 0;
    gameState.stage = 1;
    gameState.applesCollected = 0;
    resetLevelState();
}