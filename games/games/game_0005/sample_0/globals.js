// globals.js
// Constants and Game State Management

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const WORLD_WIDTH = 3000;
export const WORLD_HEIGHT = 600;

export const gameState = {
    player: null,
    entities: [],
    platforms: [],
    hazards: [],
    collectibles: [],
    particles: [],
    exitDoor: null,
    
    // Camera
    cameraX: 0,
    cameraY: 0,
    
    // Game Status
    score: 0,
    totalCoins: 0,
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2, TEST_3
    
    // Physics Constants (Default)
    gravity: 0.5,
    friction: 0.92,
    
    // Time
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0
};

export function getGameState() {
    return gameState;
}

// Expose globally
window.getGameState = getGameState;