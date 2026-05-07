/**
 * Global constants and state management for Doodle Hopper
 */

export const CANVAS_WIDTH = 400;
export const CANVAS_HEIGHT = 500;

// Physics constants
export const GRAVITY = 0.4;
export const JUMP_FORCE = -11;
export const SPRING_FORCE = -18;
export const MOVE_SPEED = 6;
export const FRICTION = 0.85; // Air resistance/friction for horizontal movement

// Game Settings
export const PLATFORM_WIDTH = 60;
export const PLATFORM_HEIGHT = 15;
export const GENERATION_THRESHOLD = 50; // Distance above screen to generate content

export const gameState = {
    // Game Status
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_LOSE
    controlMode: "HUMAN", // HUMAN
    
    // Score & Progression
    score: 0,
    highScore: 0,
    worldTheme: "GRASS", // GRASS, JUNGLE, SPACE
    
    // Entities
    player: null,
    platforms: [],
    enemies: [],
    projectiles: [],
    collectibles: [],
    particles: [],
    
    // Camera / World
    cameraY: 0,
    maxHeightReached: 0, // In world coordinates (negative Y)
    
    // Generation State
    lastGenerationY: 0, // Y position of last generated platform
    
    // Time
    frameCount: 0,
    deltaTime: 0,
    lastFrameTime: 0
};

// Initialize logs object (write-only)
export function initLogs() {
    return {
        "game_info": [],
        "inputs": [],
        "player_info": []
    };
}

// Global accessor
export function getGameState() {
    return gameState;
}
window.getGameState = getGameState;