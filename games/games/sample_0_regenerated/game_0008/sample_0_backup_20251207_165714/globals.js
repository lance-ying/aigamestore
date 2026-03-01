/**
 * Global constants and state management for Neon Hop
 */

// Canvas dimensions hard constrained
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Game constants
export const WORLD_GRAVITY = -0.05;
export const BOUNCE_FORCE = 0.8;

// Speed and Spacing Logic
export const BASE_SPEED = 0.3125; // Exact sync: 10 units / 32 frames flight time
export function getSpeed(level) {
    // Increase speed by ~6% per level
    return BASE_SPEED + (Math.max(1, level) - 1) * 0.02;
}
export function getSpacing(level) {
    // Physics sync: Distance = Speed * 32 frames (derived from gravity and bounce force)
    return getSpeed(level) * 32;
}

export const LATERAL_SPEED = 0.4;
export const LATERAL_FRICTION = 0.9;
export const MAX_LATERAL_SPEED = 0.5;
export const TILE_SIZE = 4;
// TILE_SPACING removed as constant, use getSpacing(level)

export const WIN_DISTANCE = Infinity; // Endless mode
export const LEVEL_LENGTH = 500; // New level every 500m

// Colors
export const COLOR_BG = 0x110515; // Deep purple/black
export const COLOR_PLAYER = 0x00ffff; // Cyan
export const COLOR_TILE_BASE = 0x2a1a3a;
export const COLOR_TILE_EMISSIVE = 0xff00ff; // Magenta
export const COLOR_COLLECTIBLE = 0xffd700; // Gold

// Level Palettes
export const PALETTES = [
    { base: 0x2a1a3a, emissive: 0xff00ff, bg: 0x110515 }, // Level 1: Neon Purple
    { base: 0x001a33, emissive: 0x00ffff, bg: 0x000510 }, // Level 2: Cyber Blue
    { base: 0x330000, emissive: 0xff3300, bg: 0x1a0500 }, // Level 3: Magma Red
    { base: 0x002200, emissive: 0x33ff00, bg: 0x001100 }, // Level 4: Matrix Green
    { base: 0x222222, emissive: 0xffffff, bg: 0x000000 }, // Level 5: Monochrome
];

// Game State Object
export const gameState = {
    // Core state
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2, TEST_3
    
    // Time tracking
    frameCount: 0,
    deltaTime: 0,
    lastFrameTime: 0,
    startTime: 0,
    
    // Three.js core
    scene: null,
    camera: null,
    renderer: null,
    gameContainer: null,
    
    // Lighting
    lights: [],
    ambientLight: null,
    directionalLight: null,
    
    // Game entities and data
    player: null,
    entities: [],      // Generic entity list for updates
    tiles: [],         // Specific list for platform logic
    collectibles: [],  // Points
    particles: [],     // Visual effects
    
    // Physics
    gravity: { x: 0, y: WORLD_GRAVITY, z: 0 },
    
    // Scoring
    score: 0,
    distance: 0,
    level: 1,
    combo: 0,
    maxCombo: 0,
    
    // Camera state
    cameraOffset: { x: 0, y: 16, z: -25 }, // Further back and higher
    cameraLookAtOffset: { x: 0, y: 0, z: 10 },
    
    // Input state
    keys: {
        ArrowLeft: false,
        ArrowRight: false,
        ArrowUp: false,
        ArrowDown: false,
        KeyA: false,
        KeyD: false,
        KeyW: false,
        KeyS: false,
        Space: false,
        Shift: false,
        KeyZ: false
    }
};

// Global accessor as required
window.getGameState = () => gameState;

// Logging system (write-only)
export const logs = {
    game_info: [],
    player_info: [],
    inputs: []
};
window.logs = logs;

// Helper to log game info
export function logGameInfo(info, data = {}) {
    logs.game_info.push({
        info: info,
        data: data,
        game_status: gameState.gamePhase,
        framecount: gameState.frameCount,
        timestamp: Date.now()
    });
}