export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
    START: "START",
    PLAYING: "PLAYING",
    PAUSED: "PAUSED",
    GAME_OVER_WIN: "GAME_OVER_WIN",
    GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const CONTROL_MODES = {
    HUMAN: "HUMAN",
    TEST_1: "TEST_1", // Movement test
    TEST_2: "TEST_2", // Win test
    TEST_3: "TEST_3"  // Lose test
};

export const gameState = {
    gamePhase: GAME_PHASES.START,
    controlMode: CONTROL_MODES.HUMAN,
    player: null,
    entities: [],
    platforms: [],
    hazards: [],
    collectibles: [],
    particles: [],
    goal: null,
    
    // Physics & World
    gravity: 0.6,
    cameraX: 0,
    cameraY: 0,
    worldWidth: 4000,
    worldHeight: 800,
    
    // Stats
    score: 0,
    totalCoins: 0,
    collectedCoins: 0,
    startTime: 0,
    elapsedTime: 0,
    
    // Frame
    frameCount: 0,
    deltaTime: 0,
    lastFrameTime: 0,
    
    debug: false
};

// Global log structure maintained across restarts
export const logs = {
    game_info: [],
    inputs: [],
    player_info: []
};

// Helper to access global state
export function getGameState() {
    return gameState;
}

// Reset function for game restart
export function resetGameState() {
    gameState.player = null;
    gameState.entities = [];
    gameState.platforms = [];
    gameState.hazards = [];
    gameState.collectibles = [];
    gameState.particles = [];
    gameState.goal = null;
    
    gameState.score = 0;
    gameState.collectedCoins = 0;
    gameState.cameraX = 0;
    gameState.cameraY = 0;
    gameState.startTime = Date.now();
    
    // Don't reset gamePhase or controlMode here fully, 
    // usually handled by the restart logic in game.js
}