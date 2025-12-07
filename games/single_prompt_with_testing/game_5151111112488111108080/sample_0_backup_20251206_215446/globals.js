import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

// Game Configuration Constants
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;
export const FIXED_TIME_STEP = 1.0 / TARGET_FPS;

// Physics Constants
export const GRAVITY = -0.015; // Gravity per frame (scaled)
export const BOUNCE_STRENGTH = 0.35; // Initial upward velocity on bounce
export const LATERAL_SPEED = 0.15; // Left/Right movement speed
export const FORWARD_SPEED_BASE = 0.12; // Base forward speed
export const FORWARD_SPEED_MAX = 0.30; // Maximum forward speed
export const TERMINAL_VELOCITY = -0.8;

// World Generation Constants
export const TILE_WIDTH_BASE = 4.0;
export const TILE_DEPTH = 4.0;
export const TILE_HEIGHT = 1.0;
export const GAP_MIN = 2.0;
export const GAP_MAX = 6.0;
export const PATH_DEVIATION = 5.0; // Max X deviation for path generation

// Colors
export const COLOR_SKY = 0x1a1a2e;
export const COLOR_PLAYER = 0xff0055;
export const COLOR_TILE_BASE = 0x4a4e69;
export const COLOR_TILE_ACTIVE = 0x9a8c98;
export const COLOR_PERFECT = 0x00ffcc;
export const COLOR_DIAMOND = 0x00b4d8;

// Global Game State
export const gameState = {
    // Core state
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    frameCount: 0,
    deltaTime: 0,
    time: 0,
    
    // Core Three.js objects
    renderer: null,
    scene: null,
    camera: null,
    gameContainer: null,
    
    // Lighting
    lights: [],
    ambientLight: null,
    directionalLight: null,
    
    // Entities
    player: null,
    entities: [],     // All updateable entities
    tiles: [],        // Specific list for collision optimization
    particles: [],    // Visual effects
    collectibles: [], // Diamonds
    floatingTexts: [], // Score popups
    
    // Gameplay stats
    score: 0,
    combo: 0,
    difficultyMultiplier: 1.0,
    distanceTraveled: 0,
    
    // Camera state
    cameraOffset: new THREE.Vector3(0, 8, 12),
    cameraLookAtOffset: new THREE.Vector3(0, 0, -5),
    cameraShake: 0,
    
    // Input state
    keys: {
        left: false,
        right: false,
        up: false,
        down: false,
        jump: false
    },
    
    // Testing/Control
    controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2
    
    // Environment
    fogDensity: 0.02,
    themeColor: new THREE.Color(COLOR_SKY)
};

// Initialize Logging System (Write-only)
window.logs = {
    game_info: [],
    player_info: [],
    inputs: []
};

/**
 * Expose gameState globally as per instructions
 */
export function getGameState() {
    return gameState;
}
window.getGameState = getGameState;

/**
 * Reset game state for a new run
 */
export function resetGameState() {
    gameState.score = 0;
    gameState.combo = 0;
    gameState.difficultyMultiplier = 1.0;
    gameState.distanceTraveled = 0;
    gameState.frameCount = 0;
    gameState.cameraShake = 0;
    
    // Clear entities arrays (meshes will be removed in game.js reset logic)
    gameState.entities = [];
    gameState.tiles = [];
    gameState.particles = [];
    gameState.collectibles = [];
    gameState.floatingTexts = [];
}