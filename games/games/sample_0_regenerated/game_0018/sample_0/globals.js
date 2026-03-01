/**
 * BRO-OP MISSION: FREEDOM - Global Configuration and State
 * 
 * This file contains all global constants, game state definitions,
 * and shared configuration objects used across the application.
 */

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const FPS = 60;

// Physics Constants
export const GRAVITY = 0.6;
export const TERMINAL_VELOCITY = 12;
export const FRICTION = 0.85;
export const AIR_RESISTANCE = 0.95;

// Player Constants
export const PLAYER_SPEED = 5;
export const PLAYER_JUMP_FORCE = -11;
export const PLAYER_DOUBLE_JUMP_FORCE = -9;
export const PLAYER_MAX_HEALTH = 100;
export const PLAYER_WIDTH = 24;
export const PLAYER_HEIGHT = 40;

// Game State Object
export const gameState = {
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2, TEST_3
    
    // Time tracking
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0,
    
    // Entities
    player: null,
    entities: [],     // All interactive objects (enemies, barrels, crates)
    projectiles: [],  // Bullets, grenades
    particles: [],    // Visual effects
    platforms: [],    // Static geometry
    
    // Camera
    camera: {
        x: 0,
        y: 0,
        shakeStrength: 0,
        shakeDecay: 0.9
    },
    
    // Level
    levelWidth: 3000,
    levelHeight: 800,
    
    // Scoring
    score: 0,
    enemiesKilled: 0,
    
    // Inputs (for automated testing logging)
    currentInputs: {}
};

/**
 * Global accessor for game state
 * Required by instructions
 */
export function getGameState() {
    return gameState;
}

// Expose globally
window.getGameState = getGameState;

/**
 * Resets the game state for a new session
 */
export function resetGameState() {
    gameState.gamePhase = "START";
    gameState.score = 0;
    gameState.enemiesKilled = 0;
    gameState.entities = [];
    gameState.projectiles = [];
    gameState.particles = [];
    gameState.platforms = [];
    gameState.camera.x = 0;
    gameState.camera.y = 0;
    gameState.camera.shakeStrength = 0;
    gameState.player = null;
}