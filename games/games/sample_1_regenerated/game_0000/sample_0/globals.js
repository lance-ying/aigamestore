// globals.js - Constants, Game State, and Configuration

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TILE_SIZE = 40;
export const GRAVITY = 0.6;
export const TERMINAL_VELOCITY = 12;
export const FRICTION = 0.85;
export const AIR_RESISTANCE = 0.95;

// Entity Types
export const ENTITY_TYPES = {
    PLAYER: 'player',
    ENEMY: 'enemy',
    COLLECTIBLE: 'collectible',
    PROJECTILE: 'projectile',
    PARTICLE: 'particle',
    BLOCK: 'block'
};

// Enemy Types
export const ENEMY_TYPES = {
    SNAIL: 'snail',
    BEE: 'bee'
};

// Game State Object
export const gameState = {
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2
    
    // Time tracking
    frameCount: 0,
    deltaTime: 0,
    lastFrameTime: 0,
    
    // World State
    levelWidth: 0,
    levelHeight: 0,
    cameraX: 0,
    cameraY: 0,
    
    // Entities
    player: null,
    entities: [], // All dynamic entities (enemies, items, projectiles)
    particles: [], // Visual effects
    
    // Level Data
    tiles: [], // 2D array of tile objects
    collidables: [], // Array of rects for physics collision
    
    // Score & Status
    score: 0,
    lives: 3,
    
    // Inputs (updated by input.js)
    keys: {}
};

// Expose gameState globally
window.getGameState = () => gameState;

// Reset function to clear state for restart
export function resetGameState() {
    gameState.score = 0;
    gameState.lives = 3;
    gameState.entities = [];
    gameState.particles = [];
    gameState.tiles = [];
    gameState.collidables = [];
    gameState.cameraX = 0;
    gameState.cameraY = 0;
    gameState.frameCount = 0;
    // player is re-initialized in game setup
}

// Logging structure helper
export function initLogs(p) {
    p.logs = {
        "game_info": [],
        "inputs": [],
        "player_info": []
    };
}