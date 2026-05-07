/**
 * Global constants and state management for ZigZag Infinity.
 */

// Canvas Dimensions
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Game World Configuration
export const BLOCK_SIZE = 25; // Size of the cubes side
export const BALL_RADIUS = 10;
export const CAMERA_SMOOTHING = 0.1;
export const INITIAL_SPEED = 3.0;
export const SPEED_INCREMENT = 0.001; // Speed increases slightly over time
export const GRAVITY = 0.8;
export const FALL_THRESHOLD = -200; // Y position to trigger death

// Isometric Projection Constants
// We use a standard 2:1 isometric ratio
// x_screen = (x_world - z_world) * cos(30)
// y_screen = (x_world + z_world) * sin(30) - y_world
// But simpler integer math often uses: x = (x-y), y = (x+y)/2.
// Let's stick to trig for smooth movement.
export const ISO_ANGLE = 0.523599; // 30 degrees in radians
export const COS_30 = Math.cos(ISO_ANGLE);
export const SIN_30 = Math.sin(ISO_ANGLE);

// Colors (Palette)
export const COLORS = {
    BACKGROUND_TOP: [50, 50, 70],
    BACKGROUND_BOTTOM: [20, 20, 30],
    BLOCK_TOP: [220, 220, 220],
    BLOCK_LEFT: [180, 180, 180],
    BLOCK_RIGHT: [140, 140, 140],
    BALL: [40, 180, 255],
    BALL_SHADOW: [0, 0, 0, 100],
    DIAMOND: [255, 105, 180],
    TEXT: [255, 255, 255],
    ACCENT: [255, 200, 50]
};

// Global Game State
export const gameState = {
    // Phase Management
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_LOSE
    controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2

    // Entities
    player: null,
    blocks: new Map(), // Use Map for O(1) lookup by "x,z" key
    fallingBlocks: [], // Blocks that are currently animating falling away
    collectibles: [],
    particles: [],

    // Camera
    camera: {
        x: 0,
        y: 0,
        zoom: 1.0,
        shake: 0
    },

    // Scoring & Progression
    score: 0,
    highScore: 0,
    speed: INITIAL_SPEED,
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0,
    
    // Performance / Debug
    debugMode: false
};

// Expose gameState globally
export function getGameState() {
    return gameState;
}
window.getGameState = getGameState;

// Reset Game State for new session
export function resetGameState() {
    gameState.gamePhase = "START";
    gameState.score = 0;
    gameState.speed = INITIAL_SPEED;
    gameState.blocks.clear();
    gameState.fallingBlocks = [];
    gameState.collectibles = [];
    gameState.particles = [];
    gameState.camera.x = 0;
    gameState.camera.y = 0;
    gameState.camera.shake = 0;
}