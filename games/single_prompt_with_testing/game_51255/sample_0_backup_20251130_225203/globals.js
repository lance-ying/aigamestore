export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;

// Physics Constants
export const GRAVITY = 0.6;
export const JUMP_FORCE = -9;
export const FRICTION = 0.99; // Air resistance
export const RESTITUTION = 0.7; // Bounciness
export const MAX_FALL_SPEED = 15;

// Game Constants
export const HOOP_SPEED = 3;
export const HOOP_SPAWN_INTERVAL = 140; // Frames
export const HOOP_GAP_HEIGHT = 100; // Vertical variation

export const gameState = {
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN",
    
    // Entities
    player: null,
    hoops: [],
    particles: [],
    
    // State
    score: 0,
    highScore: 0,
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0,
    
    // Tracking
    hoopsPassed: 0,
    perfectShots: 0,
    
    // Camera effect (screen shake)
    shakeIntensity: 0,
    shakeTimer: 0
};

export function getGameState() {
    return gameState;
}

// Global accessor
window.getGameState = getGameState;