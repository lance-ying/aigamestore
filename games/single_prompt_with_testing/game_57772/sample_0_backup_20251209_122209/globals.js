/**
 * globals.js
 * Contains global constants, configuration, and the shared game state object.
 */

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;

// Game tuning constants
export const CONFIG = {
    PLAYER_BASE_Y: 300,        // Y position of the snake head
    PLAYER_RADIUS: 8,          // Radius of snake balls
    INITIAL_SNAKE_LENGTH: 5,   // Starting length
    BASE_SCROLL_SPEED: 3,      // World scroll speed
    MAX_SCROLL_SPEED: 8,       // Cap for speed increase
    SPEED_INCREMENT: 0.001,    // Acceleration per frame
    LATERAL_SPEED: 6,          // Horizontal movement speed
    LATERAL_SPEED_FAST: 10,    // Shift key speed
    BLOCK_SIZE: 60,            // Dimension of obstacle blocks
    LANE_COUNT: 5,             // Number of vertical lanes (derived from width/block_size effectively)
    FEVER_MAX: 100,            // Points needed for fever
    FEVER_DURATION: 180,       // Frames (3 seconds)
    DAMAGE_TICK_RATE: 5,       // Frames between taking damage from a block
    WALL_WIDTH: 4,             // Width of vertical walls
    SPAWN_INTERVAL_MIN: 40,    // Min frames between spawns
    SPAWN_INTERVAL_MAX: 100    // Max frames between spawns
};

// Color palette
export const COLORS = {
    BACKGROUND: [20, 20, 25],
    PLAYER: [255, 220, 50],
    PLAYER_TRAIL: [255, 200, 0, 150],
    FOOD: [50, 255, 100],
    WALL: [200, 200, 210],
    TEXT: [255, 255, 255],
    UI_OVERLAY: [0, 0, 0, 180],
    FEVER: [255, 50, 150],
    // Block heat map colors (Low -> High value)
    BLOCK_LOW: [100, 200, 255],
    BLOCK_MED: [100, 100, 255],
    BLOCK_HIGH: [255, 50, 50]
};

// Central Game State
export const gameState = {
    // Phase management
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_LOSE
    controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2, etc.
    frameCount: 0,
    deltaTime: 0,
    lastFrameTime: 0,

    // Player State
    player: null, // Reference to the Snake instance
    score: 0,
    feverValue: 0,
    isFeverActive: false,
    feverTimer: 0,

    // World State
    entities: [],     // All game objects (Snake, Blocks, Foods, Walls, Particles)
    scrollSpeed: CONFIG.BASE_SCROLL_SPEED,
    isFrozen: false,  // True when hitting a block
    distanceTraveled: 0,
    
    // Entity Lists for easy access
    blocks: [],
    foods: [],
    walls: [],
    particles: [],

    // Camera/Shake
    screenShake: 0,
    
    // Methods
    reset: function() {
        this.score = 0;
        this.feverValue = 0;
        this.isFeverActive = false;
        this.feverTimer = 0;
        this.scrollSpeed = CONFIG.BASE_SCROLL_SPEED;
        this.isFrozen = false;
        this.distanceTraveled = 0;
        this.entities = [];
        this.blocks = [];
        this.foods = [];
        this.walls = [];
        this.particles = [];
        this.player = null; // Re-initialized in setup
    }
};

/**
 * Initialize Logging System
 * @param {object} p - p5 instance
 */
export function initLogs(p) {
    p.logs = {
        "game_info": [],
        "inputs": [],
        "player_info": []
    };
}

// Expose gameState globally
window.getGameState = () => gameState;