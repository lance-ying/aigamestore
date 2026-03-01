/**
 * Global constants and state management for Go Escape.
 * This file acts as the central repository for game data.
 */

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Physics Constants
export const GRAVITY = 0.5;
export const TERMINAL_VELOCITY = 15;
export const FRICTION_GROUND = 0.96;
export const FRICTION_AIR = 0.99;
export const BOUNCE_RESTITUTION = 0.4; // How much energy is kept after a bounce
export const MIN_VELOCITY_THRESHOLD = 0.1;

// World Generation Constants
export const TILE_SIZE = 40;
export const LEVEL_LENGTH = 100; // In tiles
export const WORLD_WIDTH = LEVEL_LENGTH * TILE_SIZE;
export const WORLD_HEIGHT = CANVAS_HEIGHT * 2; // Allow for some verticality

// Colors (Neon Palette)
export const COLORS = {
    BACKGROUND: [20, 20, 30],
    PLAYER: [0, 255, 255], // Cyan
    PLAYER_GLOW: [0, 200, 200, 100],
    PLATFORM_NORMAL: [100, 100, 120],
    PLATFORM_BOUNCY: [255, 0, 255], // Magenta
    PLATFORM_MOVING: [255, 165, 0], // Orange
    PLATFORM_VANISHING: [100, 255, 100], // Green
    SPIKE: [255, 50, 50], // Red
    COLLECTIBLE: [255, 255, 0], // Yellow
    GOAL: [0, 255, 128], // Spring Green
    TEXT: [255, 255, 255],
    HUD_BG: [0, 0, 0, 150]
};

/**
 * Global Game State
 * Tracks everything happening in the game.
 */
export const gameState = {
    // Phase management
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2, TEST_3
    
    // Time tracking
    frameCount: 0,
    deltaTime: 0,
    lastFrameTime: 0,
    
    // Core Entities
    player: null,
    entities: [], // Flat list of all interactive entities
    
    // Specific Entity Lists for Optimized Access
    platforms: [],
    obstacles: [],
    collectibles: [],
    particles: [],
    
    // Camera
    camera: {
        x: 0,
        y: 0,
        target: null,
        shakeAmount: 0
    },
    
    // Gameplay Stats
    score: 0,
    orbsCollected: 0,
    timeElapsed: 0,
    
    // Inputs (updated by input.js)
    inputs: {
        left: false,
        right: false,
        up: false,
        down: false,
        jump: false,
        brake: false,
        boost: false,
        restart: false,
        pause: false,
        start: false
    }
};

/**
 * Expose gameState to window for debugging and requirements
 */
export function getGameState() {
    return gameState;
}
window.getGameState = getGameState;

/**
 * Resets the game state for a new game
 */
export function resetGameState() {
    gameState.score = 0;
    gameState.orbsCollected = 0;
    gameState.frameCount = 0;
    gameState.timeElapsed = 0;
    gameState.entities = [];
    gameState.platforms = [];
    gameState.obstacles = [];
    gameState.collectibles = [];
    gameState.particles = [];
    gameState.camera.x = 0;
    gameState.camera.y = 0;
    gameState.camera.shakeAmount = 0;
    
    // Reset inputs
    Object.keys(gameState.inputs).forEach(key => gameState.inputs[key] = false);
}