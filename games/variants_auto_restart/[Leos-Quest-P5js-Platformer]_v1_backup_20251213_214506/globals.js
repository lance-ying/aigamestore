export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const gameState = {
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE, LEVEL_COMPLETE, GAME_OVER_FINAL
    controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2, etc.
    
    // Time
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0,
    transitionTimer: 0,
    
    // Level
    currentLevelIndex: 0,
    totalLevels: 6,
    
    // Entities
    player: null,
    platforms: [],
    coins: [],
    hazards: [],
    monsters: [],
    heartPickups: [],
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
    levelStartScore: 0, // Score at the beginning of the level (for restarts)
    coinsCollected: 0,
    totalCoinsInLevel: 0,
    
    // Health
    maxHearts: 3,
    currentHearts: 3,
    levelStartHearts: 3
};

export function getGameState() {
    return gameState;
}

// Attach to window for external access
window.getGameState = getGameState;

export function resetGameState() {
    // Default to PLAYING so next levels skip the title screen
    gameState.gamePhase = "PLAYING"; 
    gameState.frameCount = 0;
    
    // Do NOT reset score here (cumulative), but reset coins
    gameState.coinsCollected = 0;
    
    // We do NOT reset currentLevelIndex here to allow progression
    gameState.particles = [];
}