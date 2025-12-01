/**
 * Global constants and state management for Neon Bounce Escape
 */

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const FPS = 60;

// Physics Constants
export const GRAVITY = 0.6;
export const TERMINAL_VELOCITY = 15;
export const FRICTION = 0.96; // Air/Ground friction
export const MOVE_ACCEL = 0.5;
export const MAX_SPEED = 8;
export const JUMP_FORCE = -11;
export const BOUNCE_RESTITUTION = 0.6; // Bounciness of the ball

// World Generation
export const TILE_SIZE = 40;
export const LEVEL_LENGTH = 3000;

export const gameState = {
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2
    
    // Entities
    player: null,
    entities: [],
    platforms: [],
    hazards: [],
    collectibles: [],
    particles: [],
    
    // World State
    cameraX: 0,
    cameraY: 0,
    score: 0,
    levelLength: LEVEL_LENGTH,
    
    // Performance / Time
    frameCount: 0,
    deltaTime: 0,
    lastFrameTime: 0,
    
    // Debug / Logs
    debugMode: false
};

// Global accessor for constraints
export function getGameState() {
    return gameState;
}

// Set global accessor
window.getGameState = getGameState;

export function resetGameState() {
    gameState.entities = [];
    gameState.platforms = [];
    gameState.hazards = [];
    gameState.collectibles = [];
    gameState.particles = [];
    gameState.score = 0;
    gameState.cameraX = 0;
    gameState.cameraY = 0;
    gameState.frameCount = 0;
}