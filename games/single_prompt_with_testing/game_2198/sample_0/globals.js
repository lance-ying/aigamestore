/**
 * globals.js
 * Contains global constants, configuration, and the main game state object.
 * This file serves as the central source of truth for game data.
 */

// Canvas Dimensions
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Physics Constants
export const GRAVITY = 0.6;
export const TERMINAL_VELOCITY = 12;
export const FRICTION = 0.85; // Air resistance/ground friction
export const BASE_SPEED = 5.5; // Initial player forward speed
export const MAX_SPEED = 9.0;  // Maximum speed cap
export const SPEED_INCREMENT = 0.001; // Speed increase per frame
export const JUMP_FORCE = -11; // Initial jump impulse
export const JUMP_HOLD_FORCE = -0.6; // Force applied while holding jump
export const MAX_JUMP_FRAMES = 12; // Max frames to hold jump for extra height

// Entity Dimensions
export const PLAYER_SIZE = 30;
export const TILE_SIZE = 40;
export const SPIKE_WIDTH = 40;
export const SPIKE_HEIGHT = 30;

// Colors (RGB Arrays)
export const COLOR_BACKGROUND = [20, 24, 35];
export const COLOR_PLAYER = [255, 60, 60];
export const COLOR_PLAYER_TRAIL = [255, 100, 100];
export const COLOR_GROUND = [240, 240, 245];
export const COLOR_SPIKE = [200, 40, 40];
export const COLOR_PLATFORM = [100, 100, 120];
export const COLOR_TEXT = [255, 255, 255];
export const COLOR_HUD_BG = [0, 0, 0, 150];

// Game State Object
// Initialized here, but mutable properties are reset in game.js resetGame()
export const gameState = {
    // Phase Management
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2

    // Main Entities
    player: null,
    entities: [], // All interactive game objects (blocks, spikes)
    particles: [], // Visual effects
    backgroundElements: [], // Parallax items

    // World State
    cameraX: 0,
    cameraY: 0,
    worldSpeed: BASE_SPEED,
    score: 0,
    highScore: 0,
    distanceTraveled: 0,
    frameCount: 0,
    
    // Logic State
    lastFrameTime: 0,
    deltaTime: 0,
    isPaused: false,
    
    // Level Generation State
    nextSpawnX: 0,
    difficultyTier: 1,
    
    // Input State
    keys: {}
};

// Global Accessor
export function getGameState() {
    return gameState;
}
window.getGameState = getGameState;

// Debug/Logging Configuration
export const LOG_BUFFER_SIZE = 1000;