/**
 * globals.js
 * Contains global constants, game state management, and logging utilities.
 */

// Canvas Dimensions
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Game Constants
export const GRAVITY_FORCE = 0.6;
export const TERMINAL_VELOCITY = 12;
export const MOVE_SPEED = 5;
export const JUMP_FORCE = 11;
export const DASH_SPEED = 12;
export const DASH_DURATION = 15; // frames
export const DASH_COOLDOWN = 60; // frames
export const GRAVITY_COOLDOWN = 20; // frames
export const INVULNERABILITY_TIME = 60; // frames after damage

// Colors (Neon Palette)
export const COLORS = {
    BACKGROUND: [10, 10, 15],
    PLAYER: [0, 255, 255],        // Cyan
    PLAYER_DAMAGED: [255, 50, 50],// Red flash
    PLATFORM: [50, 50, 70],
    PLATFORM_STROKE: [100, 100, 200],
    SPIKE: [255, 0, 100],         // Neon Pink/Red
    ENEMY: [255, 100, 0],         // Orange
    COLLECTIBLE: [255, 255, 0],   // Yellow
    PORTAL: [0, 100, 255],        // Deep Blue
    TEXT: [255, 255, 255],
    UI_BG: [0, 0, 0, 200]
};

// Global Game State
export const gameState = {
    // Phase Management
    gamePhase: "START", // START, PLAYING, PAUSED, LEVEL_COMPLETE, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2
    
    // Time & Frame
    frameCount: 0,
    deltaTime: 0,
    lastFrameTime: 0,
    
    // Core Gameplay Data
    score: 0,
    level: 1,
    maxLevels: 3,
    
    // Entities (Populated by Level Manager)
    player: null,
    platforms: [],
    hazards: [],
    enemies: [],
    collectibles: [],
    particles: [],
    portal: null,
    
    // Physics Globals
    gravityDirection: 1, // 1 = Down, -1 = Up
    cameraX: 0,
    cameraY: 0,
    shakeTimer: 0,
    shakeMagnitude: 0,
    
    // Inputs (for replay/logging)
    keys: {},
    prevKeys: {}
};

/**
 * Resets the game state for a fresh start.
 * Preserves high-level settings like controlMode, but resets gameplay data.
 */
export function resetGameState(fullReset = true) {
    if (fullReset) {
        gameState.score = 0;
        gameState.level = 1;
        gameState.gamePhase = "START";
    } else {
        // Soft reset for restarting a level or next level
        gameState.gamePhase = "PLAYING";
    }
    
    gameState.platforms = [];
    gameState.hazards = [];
    gameState.enemies = [];
    gameState.collectibles = [];
    gameState.particles = [];
    gameState.portal = null;
    gameState.gravityDirection = 1;
    gameState.cameraX = 0;
    gameState.cameraY = 0;
    gameState.shakeTimer = 0;
    gameState.frameCount = 0;
}

/**
 * Global accessor for game state (required by constraints)
 */
export function getGameState() {
    return gameState;
}
window.getGameState = getGameState;

/**
 * Utility to add screen shake effect
 */
export function addScreenShake(frames, magnitude) {
    gameState.shakeTimer = frames;
    gameState.shakeMagnitude = magnitude;
}