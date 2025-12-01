export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TILE_SIZE = 32;
export const GRAVITY = 0.5;
export const TERMINAL_VELOCITY = 12;

// World Dimensions in Tiles
export const WORLD_WIDTH_TILES = 60;
export const WORLD_HEIGHT_TILES = 40;

// Tile Types
export const TILE = {
    AIR: 0,
    DIRT: 1,
    STONE: 2,
    GOLD: 3,
    BEDROCK: 4
};

// Tools
export const TOOL = {
    PICKAXE: 'PICKAXE',
    SWORD: 'SWORD'
};

export const gameState = {
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN",
    
    // Time
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0,
    
    // World
    worldMap: [], // 2D array [x][y]
    worldWidth: WORLD_WIDTH_TILES * TILE_SIZE,
    worldHeight: WORLD_HEIGHT_TILES * TILE_SIZE,
    
    // Camera
    cameraX: 0,
    cameraY: 0,
    
    // Entities
    player: null,
    enemies: [],
    particles: [],
    items: [], // Dropped items
    
    // Game Logic
    goldCollected: 0,
    goldToWin: 10,
    
    // Input state helpers
    keys: {}
};

// Global accessor
window.getGameState = () => gameState;

export const resetGameState = () => {
    gameState.gamePhase = "START";
    gameState.frameCount = 0;
    gameState.goldCollected = 0;
    gameState.entities = [];
    gameState.enemies = [];
    gameState.particles = [];
    gameState.items = [];
    gameState.player = null;
    gameState.cameraX = 0;
    gameState.cameraY = 0;
};