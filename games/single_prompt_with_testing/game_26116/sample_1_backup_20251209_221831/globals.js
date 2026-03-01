/**
 * Global constants and game state management.
 * Defines the core configuration and state container for the application.
 */

// Canvas Dimensions
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Physics Constants
export const GRAVITY = 0.6;
export const TERMINAL_VELOCITY = 12;
export const FRICTION = 0.85;
export const AIR_RESISTANCE = 0.95;

// Game State Container
export const gameState = {
    // Phase Management
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2
    
    // Time Management
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0,
    
    // Camera
    camera: {
        x: 0,
        y: 0,
        shake: 0
    },
    
    // World Bounds
    worldWidth: 3000,
    worldHeight: 400,

    // Entities
    player: null,
    entities: [],     // All interactive objects (enemies, projectiles, etc.)
    platforms: [],    // Static collision geometry
    particles: [],    // Visual effects
    
    // Game Progression
    score: 0,
    teleporter: null, // The goal object
    
    // Inputs (updated by input system)
    keys: {},
    
    // Debug
    debugMode: false
};

// Global Accessor
export function getGameState() {
    return gameState;
}

// Make accessible globally
window.getGameState = getGameState;