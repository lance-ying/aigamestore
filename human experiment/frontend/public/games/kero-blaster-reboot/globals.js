/**
 * globals.js
 * Contains global constants, game state definitions, and shared utility objects.
 */

// ------------------------------------------------------------------
// Constants
// ------------------------------------------------------------------

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const FPS = 60;

// Physics Constants
export const GRAVITY = 0.6;
export const TERMINAL_VELOCITY = 12;
export const FRICTION = 0.85;
export const AIR_RESISTANCE = 0.95;

// Player Constants
export const PLAYER_SPEED = 4;
export const PLAYER_JUMP_FORCE = -11;
export const PLAYER_MAX_HEALTH = 100;
export const INVULNERABILITY_FRAMES = 60;

// World Constants
export const TILE_SIZE = 40;

// Colors (R, G, B)
export const COLORS = {
    BACKGROUND: [30, 30, 40],
    GROUND: [60, 60, 75],
    GROUND_TOP: [80, 80, 100],
    PLAYER: [100, 200, 100],
    PLAYER_HURT: [200, 100, 100],
    ENEMY_SLIME: [40, 40, 40],
    ENEMY_FLYER: [60, 20, 60],
    PROJECTILE_PLAYER: [255, 255, 100],
    PROJECTILE_ENEMY: [255, 50, 50],
    TELEPORTER: [100, 255, 255],
    UI_TEXT: [255, 255, 255],
    UI_BAR_BG: [50, 0, 0],
    UI_BAR_FILL: [0, 200, 0]
};

// ------------------------------------------------------------------
// Game State
// ------------------------------------------------------------------

/**
 * The central game state object.
 * Modified by game logic, read by renderers and automated tests.
 */
export const gameState = {
    // Phase Management
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2

    // Time
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0,

    // Entities
    player: null,
    entities: [],     // All active game objects
    particles: [],    // Visual effects
    tiles: [],        // Static level geometry
    projectiles: [],  // Moving bullets

    // Camera
    cameraX: 0,
    cameraY: 0,
    worldWidth: 0,    // Total width of the current level
    shakeTimer: 0,    // Screen shake duration
    shakeAmount: 0,   // Screen shake intensity

    // Progression
    score: 0,
    levelIndex: 0,

    // Helper to get all enemies
    getEnemies: function() {
        return this.entities.filter(e => e.type === 'ENEMY');
    }
};

/**
 * Expose gameState globally for debugging and testing constraints.
 */
export function getGameState() {
    return gameState;
}
window.getGameState = getGameState;

/**
 * Logger utility to satisfy write-only log constraints.
 */
export const Logger = {
    logGameInfo: (p, info) => {
        if (!p.logs) return;
        p.logs.game_info.push({
            data: info,
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    },
    logInput: (p, type, keyData) => {
        if (!p.logs) return;
        p.logs.inputs.push({
            input_type: type,
            data: keyData,
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    },
    logPlayer: (p, player) => {
        if (!p.logs || !player) return;
        // Log periodically to avoid flooding memory, e.g., every 60 frames
        if (p.frameCount % 60 === 0) {
            p.logs.player_info.push({
                screen_x: player.x - gameState.cameraX,
                screen_y: player.y,
                game_x: player.x,
                game_y: player.y,
                health: player.health,
                framecount: p.frameCount,
                timestamp: Date.now()
            });
        }
    }
};