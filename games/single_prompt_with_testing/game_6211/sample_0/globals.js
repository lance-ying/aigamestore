// globals.js
// Constants and shared state management

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TILE_SIZE = 40;

// Physics Constants
export const GRAVITY = 0.6;
export const TERMINAL_VELOCITY = 15;
export const FRICTION = 0.8;
export const AIR_RESISTANCE = 0.95;

// Player Constants
export const PLAYER_SPEED = 5;
export const JUMP_FORCE = 11;
export const WALL_SLIDE_SPEED = 2;
export const WALL_JUMP_FORCE = { x: 6, y: 12 };
export const SPIN_FORCE = 5;

// Game State
export const gameState = {
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2
    
    player: null,
    entities: [],     // All interactive objects (enemies, coins)
    platforms: [],    // Static collision geometry
    particles: [],    // Visual effects
    
    // Level specific
    cameraX: 0,
    cameraY: 0,
    levelLength: 0,
    score: 0,
    
    // Time tracking
    frameCount: 0,
    deltaTime: 0,
    lastFrameTime: 0,

    // Input state (for logic access)
    keys: {}
};

// Global accessor as required
window.getGameState = () => gameState;

// Logging function
export function logGameInfo(p, type, data) {
    if (!p.logs) return;
    
    // Initialize specific log array if missing (defensive)
    if (!p.logs[type]) p.logs[type] = [];

    p.logs[type].push({
        ...data,
        framecount: p.frameCount,
        timestamp: Date.now()
    });
}