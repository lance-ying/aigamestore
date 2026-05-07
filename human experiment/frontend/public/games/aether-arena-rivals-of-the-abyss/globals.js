// Global Constants and State Management

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const FRAME_RATE = 60;

// Physics Constants
export const PHYSICS = {
    GRAVITY: 0.6,
    TERMINAL_VELOCITY: 15,
    FRICTION: 0.82,
    AIR_RESISTANCE: 0.96,
    GROUND_ACCEL: 1.2,
    AIR_ACCEL: 0.5,
    JUMP_FORCE: -10,
    DOUBLE_JUMP_FORCE: -9,
    WALL_JUMP_FORCE: { X: 6, Y: -9 },
    KNOCKBACK_SCALING: 0.15,
    BASE_KNOCKBACK: 5,
    HITSTUN_SCALING: 0.4
};

// Stage Boundaries (Blast Zones)
export const STAGE_BOUNDS = {
    LEFT: -200,
    RIGHT: CANVAS_WIDTH + 200,
    TOP: -200,
    BOTTOM: CANVAS_HEIGHT + 150
};

// Game Colors
export const COLORS = {
    BACKGROUND: [30, 30, 35],
    BACKGROUND_PHASE2_TOP: [40, 0, 10],   // Dark Red
    BACKGROUND_PHASE2_BOT: [10, 0, 5],    // Almost Black
    PLATFORM: [100, 100, 110],
    PLATFORM_TOP: [130, 130, 140],
    PLATFORM_PHASE2: [80, 50, 50],        // Reddish Stone
    PLATFORM_TOP_PHASE2: [120, 70, 70],
    PLAYER: {
        BODY: [255, 100, 0], // Fire Orange
        MANE: [255, 200, 50], // Gold
        FIRE: [255, 50, 0]
    },
    ENEMY: {
        BODY: [80, 60, 90], // Shadow Purple
        BODY_FAST: [60, 80, 120], // Blue-ish
        BODY_HEAVY: [100, 40, 40], // Red-ish
        EYES: [255, 0, 50],
        EYES_FAST: [0, 255, 255],
        EYES_HEAVY: [255, 255, 0]
    },
    UI: {
        TEXT: [240, 240, 240],
        DAMAGE_LOW: [255, 255, 255],
        DAMAGE_MED: [255, 200, 0],
        DAMAGE_HIGH: [255, 0, 0]
    }
};

// Game State Object
export const gameState = {
    // Phase
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN", // HUMAN
    levelPhase: 1, // 1: Normal, 2: Abyss

    // Entities
    player: null,
    entities: [], // All updateable/renderable entities
    platforms: [],
    projectiles: [],
    particles: [],
    
    // Combat State
    enemies: [],
    wave: 1,
    score: 0,
    
    // Camera
    camera: {
        x: 0,
        y: 0,
        shake: 0
    },

    // Time
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0,
    
    // Debug/Logs
    logs: null // Initialized in game.js
};
// Expose gameState to the window object for external access
window.gameState = gameState;

/**
 * Returns the global game state.
 */
export function getGameState() {
    return gameState;
}
// Expose getGameState to the window object for external access
window.getGameState = getGameState;

/**
 * Resets the game state for a new game.
 */
export function resetGameState() {
    gameState.gamePhase = "START";
    gameState.levelPhase = 1;
    gameState.entities = [];
    gameState.platforms = [];
    gameState.projectiles = [];
    gameState.particles = [];
    gameState.enemies = [];
    gameState.wave = 1;
    gameState.score = 0;
    gameState.camera = { x: 0, y: 0, shake: 0 };
    gameState.frameCount = 0;
    // Player is re-initialized in setup/restart logic
}