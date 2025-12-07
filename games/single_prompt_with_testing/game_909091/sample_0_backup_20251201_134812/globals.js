// Global configuration and state management

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const WORLD_GRAVITY = 0.6;
export const TILE_SIZE = 40;

// Colors
export const COLORS = {
    SKY_TOP: '#87CEEB',
    SKY_BOTTOM: '#E0F7FA',
    GROUND_TOP: '#4CAF50',
    GROUND_BODY: '#795548',
    BRICK: '#D84315',
    LUCKY_BLOCK: '#FFD700',
    PLAYER_BODY: '#2E7D32',
    PLAYER_HAT: '#1B5E20',
    COIN: '#FFD700',
    CLOVER: '#00C853',
    ENEMY_SNAIL: '#FF5722',
    ENEMY_BEE: '#FFEB3B',
    POT_OF_GOLD: '#000000'
};

// Global Game State
export const gameState = {
    player: null,
    entities: [],       // All dynamic entities (enemies, projectiles, etc.)
    tiles: [],          // Static level tiles
    particles: [],      // Visual effects
    collectibles: [],   // Coins, clovers
    
    score: 0,
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2
    
    // Camera
    cameraX: 0,
    cameraY: 0,
    worldWidth: 0,
    worldHeight: 0,
    
    // Time
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0,
    
    // Input helpers
    keys: {}
};

// Expose gameState globally
export function getGameState() {
    return gameState;
}
window.getGameState = getGameState;

// Reset function for game restart
export function resetGameState() {
    gameState.player = null;
    gameState.entities = [];
    gameState.tiles = [];
    gameState.particles = [];
    gameState.collectibles = [];
    gameState.score = 0;
    gameState.cameraX = 0;
    gameState.frameCount = 0;
}