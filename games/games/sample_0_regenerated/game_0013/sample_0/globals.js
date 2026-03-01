import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;

// Game constants
export const WORLD_WIDTH = 20;
export const LEVEL_LENGTH = 500;
export const PLAYER_SPEED = 15.0; // Units per second
export const GRAVITY = -30.0;
export const JUMP_FORCE = 12.0;

// Shape shifting constraints
export const MIN_HEIGHT = 0.25;
export const MAX_HEIGHT = 3.5;
export const BASE_VOLUME = 1.0; // width * height (depth is fixed)
export const SHAPE_CHANGE_SPEED = 5.0;

// Global State
export const gameState = {
    // Phase
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2

    // Core Systems
    scene: null,
    camera: null,
    renderer: null,
    gameContainer: null,
    
    // Time
    frameCount: 0,
    deltaTime: 0,
    elapsedTime: 0,
    
    // Entities
    player: null,
    entities: [], // Generic container
    obstacles: [], // Specific for logic
    collectibles: [],
    particles: [],
    
    // Environment
    lights: [],
    floor: null,
    
    // Game Data
    score: 0,
    distance: 0,
    levelEndZ: LEVEL_LENGTH,
    
    // Input State (processed)
    input: {
        up: false,
        down: false,
        left: false,
        right: false,
        jump: false
    }
};

// Initialize logs
window.logs = {
    game_info: [],
    player_info: [],
    inputs: []
};

// Expose gameState globally
export function getGameState() {
    return gameState;
}
window.getGameState = getGameState;

export function logGameInfo(info) {
    window.logs.game_info.push({
        ...info,
        framecount: gameState.frameCount,
        timestamp: Date.now()
    });
}