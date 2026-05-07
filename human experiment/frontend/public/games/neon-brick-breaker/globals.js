/**
 * Global constants and state management
 */

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const FPS = 60;

// Game Configuration
export const CONFIG = {
    BALL_SIZE: 8,
    BALL_SPEED: 8,
    BRICK_HEIGHT: 30,
    BRICK_GUTTER: 2,
    COLUMNS: 9, // Number of brick columns
    TOP_OFFSET: 60, // Space for UI
    BOTTOM_OFFSET: 50, // Space for launcher
    MAX_VELOCITY: 12,
    GRAVITY: 0, // No gravity in this style of game
    FRICTION: 1, // No friction
    ELASTICITY: 1, // Perfect bounce
    LAUNCH_DELAY: 5, // Frames between ball launches
    WALL_PADDING: 0
};

// Derived constants
export const BRICK_WIDTH = (CANVAS_WIDTH - (CONFIG.WALL_PADDING * 2)) / CONFIG.COLUMNS;

// Colors
export const COLORS = {
    BACKGROUND: '#121212',
    UI_TEXT: '#FFFFFF',
    BALL: '#00FFFF',
    LAUNCHER: '#FFFFFF',
    PARTICLE: ['#FF00FF', '#00FFFF', '#FFFF00', '#FF0055'],
    BRICK_GRADIENT_START: { r: 255, g: 0, b: 100 },
    BRICK_GRADIENT_END: { r: 100, g: 0, b: 255 },
    ITEM_ADD_BALL: '#00FF00'
};

// Game State
export const gameState = {
    // Phases: START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    gamePhase: "START",
    controlMode: "HUMAN",
    
    // Core Game Data
    score: 0,
    level: 1,
    highScore: 0,
    
    // Turn Management
    turnPhase: "AIMING", // AIMING, FIRING, RESOLVING, UPDATING
    
    // Entities
    player: null, // The launcher
    balls: [],
    bricks: [],
    items: [],
    particles: [],
    
    // Mechanics
    ballCount: 1,
    ballsReady: 1, // Balls currently at launcher
    ballsActive: 0, // Balls moving
    firstBallLanded: false, // Track if the new launcher pos is set
    nextLauncherX: 0,
    
    // Performance
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0,
    timeScale: 1.0, // For fast forward
    
    // Physics State
    gravity: CONFIG.GRAVITY,
    friction: CONFIG.FRICTION
};

// Expose state globally
export function getGameState() {
    return gameState;
}

window.getGameState = getGameState;

// Logger initialization helper
export function initLogs(p) {
    p.logs = {
        "game_info": [],
        "inputs": [],
        "player_info": []
    };
}

export function logGameInfo(p, data) {
    p.logs.game_info.push({
        data: data,
        framecount: p.frameCount,
        timestamp: Date.now()
    });
}

export function logInput(p, type, data) {
    p.logs.inputs.push({
        input_type: type,
        data: data,
        framecount: p.frameCount,
        timestamp: Date.now()
    });
}

export function logPlayerInfo(p) {
    // Throttle logging to every 60 frames to save memory
    if (p.frameCount % 60 === 0 && gameState.player) {
        p.logs.player_info.push({
            x: gameState.player.x,
            y: gameState.player.y,
            ballCount: gameState.ballCount,
            score: gameState.score,
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    }
}