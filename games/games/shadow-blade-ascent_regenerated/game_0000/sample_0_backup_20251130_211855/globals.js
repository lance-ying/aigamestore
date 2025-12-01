export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const KEYS = {
    ENTER: 13,
    ESC: 27,
    SPACE: 32,
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    SHIFT: 16,
    Z: 90,
    R: 82
};

export const gameState = {
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE, LEVEL_TRANSITION
    controlMode: "HUMAN",
    
    // Time
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0,
    
    // Physics
    gravity: 0.8,
    friction: 0.8,
    
    // Camera
    cameraX: 0,
    cameraY: 0,
    
    // Entities
    player: null,
    entities: [],     // All updates/renders go here
    platforms: [],    // Collision checks
    enemies: [],      // Target checks
    projectiles: [],
    particles: [],
    collectibles: [],
    
    // Level
    currentLevel: 1,
    maxLevels: 6,
    levelWidth: 2000,
    levelHeight: 600,
    
    // Game Data
    score: 0,
    highScores: [],
    
    // Visuals
    screenShake: 0
};

export function getGameState() {
    return gameState;
}

// Expose globally
window.getGameState = getGameState;