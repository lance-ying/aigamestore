// global constants and state management

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;

// Game Balance Constants
export const INITIAL_BLOCK_WIDTH = 200;
export const INITIAL_BLOCK_HEIGHT = 30;
export const INITIAL_SPEED = 4;
export const SPEED_INCREMENT = 0.1;
export const MAX_SPEED = 15;
export const WIN_SCORE = 50; // Reaching this height is a "Win"

// Colors (Neon Palette)
export const COLORS = {
    BACKGROUND: [10, 10, 25],
    TEXT: [255, 255, 255],
    ACCENT: [0, 255, 255], // Cyan
    DEBRIS: [255, 50, 50],
    HUD_BG: [0, 0, 0, 150]
};

// Global Game State
export const gameState = {
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN",
    
    // Score & Progression
    score: 0,
    highScore: 0,
    level: 1,
    
    // Entities
    stack: [],        // Array of static placed blocks
    activeBlock: null,// The currently moving block
    debris: [],       // Array of falling cut-off pieces
    backgroundParticles: [],
    
    // Physics & Camera
    gravity: 0.6,
    cameraY: 0,
    targetCameraY: 0,
    cameraShake: 0,
    
    // Performance
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0
};

// Expose gameState globally as required
export function getGameState() {
    return gameState;
}
window.getGameState = getGameState;

// Color generator based on stack height
export function getBlockColor(index, p) {
    // Cycle through hue
    p.colorMode(p.HSB, 360, 100, 100);
    const hue = (index * 10) % 360;
    const c = p.color(hue, 80, 90);
    p.colorMode(p.RGB, 255); // Revert to RGB
    return c;
}

// Reset Game State
export function resetGame() {
    gameState.score = 0;
    gameState.level = 1;
    gameState.stack = [];
    gameState.activeBlock = null;
    gameState.debris = [];
    gameState.cameraY = 0;
    gameState.targetCameraY = 0;
    gameState.cameraShake = 0;
    
    // We do not reset controlMode or gamePhase here, handled by caller
}