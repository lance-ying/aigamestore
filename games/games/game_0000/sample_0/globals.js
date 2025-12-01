export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const gameState = {
    player: null,
    entities: [],
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE, LEVEL_TRANSITION
    controlMode: "HUMAN",
    
    // Physics Constants
    gravity: 0.6,
    friction: 0.96, // Rolling friction
    airResistance: 0.99,
    
    // Level State
    currentLevelIndex: 0,
    score: 0,
    
    // Collections
    platforms: [],
    collectibles: [],
    hazards: [],
    particles: [],
    exits: [],
    
    // Camera
    cameraX: 0,
    cameraY: 0,
    cameraTarget: null,
    
    // Time
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0,
    
    // Input state (for mouse primarily, but we use keys)
    mouseX: 0,
    mouseY: 0
};

export function getGameState() {
    return gameState;
}

// Expose globally
window.getGameState = getGameState;