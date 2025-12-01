export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const CELL_SIZE = 20;
export const FPS = 60;

// Game State Object
export const gameState = {
    gamePhase: "START",     // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN",   // HUMAN, TEST_1, TEST_2
    
    // Entities
    player: null,
    entities: [],
    walls: [],
    coins: [],
    enemies: [],
    particles: [],
    
    // Level State
    cameraY: 0,
    score: 0,
    tideY: 0,               // Y position of the rising death tide
    tideSpeed: 0.5,
    generatedMaxY: 0,       // Track how far up we've generated
    
    // Performance
    frameCount: 0,
    deltaTime: 0,
    lastFrameTime: 0,
    
    // Debug/Logging
    debugMode: false
};

// Global accessor
window.getGameState = function() {
    return gameState;
};