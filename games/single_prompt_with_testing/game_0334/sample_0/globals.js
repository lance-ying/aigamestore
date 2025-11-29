// globals.js
// Constants and shared state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// World Dimensions
export const WORLD_WIDTH = 1200;
export const WORLD_HEIGHT = 1200;

// Colors
export const COLORS = {
    BACKGROUND: [26, 26, 45],    // Dark Blue-Grey
    PLAYER: [60, 180, 200],      // Cyan
    PLAYER_CAPE: [200, 60, 100], // Magenta
    ENEMY_MELEE: [220, 50, 50],  // Red
    ENEMY_RANGED: [220, 150, 50],// Orange
    WALL: [40, 40, 60],          // Darker Structure
    FLOOR: [30, 30, 50],         // Slightly lighter than BG
    MODULE: [255, 0, 255],       // Bright Magenta
    MEDKIT: [0, 255, 100],       // Green
    PROJECTILE: [255, 100, 100], // Red-Orange
    SWORD_ARC: [100, 255, 255],  // Cyan-White
    UI_TEXT: [255, 255, 255],
    GLITCH: [255, 255, 255, 50]
};

// Global Game State
export const gameState = {
    gamePhase: "START",     // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN",   // HUMAN, TEST_1, TEST_2, etc.
    
    // Time
    frameCount: 0,
    deltaTime: 0,
    lastFrameTime: 0,

    // Entities
    player: null,
    enemies: [],
    walls: [],
    collectibles: [],
    projectiles: [],
    particles: [],
    
    // Camera
    cameraX: 0,
    cameraY: 0,
    cameraShake: 0,

    // Logic
    gravity: 0,             // Top down, no gravity
    friction: 0.85,
    
    // Input state snapshot (for automated testing logging)
    currentInput: {}
};

// Logging function helper
export function logGameInfo(p, data) {
    if (!p.logs) return;
    p.logs.game_info.push({
        data: data,
        framecount: p.frameCount,
        timestamp: Date.now()
    });
}

export function getGameState() {
    return gameState;
}

window.getGameState = getGameState;