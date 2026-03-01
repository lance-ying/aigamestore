/**
 * globals.js
 * Contains global constants, configuration, and the main game state object.
 * This file serves as the single source of truth for game configuration.
 */

// ------------------------------------------------------------------
// Game Configuration Constants
// ------------------------------------------------------------------

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const FPS = 60;

// Physics Constants
export const GRAVITY = 0.6;
export const MAX_GRAVITY = 15;
export const FRICTION = 0.85;
export const AIR_RESISTANCE = 0.95;
export const TERMINAL_VELOCITY = 12;

// Player Constants
export const PLAYER_WIDTH = 30;
export const PLAYER_HEIGHT = 30;
export const PLAYER_SPEED = 0.5; // Acceleration
export const PLAYER_MAX_SPEED = 6.5;
export const PLAYER_JUMP_FORCE = -11;
export const PLAYER_JUMP_HOLD_FORCE = -0.6; // For variable jump height
export const PLAYER_MAX_JUMP_FRAMES = 12; // How long space can be held

// World Generation
export const LEVEL_LENGTH = 10000; // Pixel distance to finish
export const CHUNK_SIZE = 800;
export const TILE_SIZE = 40;

// Colors (RGB Arrays)
export const COLORS = {
    BACKGROUND: [240, 248, 255], // Alice Blue
    GROUND: [46, 52, 64],        // Dark Grey
    PLAYER: [136, 192, 208],     // Nordic Blue
    PLAYER_OUTLINE: [94, 129, 172],
    SPIKE: [191, 97, 106],       // Red
    ORB: [235, 203, 139],        // Yellow/Gold
    PARTICLE_JUMP: [255, 255, 255],
    PARTICLE_DEATH: [191, 97, 106],
    TEXT: [46, 52, 64],
    UI_OVERLAY: [0, 0, 0, 150]
};

// ------------------------------------------------------------------
// Game State Management
// ------------------------------------------------------------------

/**
 * The central game state object.
 * Modified by game logic, read by the renderer.
 */
export const gameState = {
    // Phase Management
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2, TEST_3

    // Entities
    player: null,
    entities: [], // Flat list of all updateable entities
    platforms: [], // Static collision geometry
    hazards: [], // Spikes, etc.
    collectibles: [], // Orbs, coins
    particles: [], // Visual effects

    // Camera / Viewport
    camera: {
        x: 0,
        y: 0,
        shake: 0
    },

    // Progression
    score: 0,
    distanceTraveled: 0,
    levelProgress: 0, // 0.0 to 1.0

    // Time & Performance
    frameCount: 0,
    deltaTime: 0,
    lastFrameTime: 0,

    // Input State (Snapshot for the current frame)
    inputs: {
        left: false,
        right: false,
        up: false,
        down: false,
        jump: false,
        action: false,
        pause: false,
        restart: false
    }
};

/**
 * Resets the game state for a new session.
 * Called when starting or restarting the game.
 */
export function resetGameState() {
    gameState.gamePhase = "START";
    gameState.entities = [];
    gameState.platforms = [];
    gameState.hazards = [];
    gameState.collectibles = [];
    gameState.particles = [];
    gameState.score = 0;
    gameState.distanceTraveled = 0;
    gameState.levelProgress = 0;
    gameState.camera.x = 0;
    gameState.camera.y = 0;
    gameState.camera.shake = 0;
    gameState.frameCount = 0;
    
    // Note: inputs are reset by the Input handler
}

/**
 * Expose gameState globally as required by constraints
 */
export function getGameState() {
    return gameState;
}

window.getGameState = getGameState;