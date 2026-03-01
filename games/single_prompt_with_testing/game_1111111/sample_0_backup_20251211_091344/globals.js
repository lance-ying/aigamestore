/**
 * Global constants and game state management.
 */

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;

// Physics Constants
export const GRAVITY = 0.6;
export const FRICTION = 0.85;
export const AIR_RESISTANCE = 0.95;
export const MAX_SPEED = 12;
export const JUMP_FORCE = -13;
export const WALL_JUMP_FORCE = { x: 8, y: -11 };
export const ACCELERATION = 0.8;
export const GRAPPLE_RANGE = 250;
export const GRAPPLE_STRENGTH = 1.5;

// Level Constants
export const LEVEL_WIDTH = 3200; // Width of one lap
export const TILE_SIZE = 40;

// Game State Object
export const gameState = {
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN",
    
    // Entities
    player: null,
    entities: [], // All dynamic entities (players + bots + items)
    platforms: [], // Static geometry
    hazards: [], // Spikes, etc.
    particles: [],
    projectiles: [],
    
    // Camera
    cameraX: 0,
    cameraY: 0,
    cameraShake: 0,
    
    // Race State
    laps: 3,
    leader: null,
    aliveCount: 4,
    
    // Performance
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0,
    
    // Testing
    debugMode: false
};

// Colors
export const COLORS = {
    background: [20, 24, 35],
    platforms: [40, 45, 60],
    highlight: [100, 200, 255],
    player: [255, 50, 50],     // Red
    bot1: [50, 255, 50],       // Green
    bot2: [50, 100, 255],      // Blue
    bot3: [255, 255, 50],      // Yellow
    spikes: [255, 0, 0],
    grappleLine: [200, 200, 200],
    text: [255, 255, 255]
};

// Global Logger initialization (called in setup)
export function initLogs(p) {
    p.logs = {
        "game_info": [],
        "inputs": [],
        "player_info": []
    };
}

// Global Accessor
export function getGameState() {
    return gameState;
}
window.getGameState = getGameState;