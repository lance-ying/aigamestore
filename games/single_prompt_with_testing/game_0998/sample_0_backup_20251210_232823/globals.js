import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

// Global Game Configuration
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_CONFIG = {
    GRAVITY: -0.05,
    JUMP_FORCE: 0.65,
    MOVE_SPEED: 0.15,
    LIQUID_RISE_SPEED_BASE: 0.015,
    LIQUID_RISE_ACCELERATION: 0.0005,
    PLATFORM_SPAWN_INTERVAL: 120, // Frames
    PLATFORM_CLOSE_SPEED: 0.1,
    CAMERA_OFFSET_Y: 8,
    CAMERA_OFFSET_Z: 12,
    CAMERA_LOOK_Y_OFFSET: 2
};

// Global State Object
export const gameState = {
    // Core Status
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    frameCount: 0,
    deltaTime: 0,
    score: 0,
    highScore: 0,
    controlMode: "HUMAN",
    
    // Core Three.js Objects
    scene: null,
    camera: null,
    renderer: null,
    gameContainer: null,
    
    // Entities
    player: null,
    liquid: null,
    platforms: [],
    collectibles: [],
    particles: [],
    
    // State Tracking
    lastPlatformHeight: 0,
    liquidSpeed: GAME_CONFIG.LIQUID_RISE_SPEED_BASE,
    timeSinceLastSpawn: 0,
    level: 1,
    
    // Lighting
    lights: [],
    
    // Input State
    keys: {
        ArrowUp: false,
        ArrowDown: false,
        ArrowLeft: false,
        ArrowRight: false,
        Space: false,
        Shift: false,
        KeyW: false,
        KeyS: false,
        KeyA: false,
        KeyD: false,
        KeyZ: false
    }
};

// Initialize Logging
export const logs = {
    game_info: [],
    player_info: [],
    inputs: []
};

// Expose logs and gameState globally
window.logs = logs;

export function getGameState() {
    return gameState;
}
window.getGameState = getGameState;

export function resetGameState() {
    gameState.score = 0;
    gameState.frameCount = 0;
    gameState.lastPlatformHeight = 0;
    gameState.liquidSpeed = GAME_CONFIG.LIQUID_RISE_SPEED_BASE;
    gameState.timeSinceLastSpawn = 0;
    gameState.level = 1;
    gameState.platforms = [];
    gameState.collectibles = [];
    gameState.particles = [];
}