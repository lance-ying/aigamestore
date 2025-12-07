/**
 * globals.js
 * Contains global constants, game state structure, and configuration.
 */

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// World and Tile configuration
export const TILE_SIZE = 40;
export const WORLD_COLS = 50; // 50 * 40 = 2000px wide
export const WORLD_ROWS = 30; // 30 * 40 = 1200px high
export const GRAVITY = 0.6;
export const TERMINAL_VELOCITY = 15;

// Colors
export const COLORS = {
    BACKGROUND: [20, 24, 35], // Dark moon sky
    TILE_DIRT: [120, 120, 130], // Moon dust
    TILE_STONE: [80, 80, 90], // Moon rock
    PLAYER: [200, 200, 255], // Astronaut suit
    PLAYER_VISOR: [255, 200, 50], // Gold visor
    ENEMY_SNAKE: [100, 255, 100],
    ENEMY_BAT: [180, 100, 255],
    GOLD: [255, 215, 0],
    GEM: [0, 255, 255],
    EXIT: [50, 100, 200],
    UI_TEXT: [255, 255, 255],
    UI_OVERLAY: [0, 0, 0, 150]
};

// Global Game State
// Initialized in game.js setup, updated every frame
export const gameState = {
    // System
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2
    frameCount: 0,
    deltaTime: 0,
    lastFrameTime: 0,
    
    // World
    worldWidth: WORLD_COLS * TILE_SIZE,
    worldHeight: WORLD_ROWS * TILE_SIZE,
    tiles: [], // 2D array of tile types: 0=empty, 1=dirt, 2=stone
    
    // Entities
    player: null,
    entities: [], // All active entities (enemies, items)
    particles: [], // Visual effects
    floatingTexts: [], // Damage numbers, score popups
    
    // Camera
    camera: {
        x: 0,
        y: 0,
        shakeStrength: 0,
        shakeDecay: 0.9
    },
    
    // Progression
    score: 0,
    level: 1,
    exitPortal: null, // Reference to exit entity
    
    // Input state snapshot for the current frame
    inputs: {
        left: false,
        right: false,
        up: false,
        down: false,
        jump: false,
        sprint: false,
        attack: false
    }
};

// Global accessor
export function getGameState() {
    return gameState;
}
window.getGameState = getGameState;

// Enum for tile types
export const TILE_TYPE = {
    EMPTY: 0,
    DIRT: 1,
    STONE: 2,
    PLATFORM: 3
};

// Utility to reset game state for a restart
export function resetGameState() {
    gameState.score = 0;
    gameState.level = 1;
    gameState.camera.x = 0;
    gameState.camera.y = 0;
    gameState.camera.shakeStrength = 0;
    gameState.entities = [];
    gameState.particles = [];
    gameState.floatingTexts = [];
    gameState.tiles = [];
}