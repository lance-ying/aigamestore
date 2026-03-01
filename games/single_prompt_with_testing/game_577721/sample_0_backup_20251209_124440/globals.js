/**
 * Global Constants and Game State Configuration
 * 
 * This file contains all global configuration constants, color definitions,
 * and the central gameState object structure.
 */

// Canvas Dimensions
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Game Settings
export const TARGET_FPS = 60;
export const GRAVITY = 0; // Top-down view, no gravity
export const DRAG = 0.95; // Air resistance

// Entity Settings
export const MOB_RADIUS = 4;
export const MOB_SPEED = 3.5;
export const ENEMY_MOB_SPEED = 2.5;
export const PLAYER_COOLDOWN = 10; // Frames between shots
export const CHAMPION_COST = 500;
export const OVERDRIVE_COST = 1;

// Colors (RGB Arrays)
export const COLOR_BG = [30, 30, 40];
export const COLOR_PLAYER = [60, 120, 255]; // Blue
export const COLOR_ENEMY = [255, 60, 60];   // Red
export const COLOR_GATE_MULT = [0, 200, 100]; // Green
export const COLOR_GATE_ADD = [255, 200, 0];  // Yellow
export const COLOR_TEXT = [255, 255, 255];

// Game State Object
export const gameState = {
    // System State
    gamePhase: "START",     // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN",   // HUMAN, TEST_1, TEST_2
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0,
    
    // Entity Collections
    player: null,           // The Cannon
    enemyBase: null,        // The Target
    mobs: [],               // All moving units (friendly and enemy)
    gates: [],              // Multiplier/Adder gates
    particles: [],          // Visual effects
    projectiles: [],        // Special projectiles (if any)
    floatingTexts: [],      // UI popups (+1, x2)
    
    // Game Progress
    score: 0,
    energy: 100,            // Resource for special moves
    maxEnergy: 100,
    levelDifficulty: 1,
    waveTimer: 0,
    
    // Physics / World
    shakeTimer: 0,
    shakeIntensity: 0,
    
    // Spatial Partitioning
    spatialGrid: null       // Initialized in game.js
};

/**
 * Expose gameState to the window object for debugging and external access
 */
export function getGameState() {
    return gameState;
}

// Make globally available as per requirements
window.getGameState = getGameState;

/**
 * Reset the game state for a new game
 */
export function resetGameState() {
    gameState.gamePhase = "START";
    gameState.score = 0;
    gameState.energy = 100;
    gameState.levelDifficulty = 1;
    gameState.waveTimer = 0;
    gameState.shakeTimer = 0;
    
    // Entities are cleared in game.js setup/reset logic
    gameState.mobs = [];
    gameState.gates = [];
    gameState.particles = [];
    gameState.floatingTexts = [];
}