/**
 * globals.js
 * Definitions for global game state, constants, and logging configuration.
 */

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const CONSTANTS = {
    GRAVITY: 0.6,
    BOUNCE_FORCE: 12,
    FORWARD_SPEED_INITIAL: 4,
    FORWARD_SPEED_MAX: 12,
    LATERAL_ACCEL: 0.8,
    LATERAL_FRICTION: 0.85,
    MAX_LATERAL_SPEED: 10,
    TILE_WIDTH: 80,
    TILE_HEIGHT: 60,
    TILE_SPACING_Y: 180,
    CAMERA_OFFSET_Y: 300,
    LANE_WIDTH: 500, // Total width of the play area
    Z_KILL_THRESHOLD: -100 // How far below 0 before death triggers
};

export const COLORS = {
    BACKGROUND: '#121212',
    TILE_BASE: '#2c3e50',
    TILE_ACTIVE: '#3498db',
    TILE_TARGET: '#e74c3c',
    BALL: '#ecf0f1',
    BALL_SHADOW: 'rgba(0, 0, 0, 0.4)',
    PARTICLE_LAND: '#3498db',
    PARTICLE_COLLECT: '#f1c40f',
    TEXT_MAIN: '#ffffff',
    TEXT_ACCENT: '#e67e22',
    UI_OVERLAY: 'rgba(0, 0, 0, 0.7)'
};

// Global Game State Object
export const gameState = {
    // Phase
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    
    // Core Entities
    player: null,
    world: null, // Manages tiles
    camera: { x: 0, y: 0 },
    
    // Arrays for entity management
    entities: [], // Generic list
    particles: [],
    collectibles: [],
    
    // Stats
    score: 0,
    distance: 0,
    tilesHopped: 0,
    combo: 1,
    difficultyMultiplier: 1.0,
    
    // Physics State
    currentSpeed: CONSTANTS.FORWARD_SPEED_INITIAL,
    
    // Inputs
    keys: {},
    controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2
    
    // Time
    frameCount: 0,
    deltaTime: 0,
    lastFrameTime: 0
};

// Expose gameState to window
export function getGameState() {
    return gameState;
}
window.getGameState = getGameState;

// Logger initialization
export function initLogs(p) {
    p.logs = {
        "game_info": [],
        "inputs": [],
        "player_info": []
    };
}

// Logger helper
export function logGameInfo(p, data) {
    p.logs.game_info.push({
        data: data,
        framecount: p.frameCount,
        timestamp: Date.now()
    });
}