/**
 * globals.js
 * Contains global constants, game state definition, and initial configuration.
 * This file serves as the single source of truth for game configuration.
 */

// Canvas Dimensions
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// World Dimensions (Scrollable level)
export const WORLD_WIDTH = 3000;
export const WORLD_HEIGHT = 600;

// Game Physics Constants
export const GRAVITY = 0.6;
export const TERMINAL_VELOCITY = 12;
export const FRICTION = 0.85;
export const AIR_RESISTANCE = 0.95;

// Player Configuration
export const PLAYER_SPEED = 6;
export const PLAYER_JUMP_FORCE = -13;
export const PLAYER_MAX_HEALTH = 100;
export const PLAYER_MAX_STABILITY = 100; // For Phasing mechanic
export const STABILITY_DRAIN_RATE = 2.0;
export const STABILITY_REGEN_RATE = 0.5;
export const PHASE_COLOR = [0, 255, 255]; // Cyan
export const NORMAL_COLOR = [0, 255, 100]; // Neon Green
export const DAMAGE_COLOR = [255, 50, 50]; // Red flash

// UI Constants
export const UI_PADDING = 20;

/**
 * Game State Object
 * Maintains the current status of all game entities and flow.
 */
export const gameState = {
    // Core Game Flow
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2, etc.
    frameCount: 0,
    deltaTime: 0,
    lastFrameTime: 0,
    
    // Camera System
    camera: {
        x: 0,
        y: 0,
        shake: 0
    },

    // Player Entity
    player: null,

    // Entity Containers
    entities: [],       // Flat list of all updateable/renderable entities
    platforms: [],      // Collision geometry
    enemies: [],        // Hostiles
    collectibles: [],   // Score items
    projectiles: [],    // Bullets
    particles: [],      // Visual effects
    hazards: [],        // Spikes, firewalls
    
    // Level State
    goal: null,         // The exit portal
    score: 0,
    levelTime: 0,
    
    // Input State
    keys: {},           // Current frame key state
    prevKeys: {}        // Previous frame key state (for "just pressed" logic)
};

/**
 * Resets the game state to default values for a new game.
 * Note: Does not reset high-level config or p5 instance.
 */
export function resetGameState() {
    gameState.gamePhase = "START";
    gameState.score = 0;
    gameState.levelTime = 0;
    gameState.camera.x = 0;
    gameState.camera.y = 0;
    gameState.camera.shake = 0;
    
    // Clear arrays
    gameState.entities = [];
    gameState.platforms = [];
    gameState.enemies = [];
    gameState.collectibles = [];
    gameState.projectiles = [];
    gameState.particles = [];
    gameState.hazards = [];
    
    gameState.player = null;
    gameState.goal = null;
}

/**
 * Global accessor for game state, exposed to window for debugging/testing
 */
export function getGameState() {
    return gameState;
}

// Expose to window immediately
window.getGameState = getGameState;