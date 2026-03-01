/**
 * globals.js
 * Contains global constants, game state definition, and logging initialization.
 * This file serves as the central source of truth for game data.
 */

// Canvas Dimensions
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;

// Game Colors (Blue Revolver Palette)
export const COLORS = {
    BACKGROUND: '#050510',
    PLAYER: '#00FFFF', // Cyan
    PLAYER_BULLET: '#AAFFFF',
    ENEMY_WEAK: '#FF5555', // Red
    ENEMY_STRONG: '#FF00FF', // Magenta
    ENEMY_BULLET: '#FF99FF', // Pinkish
    ENEMY_BULLET_AIMED: '#FF3333',
    GOLD: '#FFD700',
    TEXT: '#FFFFFF',
    UI_BG: 'rgba(0, 0, 20, 0.8)',
    PARTICLE_SPARK: '#FFFFFF',
    PARTICLE_EXPLOSION: '#FFaa00'
};

// Game Phases
export const GAME_PHASES = {
    START: "START",
    PLAYING: "PLAYING",
    PAUSED: "PAUSED",
    GAME_OVER_WIN: "GAME_OVER_WIN",
    GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

// Control Modes
export const CONTROL_MODES = {
    HUMAN: "HUMAN",
    TEST_1: "TEST_1", // Survival
    TEST_2: "TEST_2", // Aggressive
    TEST_3: "TEST_3"  // Focus
};

/**
 * The main Game State object.
 * Tracks all mutable data during the game's lifecycle.
 */
export const gameState = {
    // Phase and Mode
    gamePhase: GAME_PHASES.START,
    controlMode: CONTROL_MODES.HUMAN,

    // Entities
    player: null,
    entities: [],       // General entity list
    enemies: [],        // Specific list for collision optimization
    enemyBullets: [],   // Specific list for bullets
    playerBullets: [],
    particles: [],
    collectibles: [],
    
    // Physics / World
    gravity: 0,         // No gravity in a top-down shmup
    friction: 0.85,     // Movement friction
    bounds: {
        x: 0, y: 0, width: CANVAS_WIDTH, height: CANVAS_HEIGHT
    },

    // Scoring & Progression
    score: 0,
    highScore: 0,
    chain: 0,           // Current chain count
    chainTimer: 0,      // Frames until chain drops
    chainMaxTime: 120,  // Max frames for chain
    level: 1,
    waveFrame: 0,       // Frame counter for the current wave

    // Stats
    lives: 3,
    bombs: 2,           // Special weapon ammo
    
    // Performance
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0,
    
    // Input State (Global mouse tracking)
    mouseX: 0,
    mouseY: 0,

    // Debug flags
    debugMode: false
};

/**
 * Exposes the game state globally as required by the spec.
 */
export function getGameState() {
    return gameState;
}
window.getGameState = getGameState;

/**
 * Resets the game state for a new game session.
 * Does not reset high score or control mode.
 */
export function resetGameState() {
    gameState.gamePhase = GAME_PHASES.START;
    gameState.score = 0;
    gameState.chain = 0;
    gameState.chainTimer = 0;
    gameState.waveFrame = 0;
    gameState.lives = 3;
    gameState.bombs = 3;
    
    // Clear arrays
    gameState.entities = [];
    gameState.enemies = [];
    gameState.enemyBullets = [];
    gameState.playerBullets = [];
    gameState.particles = [];
    gameState.collectibles = [];
    
    gameState.player = null;
}