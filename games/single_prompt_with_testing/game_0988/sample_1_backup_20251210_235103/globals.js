import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

// Game Constants
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;
export const GRAVITY = new THREE.Vector3(0, -0.015, 0); // Tuned for platformer feel
export const MAX_FALL_Y = -20;
export const STARTING_SPEED = 0.15;
export const SPEED_INCREMENT = 0.0001;
export const JUMP_FORCE = 0.35;
export const TURN_SPEED = 0.15; // Camera smoothing
export const PLATFORM_WIDTH = 2;
export const PLATFORM_HEIGHT = 1;

// Directions
export const DIRECTION = {
    NORTH: 0, // -Z
    EAST: 1,  // +X
    SOUTH: 2, // +Z
    WEST: 3   // -X
};

// Global Game State
export const gameState = {
    // Phase Management
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN", // HUMAN, TEST_1...TEST_7
    
    // Core Systems
    scene: null,
    camera: null,
    renderer: null,
    gameContainer: null,
    
    // Time
    frameCount: 0,
    deltaTime: 0,
    lastFrameTime: 0,
    timeSinceStart: 0,
    
    // Physics & World
    gravity: GRAVITY,
    
    // Entities
    player: null,
    platforms: [],
    collectibles: [],
    particles: [],
    
    // Gameplay Stats
    score: 0,
    highScore: 0,
    gemsCollected: 0,
    distanceTraveled: 0,
    currentSpeed: STARTING_SPEED,
    
    // Camera State
    cameraTargetPos: new THREE.Vector3(),
    cameraOffset: new THREE.Vector3(0, 8, 8),
    cameraLookAt: new THREE.Vector3(),
    
    // Generator State
    lastPlatformPos: new THREE.Vector3(0, 0, 0),
    currentDirection: DIRECTION.NORTH,
    platformsSpawned: 0,
    
    // Color Palette (Dynamic)
    palette: {
        background: 0x202030,
        player: 0xFF0055,
        platformTop: 0x44aa88,
        platformSide: 0x338866,
        gem: 0x00FFFF
    }
};

// Initialize Logs
window.logs = {
    game_info: [],
    player_info: [],
    inputs: []
};

// Expose Game State
export function getGameState() {
    return gameState;
}
window.getGameState = getGameState;

// Color helper
export function updatePalette(hueOffset) {
    const hue = (hueOffset % 1);
    const color = new THREE.Color().setHSL(hue, 0.6, 0.5);
    gameState.palette.platformTop = color.getHex();
    
    const sideColor = new THREE.Color().setHSL(hue, 0.6, 0.3);
    gameState.palette.platformSide = sideColor.getHex();
}