/**
 * globals.js
 * Contains global constants, initial game state structure, and logger setup.
 */

// Canvas Dimensions
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// World Settings
export const TILE_SIZE = 40;
export const GRAVITY = 0.6;
export const MAX_FALL_SPEED = 12;
export const RUN_SPEED = 5;
export const JUMP_FORCE = -11;
export const WALL_SLIDE_SPEED = 2;
export const WALL_JUMP_FORCE_X = 6;
export const WALL_JUMP_FORCE_Y = -12;
export const FRICTION = 0.8;
export const AIR_RESISTANCE = 0.98;

// Colors
export const COLORS = {
    SKY: [100, 149, 237],
    GROUND: [139, 69, 19],
    GRASS: [34, 139, 34],
    BLOCK: [205, 133, 63],
    BLOCK_BORDER: [101, 67, 33],
    PIPE: [0, 180, 0],
    PIPE_DARK: [0, 100, 0],
    MARIO_SHIRT: [255, 0, 0],
    MARIO_OVERALLS: [0, 0, 255],
    GOOMBA: [165, 42, 42],
    COIN: [255, 215, 0],
    TEXT: [255, 255, 255]
};

// Initial Game State
export const gameState = {
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN",
    
    // Time tracking
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0,
    startTime: 0,
    
    // Camera
    cameraX: 0,
    cameraY: 0,
    
    // Logic
    score: 0,
    coins: 0,
    distance: 0,
    levelLength: 15000, // Pixels
    
    // Entities
    player: null,
    entities: [],     // Dynamic entities (Enemies, Particles, etc.)
    tiles: [],        // Static level geometry (grid based for performance)
    collisions: [],   // Debug info
    
    // Inputs
    keys: {
        up: false,
        down: false,
        left: false,
        right: false,
        space: false,
        shift: false,
        z: false,
        enter: false,
        esc: false,
        r: false
    }
};

// Expose gameState globally
window.getGameState = () => gameState;