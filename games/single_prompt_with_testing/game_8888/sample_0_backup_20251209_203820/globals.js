/**
 * Global constants and state management for Cookie Kingdom Defense.
 */

// Canvas Dimensions
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Game Colors (Cookie Run Inspired Palette)
export const PALETTE = {
    SKY_TOP: '#87CEEB',
    SKY_BOTTOM: '#E0F7FA',
    GROUND_TOP: '#8D6E63', // Chocolate
    GROUND_BOTTOM: '#5D4037',
    GRASS: '#AED581',      // Matcha icing
    COOKIE_BODY: '#D7CCC8',
    COOKIE_DARK: '#A1887F',
    ICING: '#FFFFFF',
    RED_JELLY: '#FF5252',
    YELLOW_JELLY: '#FFD740',
    ENEMY_CAKE: '#3E2723',
    ENEMY_CREAM: '#F48FB1',
    UI_BG: '#FFF3E0',
    UI_BORDER: '#795548'
};

// Physics Constants
export const GRAVITY = 0.6;
export const TERMINAL_VELOCITY = 12;
export const FRICTION = 0.85;
export const GROUND_LEVEL = CANVAS_HEIGHT - 60;

// Game State Object
export const gameState = {
    // Phases: START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    gamePhase: "START", 
    controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2, TEST_3
    
    // Time tracking
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0,
    difficultyMultiplier: 1.0,
    distanceTraveled: 0,
    
    // Player & Camera
    player: null,
    cameraX: 0,
    cameraY: 0,
    score: 0,
    highScore: 0,
    
    // Entity Collections
    entities: [],
    enemies: [],
    collectibles: [],
    particles: [],
    platforms: [],
    projectiles: [],
    backgroundElements: [], // Decor
    
    // Input state
    keys: {},
    
    // Reset function
    reset: function() {
        this.score = 0;
        this.distanceTraveled = 0;
        this.difficultyMultiplier = 1.0;
        this.entities = [];
        this.enemies = [];
        this.collectibles = [];
        this.particles = [];
        this.platforms = [];
        this.projectiles = [];
        this.backgroundElements = [];
        this.cameraX = 0;
        this.cameraY = 0;
        // Player is recreated externally
        this.player = null;
    }
};

// Expose gameState globally as required
export function getGameState() {
    return gameState;
}
window.getGameState = getGameState;

// Logger initialization helper
export function initLogs(p) {
    p.logs = {
        "game_info": [],
        "inputs": [],
        "player_info": []
    };
}