/**
 * Global constants and state management for Well of Echoes.
 * 
 * This file contains the central source of truth for the game state,
 * configuration constants, and the logging system required for debugging.
 */

// Canvas Dimensions
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// World Configuration
export const TILE_SIZE = 20;
export const ROWS = 20; // 400 / 20
export const COLS = 30; // 600 / 20
export const GRAVITY = 0.4;
export const TERMINAL_VELOCITY = 10;
export const FRICTION = 0.85;
export const AIR_RESISTANCE = 0.98;

// Colors
export const COLORS = {
    BACKGROUND: [15, 15, 20],
    WALL: [40, 40, 50],
    WALL_HIGHLIGHT: [60, 60, 75],
    PLAYER: [200, 240, 255],
    PLAYER_OUTLINE: [150, 200, 255],
    WATER: [0, 100, 200, 150],
    WATER_SURFACE: [100, 200, 255, 200],
    SPIKE: [200, 50, 50],
    LADDER: [100, 80, 60],
    SWITCH_ON: [50, 255, 50],
    SWITCH_OFF: [200, 50, 50],
    DOOR_CLOSED: [150, 50, 50],
    DOOR_OPEN: [50, 150, 50, 50],
    GHOST: [255, 100, 255],
    ITEM_BUBBLE: [100, 200, 255],
    ITEM_DISC: [255, 200, 50],
    PARTICLE_GLOW: [255, 255, 200],
    TEXT: [230, 230, 230]
};

// Game State Object
// This tracks every changing aspect of the game
export const gameState = {
    // Phase Management
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2, etc.
    
    // Time
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0,
    
    // World State
    currentRoomX: 0,
    currentRoomY: 0,
    world: null, // Initialized in setup
    
    // Entities
    player: null,
    entities: [], // Enemies, items, projectiles
    particles: [],
    
    // Camera / Shake
    shakeAmount: 0,
    
    // Meta
    collectedItems: [], // Strings: "BUBBLE_WAND", "DISC"
    equippedItemIndex: 0,
    switchesState: {}, // key: switchId, value: boolean
    
    // Stats
    score: 0,
    deaths: 0,
    
    // Debug flags
    debugMode: false
};

// Global accessor for testing
export function getGameState() {
    return gameState;
}

// Expose globally
if (typeof window !== 'undefined') {
    window.getGameState = getGameState;
}