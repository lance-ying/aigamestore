export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const gameState = {
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE, LEVEL_COMPLETE
    controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2, etc.
    
    // Time
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0,
    
    // Level
    currentLevelIndex: 0,
    totalLevels: 3,
    
    // Entities
    player: null,
    platforms: [],
    coins: [],
    hazards: [],
    exit: null,
    particles: [],
    
    // Camera
    cameraX: 0,
    cameraY: 0,
    worldWidth: 2000,
    worldHeight: 600,
    
    // Physics Config
    gravity: 0.5,
    friction: 0.92,
    groundFriction: 0.9,
    airResistance: 0.98,
    
    // Player Stats
    score: 0,
    coinsCollected: 0,
    totalCoinsInLevel: 0
};

export function getGameState() {
    return gameState;
}

// Attach to window for external access
window.getGameState = getGameState;

export function resetGameState() {
    gameState.gamePhase = "START";
    gameState.frameCount = 0;
    gameState.score = 0;
    gameState.currentLevelIndex = 0;
    gameState.particles = [];
}