import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

// Game Configuration
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const LANE_WIDTH = 3.0;
export const GRAVITY = -0.05;
export const JUMP_FORCE = 0.8;
export const RUN_SPEED_START = 0.3;
export const RUN_SPEED_MAX = 0.8;
export const RUN_SPEED_ACCEL = 0.0001;

// Global Game State
export const gameState = {
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN",
    
    // Three.js instances
    scene: null,
    camera: null,
    renderer: null,
    gameContainer: null,
    
    // Lighting
    lights: [],
    
    // Game Objects
    player: null,
    pathSegments: [],
    obstacles: [],
    collectibles: [],
    decorations: [], // Trees, particles, etc.
    
    // State Tracking
    score: 0,
    distanceTraveled: 0,
    frameCount: 0,
    deltaTime: 0,
    runSpeed: RUN_SPEED_START,
    
    // Testing
    autoPlayTimer: 0
};

// Expose globally
window.getGameState = () => gameState;

// Logging system
window.logs = {
    game_info: [],
    player_info: [],
    inputs: []
};