// globals.js
// Global state and constants

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GRAVITY = 0.5;
export const FRICTION = 0.92;
export const GROUND_FRICTION = 0.96;
export const AIR_RESISTANCE = 0.99;

// Game State
export const gameState = {
    player: null,
    entities: [],
    platforms: [],
    hazards: [],
    collectibles: [],
    particles: [],
    
    // Camera
    cameraX: 0,
    cameraY: 0,
    
    // Status
    score: 0,
    totalCoins: 0,
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN",
    
    // Time
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0,
    
    // World bounds
    worldWidth: 4000,
    worldHeight: 800
};

// Expose getGameState globally
export function getGameState() {
    return gameState;
}
window.getGameState = getGameState;

// Reset game state helper
export function resetGameState() {
    gameState.player = null;
    gameState.entities = [];
    gameState.platforms = [];
    gameState.hazards = [];
    gameState.collectibles = [];
    gameState.particles = [];
    gameState.cameraX = 0;
    gameState.cameraY = 0;
    gameState.score = 0;
    gameState.totalCoins = 0;
    gameState.frameCount = 0;
    // Note: gamePhase and controlMode are usually managed by the game loop
}