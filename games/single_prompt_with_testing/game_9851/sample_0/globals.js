/**
 * Global constants and state management for Castle Hammerwatch Lite.
 * Handles the central gameState object and configuration.
 */

// Canvas Dimensions
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Game Configuration
export const TILE_SIZE = 40;
export const GRAVITY = 0; // Top-down game, no gravity
export const FRICTION = 0.85;
export const MAX_SPEED = 4;
export const DASH_SPEED = 10;
export const DASH_COOLDOWN = 60; // Frames
export const ATTACK_COOLDOWN = 25; // Frames
export const ATTACK_DURATION = 10; // Frames

// Colors
export const COLORS = {
    BACKGROUND: '#1a1a24',
    WALL: '#363645',
    FLOOR: '#232330',
    FLOOR_CHECKER: '#282838',
    UI_BG: 'rgba(0, 0, 0, 0.7)',
    TEXT: '#ffffff',
    ACCENT: '#d4af37', // Gold
    HEALTH_BAR_BG: '#4a0d0d',
    HEALTH_BAR_FG: '#e02828',
    STAMINA_BAR_BG: '#0d284a',
    STAMINA_BAR_FG: '#2888e0'
};

/**
 * The central game state object.
 * Accessible globally via window.getGameState()
 */
export const gameState = {
    // Phase Management
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2
    
    // Time & Performance
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0,
    
    // Core Entities
    player: null,
    entities: [],     // All dynamic entities (enemies, projectiles, etc.)
    world: [],        // Static tile map
    particles: [],    // Visual effects
    textPopups: [],   // Floating damage numbers, etc.
    
    // Specific Lists for optimized access
    enemies: [],
    projectiles: [],
    pickups: [],      // Gold, Potions
    interactables: [], // Chests, Doors
    
    // World State
    camera: {
        x: 0,
        y: 0
    },
    mapWidth: 0,
    mapHeight: 0,
    
    // Player Progress (Session)
    score: 0,
    keys: 0,
    floor: 1,
    
    // Input State
    keysPressed: {},
    mouseX: 0,
    mouseY: 0
};

/**
 * Returns the global game state.
 * Exposed to window for debugging and automated testing.
 */
export function getGameState() {
    return gameState;
}

// Expose globally
window.getGameState = getGameState;

/**
 * Resets the game state for a new session.
 */
export function resetGameState() {
    gameState.gamePhase = "START";
    gameState.frameCount = 0;
    gameState.entities = [];
    gameState.enemies = [];
    gameState.projectiles = [];
    gameState.particles = [];
    gameState.pickups = [];
    gameState.interactables = [];
    gameState.textPopups = [];
    gameState.score = 0;
    gameState.keys = 0;
    gameState.floor = 1;
    gameState.camera.x = 0;
    gameState.camera.y = 0;
}