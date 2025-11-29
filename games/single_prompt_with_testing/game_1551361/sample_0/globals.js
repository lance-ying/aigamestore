import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Game State
export const gameState = {
    // Phase
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2

    // Three.js Core
    scene: null,
    camera: null,
    renderer: null,
    gameContainer: null,

    // Lighting
    lights: [],
    ambientLight: null,
    directionalLight: null,

    // Physics
    gravity: new THREE.Vector3(0, -20.0, 0), // Stronger gravity for car handling
    
    // Entities
    player: null,
    entities: [], // Generic list
    collectibles: [],
    props: [], // Static environment objects
    terrain: null,

    // Gameplay
    score: 0,
    totalTokens: 10,
    tokensCollected: 0,
    timeLeft: 120, // Seconds
    
    // Performance / Time
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0,
    
    // Helper for debugging/testing
    debug: {
        testTimer: 0
    }
};

// Global Logs
export const logs = {
    game_info: [],
    player_info: [],
    inputs: []
};

// Expose gameState globally
window.getGameState = () => gameState;
window.logs = logs;
window.gameInstance = { gameState, logs };

export const COLORS = {
    sky: 0x87CEEB,
    ground_desert: 0xE6C288,
    ground_jungle: 0x2E8B57,
    ground_canyon: 0xCD5C5C,
    ground_festival: 0x333333,
    car_paint: 0xFF4500,
    token: 0xFFD700
};