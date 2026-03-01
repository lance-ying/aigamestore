/**
 * Global constants and state management for A Few Quick Matches.
 * Stores the single source of truth for game state.
 */

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const WORLD_WIDTH = 800; // Larger world for scrolling
export const WORLD_HEIGHT = 600;

export const GRAVITY = 0.6;
export const FRICTION = 0.85; // Ground friction
export const AIR_RESISTANCE = 0.98;
export const TERMINAL_VELOCITY = 15;

// Game State Object
export const gameState = {
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2
    
    // Time tracking
    frameCount: 0,
    deltaTime: 0,
    lastFrameTime: 0,
    
    // Entities
    entities: [],
    player: null,
    enemies: [], // Array of Bot instances
    platforms: [],
    projectiles: [], // Hitboxes are treated somewhat like short-lived projectiles
    particles: [],
    
    // Camera
    camera: {
        x: 0,
        y: 0,
        shake: 0
    },
    
    // Game Rules
    score: 0,
    stage: 1,
    stageBgTop: [30, 30, 40],    // Gradient Top
    stageBgBottom: [10, 10, 20], // Gradient Bottom
    hitStop: 0, // Global freeze frames for impact feel
    slowMotion: 0, // For dramatic finishes
};

/**
 * Returns the global game state object.
 * Exposed to window for debugging and hard constraint compliance.
 */
export function getGameState() {
    return gameState;
}

// Expose globally
window.getGameState = getGameState;

/**
 * Resets the game state for a new match.
 */
export function resetGameState() {
    gameState.gamePhase = "START";
    gameState.entities = [];
    gameState.player = null;
    gameState.enemies = [];
    gameState.platforms = [];
    gameState.projectiles = [];
    gameState.particles = [];
    gameState.camera.x = 0;
    gameState.camera.y = 0;
    gameState.camera.shake = 0;
    gameState.hitStop = 0;
    gameState.slowMotion = 0;
    gameState.score = 0;
    gameState.stage = 1;
    gameState.stageBgTop = [30, 30, 40];
    gameState.stageBgBottom = [10, 10, 20];
}