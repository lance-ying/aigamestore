/**
 * Global Constants and Game State Configuration
 * Contains all shared variables, configuration constants, and the main state object.
 */

// Canvas Dimensions
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Physics Constants
export const GRAVITY = 0.5;
export const FRICTION = 0.85;
export const GROUND_FRICTION = 0.8;
export const AIR_RESISTANCE = 0.98;
export const TERMINAL_VELOCITY = 12;
export const JUMP_FORCE = -10;
export const MOVE_SPEED = 0.5;
export const MAX_SPEED = 4;
export const REGROUP_FORCE = 0.2;

// Entity Configuration
export const PICO_WIDTH = 24;
export const PICO_HEIGHT = 24;
export const BLOCK_SIZE = 40;
export const KEY_SIZE = 20;
export const DOOR_WIDTH = 60;
export const DOOR_HEIGHT = 80;

// Colors
export const COLORS = {
    BACKGROUND: [30, 30, 40],
    WALL: [100, 100, 110],
    GROUND: [80, 80, 90],
    DOOR_LOCKED: [200, 50, 50],
    DOOR_UNLOCKED: [50, 200, 50],
    KEY: [255, 215, 0],
    TEXT: [255, 255, 255],
    PICO_1: [255, 80, 80],   // Red
    PICO_2: [80, 255, 80],   // Green
    PICO_3: [80, 80, 255],   // Blue
    PARTICLE_DUST: [200, 200, 200, 150],
    PARTICLE_SPARKLE: [255, 255, 100, 200]
};

/**
 * Main Game State Object
 * Exposed globally via window.getGameState()
 */
export const gameState = {
    // System State
    gamePhase: "START", // START, PLAYING, PAUSED, LEVEL_COMPLETE, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2
    frameCount: 0,
    deltaTime: 0,
    lastFrameTime: 0,
    
    // Level State
    currentLevelIndex: 0,
    hasKey: false,
    score: 0,
    levelTime: 0,
    
    // Entities
    picos: [],          // The player characters
    walls: [],          // Static geometry
    blocks: [],         // Pushable objects
    collectibles: [],   // Keys, coins
    door: null,         // Exit door
    particles: [],      // Visual effects
    
    // Camera
    camera: {
        x: 0,
        y: 0,
        zoom: 1,
        targetX: 0,
        targetY: 0
    },
    
    // Debug
    debugMode: false
};

/**
 * Expose Game State to Window for external access (Instructions requirement)
 */
export function getGameState() {
    return gameState;
}
window.getGameState = getGameState;

/**
 * Reset Level State
 * Clears entities for a fresh level load
 */
export function resetLevelState() {
    gameState.picos = [];
    gameState.walls = [];
    gameState.blocks = [];
    gameState.collectibles = [];
    gameState.door = null;
    gameState.particles = [];
    gameState.hasKey = false;
    gameState.levelTime = 0;
    
    // Reset camera
    gameState.camera.x = 0;
    gameState.camera.y = 0;
}

/**
 * Reset Full Game State
 * Resets progress to level 1
 */
export function resetFullGame() {
    resetLevelState();
    gameState.currentLevelIndex = 0;
    gameState.score = 0;
    gameState.gamePhase = "START";
}