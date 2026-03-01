/**
 * Global constants and state management for Crypt of the Rhythm Knight
 */

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TILE_SIZE = 40;
export const GRID_WIDTH = 15; // 600 / 40
export const GRID_HEIGHT = 9; // 360 / 40 (leaving 40px for HUD)
export const HUD_HEIGHT = 40;

// Rhythm Constants
export const BPM = 120;
export const BEAT_MS = 60000 / BPM;
export const INPUT_WINDOW = 150; // ms window around the beat to accept input

// Colors
export const COLORS = {
    BACKGROUND: [20, 15, 25],
    GRID_DARK: [30, 25, 35],
    GRID_LIGHT: [35, 30, 40],
    WALL: [60, 50, 70],
    PLAYER: [100, 200, 255],
    ENEMY_SLIME: [100, 255, 100],
    ENEMY_BAT: [200, 100, 255],
    ENEMY_SKELETON: [255, 255, 255],
    GOLD: [255, 215, 0],
    POTION: [255, 50, 50],
    EXIT: [255, 255, 0],
    BEAT_BAR: [0, 255, 255],
    BEAT_PERFECT: [0, 255, 0],
    BEAT_MISS: [255, 0, 0]
};

// Game State
export const gameState = {
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2
    
    // Level
    level: 1,
    maxLevels: 10,
    triggerNextLevel: false,

    // Time & Rhythm
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0,
    startTime: 0,
    lastBeatTime: 0,
    beatCount: 0,
    nextBeatTime: 0,
    
    // Player Stats
    score: 0,
    multiplier: 1,
    combo: 0,
    health: 10,
    maxHealth: 10,
    
    // World
    entities: [],
    particles: [],
    grid: [], // 2D array of tiles
    player: null,
    exit: null,
    
    // Input state
    lastInputBeat: -1, // Track which beat the player last acted on to prevent double moves
    playerMissedBeat: false, // Track if the player stumbled on the current beat
    
    // Camera Shake
    shakeAmount: 0,
    
    // Debug/Logging
    logs: {
        game_info: [],
        inputs: [],
        player_info: []
    }
};

/**
 * Expose gameState globally
 */
export function getGameState() {
    return gameState;
}

// Attach to window
window.getGameState = getGameState;

/**
 * Reset game state for a new run
 */
export function resetGameState() {
    gameState.score = 0;
    gameState.multiplier = 1;
    gameState.combo = 0;
    gameState.health = 10;
    gameState.level = 1;
    gameState.triggerNextLevel = false;
    
    gameState.entities = [];
    gameState.particles = [];
    gameState.shakeAmount = 0;
    gameState.lastInputBeat = -1;
    gameState.playerMissedBeat = false;
    gameState.beatCount = 0;
    gameState.startTime = 0; // Will be set in game.js on start
    
    // Crucial: Clear player reference so startLevel doesn't inherit dead player stats
    gameState.player = null;
    gameState.exit = null;
}