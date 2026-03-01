/**
 * globals.js
 * Contains global constants, game state, and configuration.
 */

// Canvas Dimensions
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Game Configuration
export const TILE_SIZE = 30; // Size of a block face
export const ANIMATION_SPEED = 0.1; // Speed of lerping
export const GRAVITY = 0.5;

// Colors (Monument Valley Palette)
export const PALETTE = {
    background: [240, 240, 245],
    player: [255, 255, 255],
    player_shadow: [200, 200, 220],
    crow: [50, 50, 60],
    crow_beak: [255, 200, 0],
    goal: [255, 215, 0],
    blocks: {
        light: [255, 150, 150],
        medium: [220, 100, 100],
        dark: [180, 60, 60],
        walkable: [245, 245, 250],
        rotator: [100, 200, 255]
    },
    ui: {
        text: [80, 80, 90],
        overlay: [255, 255, 255, 200]
    }
};

// Global Game State
export const gameState = {
    // Phase
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE, TRANSITION
    controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2...
    
    // Time
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0,
    
    // World
    currentLevelIndex: 0,
    level: null, // The current Level object
    entities: [],
    particles: [],
    
    // Player
    player: null,
    
    // Input
    keys: {},
    lastKeyPressed: null,
    
    // Camera / View
    cameraOffset: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 },
    zoom: 1.0,
    
    // Logic
    isRotating: false, // Is the world currently animating a rotation?
    rotationProgress: 0,
    
    // Score/Progress
    score: 0,
    deaths: 0
};

// Expose gameState globally
export function getGameState() {
    return gameState;
}
window.getGameState = getGameState;

// Logging Utility
export function logGameInfo(p, data) {
    if (p.logs && p.logs.game_info) {
        p.logs.game_info.push({
            data: data,
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    }
}