/**
 * Rain World - P5.js Implementation
 * Global Constants and State Management
 */

// Canvas Dimensions
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// World Dimensions (Scrolling)
export const WORLD_WIDTH = 2400; // 4 screens wide
export const WORLD_HEIGHT = 800; // 2 screens tall

// Physics Constants
export const GRAVITY = 0.4;
export const TERMINAL_VELOCITY = 12;
export const FRICTION_GROUND = 0.85;
export const FRICTION_AIR = 0.95;
export const POLE_CLIMB_SPEED = 3;

// Game Rules
export const RAIN_CYCLE_DURATION = 3600; // 60 seconds at 60fps
export const FOOD_TO_HIBERNATE = 4;
export const MAX_FOOD = 7;

// Colors
export const COLORS = {
    BACKGROUND: '#1a1a1d',
    BACKGROUND_DARK: '#0a0a0d',
    PLATFORM: '#4a4e69',
    POLE: '#555555',
    SLUGCAT_BODY: '#ffffff',
    SLUGCAT_EYES: '#000000',
    LIZARD_GREEN: '#32a852',
    LIZARD_PINK: '#d63384',
    BATFLY: '#222222',
    BATFLY_WING: '#444444',
    FOOD: '#3399ff',
    SPEAR: '#8c8c8c',
    RAIN: '#5555ff',
    UI_TEXT: '#ffffff',
    SHELTER: '#ffcc00'
};

/**
 * Global Game State Object
 * Stores all mutable data for the current game session.
 */
export const gameState = {
    // System
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2, etc.
    frameCount: 0,
    deltaTime: 0,
    lastFrameTime: 0,
    
    // Camera
    camera: {
        x: 0,
        y: 0,
        target: null
    },

    // World
    rainTimer: RAIN_CYCLE_DURATION,
    rainIntensity: 0, // 0 to 1
    waterLevel: WORLD_HEIGHT + 100, // Rising water Y position

    // Entities
    player: null,
    entities: [], // Flat list of all entities for update/render
    platforms: [], // Static collision geometry
    poles: [], // Climbable objects
    enemies: [], // Lizards, etc.
    collectibles: [], // Food, Pearls
    items: [], // Spears, Rocks (Physics objects)
    particles: [], // Visual effects
    shelter: null, // Victory point

    // Input State (Snapshot for current frame)
    input: {
        left: false,
        right: false,
        up: false,
        down: false,
        jump: false,
        crouch: false,
        throw: false,
        map: false // Shift
    }
};

/**
 * Expose gameState to window for debugging/hard constraints
 */
export function getGameState() {
    return gameState;
}
window.getGameState = getGameState;

/**
 * Reset Game State for a new session
 */
export function resetGameState() {
    gameState.gamePhase = "START";
    gameState.frameCount = 0;
    gameState.rainTimer = RAIN_CYCLE_DURATION;
    gameState.rainIntensity = 0;
    gameState.waterLevel = WORLD_HEIGHT + 100;
    gameState.entities = [];
    gameState.platforms = [];
    gameState.poles = [];
    gameState.enemies = [];
    gameState.collectibles = [];
    gameState.items = [];
    gameState.particles = [];
    gameState.player = null;
    gameState.shelter = null;
    gameState.camera.x = 0;
    gameState.camera.y = 0;
}