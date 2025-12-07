/**
 * globals.js
 * Contains global constants, game state, and logging configuration.
 */

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TILE_SIZE = 40;
export const FPS = 60;

// Game Colors (Retro Palette)
export const COLORS = {
    BACKGROUND: '#222034',
    WALL: '#45283c',
    WALL_TOP: '#663931',
    PLAYER: '#ac3232',
    PLAYER_ACCENT: '#d95763',
    ENEMY: '#595652',
    ENEMY_EYE: '#639bff',
    COIN: '#fbf236',
    SPIKE: '#df7126',
    TEXT: '#ffffff',
    HUD_BG: '#000000',
    EXIT: '#99e550',
    PARTICLE: ['#ffffff', '#fbf236', '#d95763', '#99e550']
};

// Physics Constants
export const PHYSICS = {
    GRAVITY: 0.6,
    FRICTION: 0.85,
    AIR_RESISTANCE: 0.95,
    MAX_SPEED_X: 6,
    MAX_SPEED_Y: 12,
    JUMP_FORCE: -11,
    JUMP_HOLD_FORCE: -0.5, // Added force while holding jump
    DASH_SPEED: 12,
    COYOTE_TIME: 10, // Frames allowed to jump after leaving ground
    BUFFER_TIME: 8   // Frames to buffer jump input before hitting ground
};

// Global Game State
export const gameState = {
    // Core state
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2
    
    // Time tracking
    frameCount: 0,
    deltaTime: 0,
    lastFrameTime: 0,
    
    // Gameplay data
    player: null,
    currentRoom: null, // The TileMap object
    entities: [],      // Dynamic entities (enemies, projectiles)
    particles: [],     // Visual effects
    
    // Stats
    score: 0,
    roomsCleared: 0,
    lives: 3,
    maxLives: 3,
    
    // Camera / Transition
    cameraShake: 0,
    transitionAlpha: 0,
    isTransitioning: false,
    nextRoomDirection: null,
    
    // Input state helpers
    keys: {}
};

// Expose gameState globally
export function getGameState() {
    return gameState;
}
window.getGameState = getGameState;

// Logging Helper
export function logGameEvent(p, type, data) {
    if (!p.logs) return;
    
    const entry = {
        type: type,
        data: data,
        frame: p.frameCount,
        timestamp: Date.now()
    };
    
    // Push to appropriate log array
    if (type === 'input') {
        p.logs.inputs.push(entry);
    } else if (type === 'player') {
        p.logs.player_info.push(entry);
    } else {
        p.logs.game_info.push(entry);
    }
}