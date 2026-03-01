// globals.js
// Constants and Global State Management

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Physics Constants
export const GRAVITY = 0.6;
export const MAX_FALL_SPEED = 15;
export const FRICTION_GROUND = 0.8;
export const FRICTION_AIR = 1.0; // No air friction implies no control, but we keep momentum
export const JUMP_POWER_MAX = 13.5;
export const JUMP_X_SPEED = 6.5; // Horizontal speed when jumping
export const WALK_SPEED = 3.5;
export const BOUNCE_FACTOR = 0.6; // How much speed is retained after hitting a wall

// Game States
export const GAME_PHASES = {
    START: "START",
    PLAYING: "PLAYING",
    PAUSED: "PAUSED",
    GAME_OVER_WIN: "GAME_OVER_WIN",
    GAME_OVER_LOSE: "GAME_OVER_LOSE" // Note: Lose is rare in this game, usually just falling, but included for completeness
};

export const CONTROL_MODES = {
    HUMAN: "HUMAN",
    TEST_1: "TEST_1",
    TEST_2: "TEST_2",
    TEST_3: "TEST_3"
};

// Global Game State
export const gameState = {
    player: null,
    entities: [],       // All dynamic entities
    platforms: [],      // Static geometry
    particles: [],      // Visual effects
    camera: {
        x: 0,
        y: 0,
        targetY: 0
    },
    
    // World dimensions
    worldHeight: 2400, // Multiples of 400. 6 screens tall.
    
    // Status
    gamePhase: GAME_PHASES.START,
    controlMode: CONTROL_MODES.HUMAN,
    
    // Progression
    score: 0,           // Height reached
    maxHeightReached: 0,
    startTime: 0,
    elapsedTime: 0,
    falls: 0,
    jumps: 0,
    
    // Performance
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0,
    
    // Debug
    debugMode: false
};

// Helper to access state globally
export function getGameState() {
    return gameState;
}

window.getGameState = getGameState;

export function resetGameState() {
    gameState.player = null;
    gameState.entities = [];
    gameState.platforms = [];
    gameState.particles = [];
    gameState.camera = { x: 0, y: 0, targetY: 0 };
    gameState.score = 0;
    gameState.maxHeightReached = 0;
    gameState.startTime = Date.now();
    gameState.elapsedTime = 0;
    gameState.falls = 0;
    gameState.jumps = 0;
    gameState.frameCount = 0;
}