/**
 * globals.js
 * Contains global constants, game state initialization, and logging structures.
 */

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// World dimensions (Vertical scrolling level)
export const WORLD_WIDTH = 600;
export const WORLD_HEIGHT = 3000; // A tall tower

// Physics Constants
export const GRAVITY = 0.5;
export const TERMINAL_VELOCITY = 12;
export const FRICTION = 0.85;
export const AIR_RESISTANCE = 0.95;

// Game State Object
export const gameState = {
    // Core state
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2, TEST_3
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0,
    
    // Entities
    player: null,
    entities: [],     // All generic entities
    platforms: [],    // Static collision geometry
    enemies: [],      // Hostile mobs
    projectiles: [],  // Bullets/Beams
    particles: [],    // Visual effects
    collectibles: [], // Gems, health, weapon crates
    
    // Camera
    cameraX: 0,
    cameraY: 0,
    cameraShake: 0,
    
    // Game progress
    score: 0,
    level: 1,
    combo: 0,
    comboTimer: 0,
    
    // Input state (processed)
    inputs: {
        left: false,
        right: false,
        up: false,
        down: false,
        jump: false,
        shoot: false,
        dash: false,
        jumpPressed: false, // Frame-specific trigger
        shootPressed: false,
        dashPressed: false
    }
};

/**
 * Resets the game state for a new run.
 * Keeps controlMode and some meta-settings, resets gameplay data.
 */
export function resetGameState() {
    gameState.gamePhase = "START";
    gameState.entities = [];
    gameState.platforms = [];
    gameState.enemies = [];
    gameState.projectiles = [];
    gameState.particles = [];
    gameState.collectibles = [];
    gameState.player = null;
    gameState.cameraX = 0;
    gameState.cameraY = WORLD_HEIGHT - CANVAS_HEIGHT; // Start at bottom
    gameState.cameraShake = 0;
    gameState.score = 0;
    gameState.combo = 0;
    gameState.comboTimer = 0;
}

// Global accessor
export function getGameState() {
    return gameState;
}
window.getGameState = getGameState;