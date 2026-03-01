/**
 * globals.js
 * Contains global constants, state management, and configuration.
 */

// Canvas Dimensions
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Game Configuration
export const CONFIG = {
    FPS: 60,
    GRID_SIZE: 25, // Radius of hex
    GRID_COLS: 12,
    GRID_ROWS: 9,
    PLAYER_MAX_HP: 5,
    PLAYER_START_HP: 3,
    TURN_DELAY: 200, // ms between actions
    ANIMATION_SPEED: 0.15, // Lerp speed
};

// Global Game State
// Initialized in game.js setup
export const gameState = {
    // Core state
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2
    
    // Time tracking
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0,
    
    // Game World
    level: 1,
    score: 0,
    grid: null, // Holds HexGrid instance
    entities: [], // All active entities
    player: null,
    enemies: [],
    particles: [],
    
    // Turn Management
    turnPhase: "PLAYER_INPUT", // PLAYER_INPUT, PLAYER_ACT, ANIMATING, ENEMY_ACT
    turnCount: 0,
    animationQueue: [], // Array of functions/promises to resolve
    messageLog: [], // Text messages for UI
    
    // Cursor
    cursor: {
        q: 0,
        r: 0, // Axial coords
        col: 0,
        row: 0, // Offset coords for navigation
        visible: true
    },
    
    // Camera / View (centering grid)
    viewOffset: { x: 0, y: 0 }
};

// Expose gameState globally
export function getGameState() {
    return gameState;
}
window.getGameState = getGameState;

// Logging Helper
export function logGameEvent(p, type, data) {
    if (p.logs && p.logs.game_info) {
        p.logs.game_info.push({
            type: type,
            data: data,
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    }
}