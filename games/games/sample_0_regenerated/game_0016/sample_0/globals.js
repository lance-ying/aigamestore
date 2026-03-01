/**
 * Aether Rivals: Elemental Duel
 * Global Constants and State Management
 * 
 * This file contains the central game state, configuration constants,
 * and global utility objects used throughout the application.
 */

// ==========================================
// CONFIGURATION CONSTANTS
// ==========================================

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;

// Physics Constants
export const GRAVITY = 0.6;
export const TERMINAL_VELOCITY = 15;
export const FRICTION_GROUND = 0.85;
export const FRICTION_AIR = 0.95;
export const JUMP_FORCE = -12;
export const DOUBLE_JUMP_FORCE = -10;
export const MOVE_SPEED = 6;
export const AIR_MOVE_SPEED = 4;
export const WALL_SLIDE_SPEED = 2;

// Gameplay Constants
export const MAX_STOCKS = 3;
export const RESPAWN_TIME = 120; // Frames
export const INVULNERABILITY_TIME = 180; // Frames
export const HITSTUN_SCALAR = 0.4;
export const KNOCKBACK_SCALAR = 3.0;
export const BLAST_ZONE_PADDING = 100; // Pixels off-screen to die

// Colors (using p5 color arrays for consistency [r, g, b])
export const COLORS = {
    BACKGROUND: [30, 30, 40],
    GROUND: [50, 50, 60],
    PLATFORM: [70, 70, 90],
    UI_TEXT: [240, 240, 240],
    FIRE_PRIMARY: [255, 80, 40],
    FIRE_SECONDARY: [255, 160, 60],
    WATER_PRIMARY: [60, 160, 255],
    WATER_SECONDARY: [150, 200, 255],
    HITBOX: [255, 0, 0, 100], // Transparent red
    HURTBOX: [0, 255, 0, 100], // Transparent green (debug)
    SHIELD: [100, 200, 255, 150]
};

// ==========================================
// GAME STATE
// ==========================================

/**
 * The central state object for the game.
 * Exposed globally via window.getGameState()
 */
export const gameState = {
    // System State
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2, etc.
    frameCount: 0,
    deltaTime: 0,
    lastFrameTime: 0,
    
    // Entities
    player: null,
    enemies: [], // In 1v1, this contains the CPU opponent
    platforms: [],
    projectiles: [],
    particles: [],
    hitboxes: [], // Transient attack volumes
    
    // Match State
    matchTime: 0,
    camera: {
        x: 0,
        y: 0,
        shake: 0
    },
    
    // Helper to reset match specific data
    resetMatch: function() {
        this.player = null;
        this.enemies = [];
        this.projectiles = [];
        this.particles = [];
        this.hitboxes = [];
        this.camera.x = 0;
        this.camera.y = 0;
        this.camera.shake = 0;
        this.matchTime = 0;
    }
};

// Expose globally
window.getGameState = () => gameState;

// Logging Helper
export function logGameEvent(p, type, data) {
    if (p.logs && p.logs.game_info) {
        p.logs.game_info.push({
            type: type,
            data: data,
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    }
}