// Game Constants
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TILE_SIZE = 40;
export const GRAVITY = 0.6;
export const TERMINAL_VELOCITY = 12;

// Asset Colors
export const COLORS = {
    SKY: [100, 180, 255],
    GROUND: [100, 60, 20],
    GRASS: [50, 200, 50],
    LEP_SKIN: [255, 200, 180],
    LEP_SUIT: [0, 150, 50],
    LEP_HAT: [0, 100, 30],
    GOLD: [255, 215, 0],
    BRICK: [180, 80, 40],
    QUESTION_BLOCK: [255, 200, 0]
};

// Global Game State
export const gameState = {
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2
    
    // Time
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0,
    
    // World
    levelWidth: 0,
    levelHeight: 0,
    tiles: [], // 2D array of tile types
    
    // Entities
    player: null,
    entities: [], // Generic list for updates
    enemies: [],
    collectibles: [],
    projectiles: [],
    particles: [],
    
    // Camera
    cameraX: 0,
    cameraY: 0,
    
    // Progression
    score: 0,
    levelLength: 100 // in tiles
};

export function getGameState() {
    return gameState;
}

// Expose globally
window.getGameState = getGameState;