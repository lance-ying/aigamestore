// globals.js - Game State and Constants

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TILE_SIZE = 40;

// Physics Constants
export const GRAVITY = 0.5;
export const TERMINAL_VELOCITY = 12;
export const FRICTION = 0.85;
export const AIR_RESISTANCE = 0.95;
export const MOVE_SPEED = 0.5;
export const JUMP_FORCE = -10;
export const BOMB_FUSE_TIME = 120; // Frames (2 seconds)
export const BOMB_BLAST_RADIUS = 100;
export const BOMB_FORCE = 15;

// Global Game State
export const gameState = {
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2
    
    // Time tracking
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0,
    
    // World State
    levelW: 0,
    levelH: 0,
    camera: { x: 0, y: 0 },
    
    // Entities
    player: null,
    platforms: [],      // Static geometry
    blocks: [],         // Destructible blocks
    bombs: [],          // Active bombs
    collectibles: [],   // Star Spores
    hazards: [],        // Spikes, etc.
    particles: [],      // Visual effects
    goal: null,         // Win condition
    
    // Player State
    score: 0,
    
    // Debug/Logging
    debugMode: false
};

// Expose gameState globally
export function getGameState() {
    return gameState;
}
window.getGameState = getGameState;

// Reset function for game restart
export function resetGameState() {
    gameState.gamePhase = "START";
    gameState.frameCount = 0;
    gameState.score = 0;
    gameState.player = null;
    gameState.platforms = [];
    gameState.blocks = [];
    gameState.bombs = [];
    gameState.collectibles = [];
    gameState.hazards = [];
    gameState.particles = [];
    gameState.goal = null;
    gameState.camera = { x: 0, y: 0 };
}