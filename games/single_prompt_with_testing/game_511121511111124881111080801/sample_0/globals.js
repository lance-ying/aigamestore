/**
 * Cavern Tale - Globals
 * Contains all constants, initial game state configuration, and global utility objects.
 */

// Canvas Dimensions
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const FPS = 60;

// World & Physics Constants
export const TILE_SIZE = 20;
export const GRAVITY = 0.6;
export const TERMINAL_VELOCITY = 12;
export const FRICTION = 0.85;
export const AIR_RESISTANCE = 0.95;

// Entity identifiers
export const ENTITY_TYPES = {
    PLAYER: 'player',
    ENEMY: 'enemy',
    PROJECTILE: 'projectile',
    COLLECTIBLE: 'collectible',
    PARTICLE: 'particle',
    FLOATING_TEXT: 'floating_text'
};

// Colors palette (Cave Story inspired)
export const PALETTE = {
    BACKGROUND: [20, 20, 30],       // Dark Blue/Black
    TILE_SOLID: [40, 40, 60],       // Cave Wall
    TILE_ACCENT: [60, 60, 90],      // Wall Highlight
    PLAYER: [240, 240, 240],        // White (Quote)
    PLAYER_CAP: [220, 50, 50],      // Red Hat
    PLAYER_SCARF: [200, 200, 255],  // Scarf
    ENEMY_BAT: [100, 100, 200],     // Blue Bat
    ENEMY_CRITTER: [50, 200, 100],  // Green Critter
    SPIKE: [180, 180, 180],         // Spikes
    DOOR: [100, 50, 0],             // Wood Door
    EXP_TRIANGLE: [255, 215, 0],    // Gold
    HEART: [255, 100, 100],         // Red Heart
    BULLET: [255, 255, 255],        // White Bullet
    UI_TEXT: [255, 255, 255],
    UI_BAR_BG: [0, 0, 0],
    UI_BAR_XP: [255, 200, 0],
    UI_BAR_HP: [255, 50, 50]
};

// Global Game State Object
export const gameState = {
    // Phases: START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    gamePhase: "START",
    controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2...
    
    // Time & Frame
    frameCount: 0,
    deltaTime: 0,
    lastFrameTime: 0,
    
    // Entities lists
    entities: [],       // Flat list of all active entities for update/draw
    particles: [],      // Visual effects only
    projectiles: [],    // Bullets
    enemies: [],        // Hostiles
    collectibles: [],   // Pickups
    floatingTexts: [],  // Damage numbers, XP gain
    
    // Core References
    player: null,
    camera: { x: 0, y: 0 },
    level: null,        // Holds tilemap data
    
    // Game Session Data
    score: 0,
    timeElapsed: 0,
    
    // Helper to reset state for a new game
    reset: function() {
        this.entities = [];
        this.particles = [];
        this.projectiles = [];
        this.enemies = [];
        this.collectibles = [];
        this.floatingTexts = [];
        this.player = null;
        this.score = 0;
        this.timeElapsed = 0;
        this.camera = { x: 0, y: 0 };
    }
};

// Expose getGameState globally as required
window.getGameState = function() {
    return gameState;
};