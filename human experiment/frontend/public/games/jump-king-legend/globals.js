/**
 * Global constants and state management for the game.
 * Includes physics constants, canvas dimensions, and the central gameState object.
 */

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Physics Constants
export const GRAVITY = 0.34; // Reduced from 0.4 for floatier, easier jumps
export const TERMINAL_VELOCITY = 12;
export const FRICTION_GROUND = 0.8;
export const FRICTION_AIR = 0.99; // Very little air friction
export const WALK_SPEED = 3.5;
export const SLOW_WALK_SPEED = 1.5;
export const JUMP_CHARGE_RATE = 0.5;
export const MAX_JUMP_POWER = 15; // Increased from 14
export const MIN_JUMP_POWER = 2;
export const BOUNCE_FACTOR = 0.5; // Reduced from 0.6 to be slightly less punishing

// Level Dimensions
export const WORLD_WIDTH = 600;
export const WORLD_HEIGHT = 4000; // Very tall world

// Central Game State
export const gameState = {
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN",
    
    // Entities
    player: null,
    platforms: [],
    decorations: [],
    particles: [],
    triggerZones: [],
    
    // Camera
    camera: {
        x: 0,
        y: 0,
        targetY: 0
    },
    
    // Game Progress
    score: 0, // Max height reached
    currentHeight: 0,
    startTime: 0,
    elapsedTime: 0,
    attempts: 0,
    falls: 0,
    
    // Input State (processed)
    keys: {
        left: false,
        right: false,
        up: false,
        down: false,
        jump: false,
        walkSlow: false,
        action: false
    },
    
    // Performance
    frameCount: 0,
    deltaTime: 0,
    lastFrameTime: 0,
    
    // Debug/Cheats
    debugMode: false
};

// Global accessor as required
window.getGameState = () => gameState;

// Logging function helper
export function logGameInfo(p, infoType, data) {
    if (!p.logs) return;
    
    const targetLog = p.logs[infoType];
    if (targetLog) {
        targetLog.push({
            data: data,
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    }
}