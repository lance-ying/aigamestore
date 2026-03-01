/**
 * Global constants and state management for the game.
 * Handles the central gameState object and logging system.
 */

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Physics Constants
export const GRAVITY = 0.25;
export const TERMINAL_VELOCITY = 6;
export const JUMP_FORCE = -5.5;
export const WALL_JUMP_FORCE = { x: 4, y: -5 };
export const DASH_SPEED = 7;
export const DASH_TIME = 10; // Frames
export const DASH_COOLDOWN = 10; // Frames
export const MOVE_SPEED = 2.5;
export const FRICTION = 0.8;
export const AIR_RESISTANCE = 0.95;
export const CLIMB_SPEED = 1.5;
export const MAX_STAMINA = 120;

// Colors
export const COLORS = {
    background: [20, 20, 35],
    wall: [40, 35, 50],
    snow: [200, 220, 255],
    spike: [180, 180, 200],
    player_idle: [220, 50, 50], // Red hair (has dash)
    player_no_dash: [50, 150, 220], // Blue hair (no dash)
    strawberry: [255, 50, 100],
    gold: [255, 215, 0],
    crystal: [0, 255, 200],
    spring: [200, 150, 50]
};

// Global Game State
export const gameState = {
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN",
    
    // Entities
    player: null,
    entities: [],
    solids: [], // Platforms, walls
    hazards: [], // Spikes
    collectibles: [], // Strawberries
    triggers: [], // Dash crystals, springs, goals
    particles: [],
    
    // Level State
    levelHeight: 0,
    cameraY: 0,
    score: 0,
    deathCount: 0,
    
    // Time
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0,
    
    // Input Buffering
    inputBuffer: {
        jump: 0,
        dash: 0
    }
};

// Expose gameState globally
window.getGameState = () => gameState;

// Logging Helper
export function logGameInfo(p, data) {
    if (p.logs && p.logs.game_info) {
        p.logs.game_info.push({
            data: data,
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    }
}