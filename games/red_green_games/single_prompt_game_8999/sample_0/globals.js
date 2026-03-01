/**
 * globals.js
 * Contains global constants, game state definition, and logging initialization.
 */

// Canvas Dimensions
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// World & Tile Constants
export const TILE_SIZE = 30; // Size of each block in pixels
export const CHUNK_SIZE = 16; // Number of blocks per chunk (simplified for this implementation)
export const WORLD_WIDTH = 100; // Width in tiles
export const WORLD_HEIGHT = 60; // Height in tiles

// Physics Constants
export const GRAVITY = 0.6;
export const TERMINAL_VELOCITY = 15;
export const FRICTION = 0.8;
export const PLAYER_SPEED = 4;
export const JUMP_FORCE = -10;

// Block IDs / Types
export const BLOCK = {
    AIR: 0,
    DIRT: 1,
    GRASS: 2,
    STONE: 3,
    WOOD: 4,
    LEAVES: 5,
    BEDROCK: 6,
    CORE: 99 // Win condition block
};

// Item Types
export const ITEM_TYPE = {
    BLOCK: 'block',
    TOOL: 'tool',
    WEAPON: 'weapon'
};

// Global Game State
export const gameState = {
    // Core state
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN",
    
    // Entities
    player: null,
    entities: [], // Enemies, drops, etc.
    particles: [], // Visual effects
    
    // World Data
    worldTiles: [], // 2D array [x][y]
    worldWidth: WORLD_WIDTH,
    worldHeight: WORLD_HEIGHT,
    
    // Camera
    cameraX: 0,
    cameraY: 0,
    
    // Time
    frameCount: 0,
    timeOfDay: 0, // 0 to 1 (0 = dawn, 0.5 = dusk)
    dayNightLength: 3600, // Frames for a full cycle
    
    // Debug/Perf
    debugMode: false,
    lastFrameTime: 0,
    deltaTime: 0
};

/**
 * Exposes gameState globally for debugging and hard constraints.
 */
export function getGameState() {
    return gameState;
}

// Bind to window as per instructions
window.getGameState = getGameState;

/**
 * Resets the game state for a new game.
 */
export function resetGameState() {
    gameState.gamePhase = "START";
    gameState.entities = [];
    gameState.particles = [];
    gameState.cameraX = 0;
    gameState.cameraY = 0;
    gameState.frameCount = 0;
    gameState.timeOfDay = 0;
    // Note: world and player are re-initialized in game.js setup/reset logic
}