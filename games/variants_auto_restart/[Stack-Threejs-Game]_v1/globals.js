import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

// Game Constants
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const BLOCK_HEIGHT = 1;
export const ORIGINAL_BOX_SIZE = 5;
export const MOVE_SPEED_INITIAL = 0.15;
export const MOVE_SPEED_INCREMENT = 0.005;
export const MAX_MISSES = 3; // New constant for allowed misses

// Global Game State
export const gameState = {
    // Phase
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN", // Only human mode remains
    
    // Core Three.js components
    scene: null,
    camera: null,
    renderer: null,
    gameContainer: null,
    
    // Lighting
    lights: [],
    
    // Game Objects
    stack: [], // Array of placed blocks
    activeBlock: null, // The currently moving block
    debris: [], // Array of falling debris chunks
    
    // Game Status
    score: 0,
    missCount: 0, // Track number of misses
    cameraTargetHeight: 0,
    blockSpeed: MOVE_SPEED_INITIAL,
    currentHue: 0, // For rainbow effect
    
    // Physics/Timing
    frameCount: 0,
    deltaTime: 0,
    lastTime: 0,

    // Auto-restart
    autoRestartTimeoutId: null,
    autoRestartScheduled: false,
};