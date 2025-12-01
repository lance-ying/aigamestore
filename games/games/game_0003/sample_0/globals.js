export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const gameState = {
    gamePhase: "START", // START, PLAYING, PAUSED, LEVEL_COMPLETE, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN",
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0,
    
    // Level State
    currentLevelIndex: 0,
    score: 0,
    totalCoinsInLevel: 0,
    
    // Entities
    player: null,
    platforms: [],
    hazards: [],
    collectibles: [],
    particles: [],
    exit: null,
    entities: [], // Combined list for general updates if needed
    
    // Camera
    cameraX: 0,
    cameraY: 0,
    worldWidth: 2000,
    worldHeight: 600,
    
    // Physics Constants
    gravity: 0.5,
    friction: 0.9,
    groundFriction: 0.92,
    airResistance: 0.98
};

export function getGameState() {
    return gameState;
}

window.getGameState = getGameState;

export function resetLevelState() {
    gameState.platforms = [];
    gameState.hazards = [];
    gameState.collectibles = [];
    gameState.particles = [];
    gameState.entities = [];
    gameState.exit = null;
    gameState.score = 0;
    gameState.totalCoinsInLevel = 0;
}