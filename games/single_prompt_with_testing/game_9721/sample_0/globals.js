/**
 * globals.js
 * Contains global constants, game state configuration, and shared resources.
 * This file serves as the central source of truth for game configuration.
 */

// Canvas Dimensions
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Game Loop Settings
export const TARGET_FPS = 60;
export const TIME_STEP = 1 / TARGET_FPS;

// Physics Constants
export const GRAVITY = 0.6;
export const FRICTION = 0.85; // Ground friction
export const AIR_RESISTANCE = 0.98;
export const GROUND_Y = 350; // Visual ground level (bottom of playable area)
export const HORIZON_Y = 250; // Visual horizon (top of playable area)
export const LEVEL_WIDTH = 2000; // Total length of the level

// Debug / Logging
export const DEBUG_MODE = false;

// Global Game State
// This object tracks the entire state of the application.
export const gameState = {
    // System State
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2, TEST_3
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0,
    
    // World State
    cameraX: 0,
    cameraY: 0,
    cameraShake: 0,
    
    // Entity Collections
    entities: [],
    particles: [],
    projectiles: [],
    enemies: [],
    items: [],
    
    // Specific References
    player: null,
    levelManager: null,
    
    // Game Progress
    score: 0,
    wave: 1,
    totalWaves: 3,
    enemiesKilled: 0,
    
    // Input State (Snapshot for current frame)
    input: {
        up: false,
        down: false,
        left: false,
        right: false,
        jump: false,
        attack: false,
        block: false,
        enter: false,
        escape: false,
        restart: false
    }
};

/**
 * Expose gameState globally as required by constraints.
 */
export function getGameState() {
    return gameState;
}
window.getGameState = getGameState;

/**
 * Resets the game state for a new session.
 * Called when starting or restarting the game.
 */
export function resetGameState() {
    gameState.gamePhase = "START"; // Usually reset to start, or playing if immediate
    gameState.frameCount = 0;
    gameState.score = 0;
    gameState.wave = 1;
    gameState.enemiesKilled = 0;
    gameState.cameraX = 0;
    gameState.cameraY = 0;
    gameState.cameraShake = 0;
    
    // Arrays cleared
    gameState.entities = [];
    gameState.particles = [];
    gameState.projectiles = [];
    gameState.enemies = [];
    gameState.items = [];
    gameState.player = null;
    gameState.levelManager = null;
    
    console.log("Game State Reset");
}

// Colors Palette - Kingdom Crashers Theme
export const COLORS = {
    background: [100, 149, 237], // Cornflower Blue Sky
    ground: [34, 139, 34], // Forest Green
    groundDark: [0, 100, 0],
    
    // Player (Blue Knight)
    playerSkin: [255, 220, 177],
    playerTunic: [0, 0, 255],
    playerTunicDark: [0, 0, 180],
    playerMetal: [192, 192, 192],
    playerMetalDark: [128, 128, 128],
    
    // Enemy (Barbarian)
    enemySkin: [210, 180, 140],
    enemyTunic: [139, 69, 19],
    enemyTunicDark: [101, 67, 33],
    
    // Boss
    bossTunic: [50, 50, 50],
    bossHighlight: [255, 0, 0],
    
    // UI
    text: [255, 255, 255],
    textShadow: [0, 0, 0],
    healthBarBg: [50, 0, 0],
    healthBarFill: [255, 0, 0],
    healthBarPlayer: [0, 255, 0],
    
    // Effects
    damage: [255, 255, 255],
    crit: [255, 255, 0],
    blood: [200, 0, 0]
};