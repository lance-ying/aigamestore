import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

// Canvas Dimensions
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Game State Management
export const gameState = {
    // Phase Management
    gamePhase: "START", // "START", "PLAYING", "PAUSED", "GAME_OVER_WIN", "GAME_OVER_LOSE"
    controlMode: "HUMAN", // "HUMAN", "TEST_1", "TEST_2", etc.
    
    // Core Three.js Objects
    scene: null,
    camera: null,
    renderer: null,
    gameContainer: null,
    
    // Lighting
    lights: [],
    ambientLight: null,
    directionalLight: null,
    
    // Physics & World
    gravity: new THREE.Vector3(0, -0.035, 0), // Tuned for "floaty" but heavy fall guy feel
    entities: [],     // All updateable entities
    colliders: [],    // Static or kinematic objects that player collides with
    checkpoints: [],  // Respawn points
    
    // Specific Entities
    player: null,
    goal: null,
    
    // Camera State
    cameraOffset: new THREE.Vector3(0, 8, 12),
    cameraTarget: new THREE.Vector3(0, 0, 0),
    cameraLookAt: new THREE.Vector3(0, 0, 0),
    
    // Gameplay Data
    score: 0,
    startTime: 0,
    elapsedTime: 0,
    currentCheckpointIndex: 0,
    
    // Time Management
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0,
    
    // Input State (Snapshot for current frame)
    input: {
        up: false,
        down: false,
        left: false,
        right: false,
        jump: false,
        dive: false,
        restart: false,
        pause: false,
        start: false
    }
};

// Logging System initialization
if (!window.logs) {
    window.logs = {
        game_info: [],
        player_info: [],
        inputs: []
    };
}

export function getGameState() {
    return gameState;
}
window.getGameState = getGameState; // Expose globally as required

// Constants for Physics Materials
export const PHYSICS_MATERIALS = {
    DEFAULT: { friction: 0.8, bounciness: 0.1 },
    ICE: { friction: 0.05, bounciness: 0.1 },
    BOUNCY: { friction: 0.8, bounciness: 1.2 },
    MUD: { friction: 2.0, bounciness: 0.0 }
};

// Colors
export const COLORS = {
    SKY: 0x87CEEB,
    GROUND: 0xFF69B4, // Hot pink
    OBSTACLE: 0xFFD700, // Gold
    PLAYER: 0x00CED1, // Turquoise
    GOAL: 0x32CD32,   // Lime green
    DANGER: 0xFF4500  // Orange Red
};