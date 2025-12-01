export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const gameState = {
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE, LEVEL_COMPLETE
    controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2, etc.
    
    // Time
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0,
    
    // Level management
    currentLevelIndex: 0,
    maxLevels: 3,
    
    // Entities
    player: null,
    platforms: [],
    hazards: [],
    coins: [],
    switches: [],
    doors: [],
    particles: [],
    
    // Camera
    cameraX: 0,
    cameraY: 0,
    worldWidth: 2000,
    worldHeight: 1000,
    
    // Physics constants
    gravity: 0.5,
    friction: 0.95,
    
    // Score
    score: 0,
    coinsCollectedInLevel: 0,
    totalCoinsInLevel: 0
};

export function getGameState() {
    return gameState;
}

// Expose globally
window.getGameState = getGameState;

export function resetLevelState() {
    gameState.platforms = [];
    gameState.hazards = [];
    gameState.coins = [];
    gameState.switches = [];
    gameState.doors = [];
    gameState.particles = [];
    gameState.player = null;
    gameState.coinsCollectedInLevel = 0;
    gameState.totalCoinsInLevel = 0;
}