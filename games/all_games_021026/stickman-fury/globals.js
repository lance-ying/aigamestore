/**
 * globals.js
 * Contains global constants, game state definition, and shared configuration.
 * This file serves as the central source of truth for game tuning and state management.
 */

// ==========================================
// CONFIGURATION CONSTANTS
// ==========================================

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;

// World & Physics
export const GROUND_Y = 320;
export const GRAVITY = 0.6;
export const DRAG = 0.9;

// Gameplay Mechanics
export const PLAYER_X = CANVAS_WIDTH / 2;
export const ATTACK_RANGE = 130; // Distance from player center where hits are valid
export const HIT_SWEET_SPOT = 100; // Visual marker for "perfect" hit range
export const MISS_PENALTY_FRAMES = 30; // Frames player is frozen if they miss
export const COMBO_DECAY_FRAMES = 120; // Frames before combo resets
export const FURY_MAX = 100; // Max value for fury meter
export const FURY_GAIN_PER_HIT = 5;

// Enemy Spawning
export const SPAWN_RATE_INITIAL = 120; // Frames between spawns initially
export const SPAWN_RATE_MIN = 30; // Fastest spawn rate
export const DIFFICULTY_RAMP_INTERVAL = 600; // Every 10 seconds, difficulty increases

// Colors (using RGB arrays for p5 usage)
export const COLOR_BG = [20, 20, 25];
export const COLOR_PLAYER = [255, 255, 255];
export const COLOR_ENEMY_BASIC = [150, 150, 150];
export const COLOR_ENEMY_FAST = [255, 100, 100];
export const COLOR_ENEMY_TANK = [100, 100, 255];
export const COLOR_ENEMY_ARMORED = [50, 150, 50]; // Green
export const COLOR_ENEMY_BOSS = [139, 0, 0]; // Dark Red
export const COLOR_GROUND = [50, 50, 60];
export const COLOR_UI_ACCENT = [255, 215, 0]; // Gold

// ==========================================
// GAME STATE MANAGEMENT
// ==========================================

/**
 * The central game state object.
 * This object is mutated throughout the game loop to reflect the current status.
 */
export const gameState = {
    // System State
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN", // Only HUMAN mode
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0,
    
    // Gameplay State
    score: 0,
    highScore: 0,
    combo: 0,
    maxCombo: 0,
    furyMeter: 0,
    difficultyLevel: 1,
    timeSinceLastKill: 0,
    isMissStunned: false,
    missStunTimer: 0,
    
    // Entities
    player: null,
    enemies: [],      // All active enemies
    particles: [],    // Visual effects
    floatingTexts: [], // Damage numbers, "Miss!", "Perfect!"
    backgroundEffects: [], // Speed lines, flashes
    
    // Combat Queues (Optimization for rapid lookup)
    leftSideEnemies: [],
    rightSideEnemies: [],
    
    // Camera / Screen Shake
    shakeIntensity: 0,
    shakeDecay: 0.9,
    cameraOffset: { x: 0, y: 0 },
    
    // Stats Tracking
    kills: 0,
    misses: 0,
    perfectHits: 0
};

// Expose gameState to the window object for external access (e.g., recorder scripts)
window.gameState = gameState;
window.getGameState = () => gameState;