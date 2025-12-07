/**
 * Global constants and state management for Vertical Venture.
 * Contains configuration for physics, canvas, and game balance.
 */

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Game Balance Constants
export const GRAVITY = 0.4;
export const TERMINAL_VELOCITY = 12;
export const PLAYER_SPEED = 5;
export const JUMP_FORCE = -8;
export const GUN_RECOIL = 3; // Upward force when shooting
export const GUN_AMMO_MAX = 8;
export const INVULNERABILITY_FRAMES = 60;
export const WIN_DEPTH = 5000; // Depth required to win

// Colors
export const COLORS = {
    BACKGROUND: '#121216',
    PLAYER: '#40E0D0', // Turquoise
    PLAYER_HURT: '#FFFFFF',
    ENEMY_FLYER: '#FF4040',
    ENEMY_CRAWLER: '#FF8040',
    PLATFORM: '#EEEEEE',
    PLATFORM_BREAKABLE: '#A0A0A0',
    GEM: '#FF2060',
    PROJECTILE: '#FFFFAA',
    UI_TEXT: '#FFFFFF',
    UI_BAR_BG: '#444444',
    UI_BAR_FILL: '#FF4040'
};

// Game State Object
export const gameState = {
    // Phase management
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2

    // Main entities
    player: null,
    
    // Entity Collections
    entities: [],      // All generic entities for updates
    platforms: [],     // Collision geometry
    enemies: [],       // Hostiles
    projectiles: [],   // Player bullets
    collectibles: [],  // Gems
    particles: [],     // Visual effects
    
    // World State
    cameraY: 0,
    worldGeneratedDepth: 0,
    score: 0,
    depth: 0,
    combo: 0,
    
    // Timing and Performance
    frameCount: 0,
    deltaTime: 0,
    lastFrameTime: 0,
    
    // Input State
    keys: {}
};

/**
 * Returns the global game state.
 * Exposed to window for debugging and external access.
 */
export function getGameState() {
    return gameState;
}

// Expose globally
window.getGameState = getGameState;