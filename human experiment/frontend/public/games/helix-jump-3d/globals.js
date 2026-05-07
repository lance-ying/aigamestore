import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

// Game Constants
export const CONSTANTS = {
    GRAVITY: -0.008,      // Reduced gravity for floatier, slower bounce
    BOUNCE_FORCE: 0.21,   // Adjusted force to maintain height with lower gravity
    TERMINAL_VELOCITY: -0.5,
    BALL_RADIUS: 0.4,
    BALL_DISTANCE: 2.5, // Distance from center
    TOWER_RADIUS: 1.5,
    PLATFORM_WIDTH: 2.0,
    PLATFORM_HEIGHT: 0.2,
    PLATFORM_GAP: 4.0, // Vertical distance between platforms
    ROTATION_SPEED: 0.08,
    CAMERA_OFFSET: new THREE.Vector3(0, 6, 10), // Higher Y and Z for better view of bottom
    COLORS: {
        BALL: 0xFF0055,
        TOWER: 0xFFFFFF,
        PLATFORM_SAFE: 0x222222, // Dark
        PLATFORM_TRAP: 0xFF0000,
        BACKGROUND: 0x87CEEB,
        PARTICLE: 0xFFFFFF
    },
    LEVEL_COUNT: 50
};

// Global Game State
export const gameState = {
    // Phase
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2

    // Systems
    scene: null,
    camera: null,
    renderer: null,
    gameContainer: null,
    
    // Entities
    entities: [],
    ball: null,
    tower: null,
    platforms: [],
    particles: [],
    
    // State
    score: 0,
    level: 1,
    towerRotation: 0,
    targetRotation: 0, // For smoothing
    cameraTargetY: 0,
    
    // Time
    frameCount: 0,
    deltaTime: 0,
    lastTime: 0
};

// Expose gameState globally
window.getGameState = () => gameState;

// Logging system
window.logs = {
    game_info: [],
    player_info: [],
    inputs: []
};

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;