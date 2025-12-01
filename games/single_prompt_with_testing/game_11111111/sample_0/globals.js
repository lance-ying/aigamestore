/**
 * Global constants and state management
 */

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GRAVITY = 0.4;
export const TERMINAL_VELOCITY = 12;
export const JUMP_FORCE = -10;
export const SUPER_JUMP_FORCE = -20;
export const PLAYER_SPEED = 6;

// Game State Object
export const gameState = {
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN",
    
    // Entities
    player: null,
    platforms: [],
    enemies: [],
    projectiles: [],
    particles: [],
    collectibles: [],
    
    // World State
    score: 0,
    highScore: 0,
    cameraOffset: 0,
    worldTheme: "GRASS", // GRASS, SPACE, RAIN
    difficultyMultiplier: 1,
    
    // Performance
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0,
    
    // Input state wrapper for logic access
    keys: {}
};

// Global access function
export function getGameState() {
    return gameState;
}

// Expose to window for external access/testing
window.getGameState = getGameState;

// Color Palettes
export const THEMES = {
    GRASS: {
        bg: [230, 255, 230],
        platform: [100, 200, 100],
        accent: [50, 150, 50]
    },
    SPACE: {
        bg: [20, 20, 40],
        platform: [200, 100, 255],
        accent: [150, 50, 200]
    },
    RAIN: {
        bg: [50, 60, 80],
        platform: [100, 150, 200],
        accent: [80, 120, 180]
    }
};