/**
 * Global constants and game state management.
 */

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const WORLD_HEIGHT = 2400; // 6 screens tall
export const TARGET_FPS = 60;

// Physics Constants
export const GRAVITY = 0.6;
export const MAX_FALL_SPEED = 15;
export const FRICTION = 0.8; // Ground friction
export const AIR_RESISTANCE = 0.99; // Minimal air drag
export const BOUNCE_FACTOR = -0.5; // Wall bounce restitution

// Game State Object
export const gameState = {
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN",
    
    // Entities
    player: null,
    platforms: [],
    decorations: [],
    particles: [],
    
    // Camera
    cameraY: 0,
    
    // Game Data
    score: 0, // Height reached
    maxHeight: 0,
    startTime: 0,
    
    // Performance
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0
};

// Global logger access
export function getGameState() {
    return gameState;
}
window.getGameState = getGameState;