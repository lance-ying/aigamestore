/**
 * Global constants and state management for the Lumberjack game.
 * This file contains configuration values, color palettes, and the central gameState object.
 */

// Canvas Dimensions
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;

// Game Balance Configuration
export const GAME_CONFIG = {
    INITIAL_TIME: 100,          // Starting energy/time value
    MAX_TIME: 100,              // Max energy
    TIME_DEPLETION_RATE: 0.12,  // Energy lost per frame (Reduced from 0.2 for better playability)
    TIME_GAIN_PER_CHOP: 5,      // Energy gained per chop
    DIFFICULTY_SCALING: 0.003,  // How much depletion rate increases per score point (Reduced from 0.005)
    GRAVITY: 0.8,               // Physics gravity for particles
    TREE_WIDTH: 100,            // Width of the tree trunk
    SEGMENT_HEIGHT: 80,         // Height of one tree segment
    PLAYER_OFFSET_X: 90,        // Distance of player from center
    BRANCH_LENGTH: 80,          // Length of branches
    BG_SCROLL_SPEED: 0.5        // Speed of background parallax
};

// Color Palettes (Seasons)
export const COLORS = {
    UI_TEXT: '#FFFFFF',
    UI_SHADOW: '#000000',
    ENERGY_BAR_BG: '#550000',
    ENERGY_BAR_FILL: '#FFCC00',
    
    // Default Tree Colors
    TREE_BARK: '#5D4037',
    TREE_BARK_DARK: '#3E2723',
    TREE_RINGS: '#D7CCC8',
    
    // Player Colors
    PLAYER_SKIN: '#FFCC80',
    PLAYER_SHIRT: '#D32F2F',
    PLAYER_PANTS: '#1565C0',
    AXE_HANDLE: '#8D6E63',
    AXE_HEAD: '#B0BEC5',
    
    // Seasonal Palettes
    SEASONS: [
        {
            name: "Summer",
            skyTop: [135, 206, 235],    // Sky Blue
            skyBottom: [224, 247, 250], // Light Blue
            ground: [76, 175, 80],      // Green
            leaves: [56, 142, 60]       // Dark Green
        },
        {
            name: "Autumn",
            skyTop: [255, 167, 38],     // Orange
            skyBottom: [255, 224, 178], // Light Orange
            ground: [121, 85, 72],      // Brown
            leaves: [216, 67, 21]       // Red/Orange
        },
        {
            name: "Winter",
            skyTop: [40, 53, 147],      // Dark Blue
            skyBottom: [144, 202, 249], // Light Blue
            ground: [236, 239, 241],    // Snow White
            leaves: [255, 255, 255]     // White (Snow on branches)
        },
        {
            name: "Spring",
            skyTop: [186, 104, 200],    // Purple-ish
            skyBottom: [248, 187, 208], // Pink
            ground: [139, 195, 74],     // Light Green
            leaves: [233, 30, 99]       // Pink (Blossoms)
        }
    ]
};

// Input Keys
export const KEYS = {
    ENTER: 13,
    ESC: 27,
    SPACE: 32,
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    SHIFT: 16,
    Z: 90,
    R: 82
};

// Enums
export const SIDE = {
    NONE: 0,
    LEFT: -1,
    RIGHT: 1
};

/**
 * Central Game State Object
 * Modified directly by game logic and read by renderers.
 */
export const gameState = {
    // Core References
    player: null,
    tree: null,
    background: null,
    
    // Phase Management
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2
    
    // Gameplay Data
    score: 0,
    highScore: 0,
    energy: 100,
    level: 1,
    currentSeasonIndex: 0,
    
    // Physics & Entities
    entities: [],       // General purpose entity list
    particles: [],      // Visual effects
    popups: [],         // Text popups (score, etc)
    
    // Performance / Time
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0,
    
    // Input State
    keysPressed: {},    // Map of currently pressed keys
    
    // Camera / Shake
    shakeTimer: 0,
    shakeMagnitude: 0
};

// Global Helper to access game state
window.getGameState = () => gameState;

// Reset function for game restart
export function resetGameState() {
    gameState.score = 0;
    gameState.energy = GAME_CONFIG.INITIAL_TIME;
    gameState.level = 1;
    gameState.currentSeasonIndex = 0;
    gameState.entities = [];
    gameState.particles = [];
    gameState.popups = [];
    gameState.shakeTimer = 0;
    gameState.shakeMagnitude = 0;
    // Note: Player and Tree are re-initialized in their specific setup functions
}