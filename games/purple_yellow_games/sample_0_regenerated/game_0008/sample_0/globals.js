/**
 * Global constants and state management for Neon Hop
 */

// Canvas dimensions hard constrained
export const CANVAS_WIDTH = 480;
export const CANVAS_HEIGHT = 400;

// Game constants
export const BASE_GRAVITY = -0.05;
export const BASE_BOUNCE_FORCE = 0.8;

// Physics & Difficulty Scaling
export function getGravity(level) {
    // Gravity increases by 10% per level to make bounces snappier/faster rhythm
    return BASE_GRAVITY * (1 + (Math.max(1, level) - 1) * 0.1);
}

export function getBounceForce(level) {
    // Scale bounce force by sqrt of gravity scale to maintain roughly consistent jump height
    // Height ~ v^2 / g. If g scales by S, v^2 must scale by S, so v scales by sqrt(S).
    const gravityScale = 1 + (Math.max(1, level) - 1) * 0.1;
    return BASE_BOUNCE_FORCE * Math.sqrt(gravityScale);
}

export const BASE_SPEED = 0.3125; 

export function getSpeed(level) {
    // Increase speed by ~8% per level (was 2%)
    // This combined with faster gravity makes the game significantly faster
    return BASE_SPEED + (Math.max(1, level) - 1) * 0.04;
}

export function getSpacing(level) {
    // Physics sync: Distance = Speed * FlightTime
    // FlightTime = 2 * Vy / |g| (in frames)
    const g = Math.abs(getGravity(level));
    const vy = getBounceForce(level);
    const flightTime = (2 * vy) / g;
    
    return getSpeed(level) * flightTime;
}

export const LATERAL_SPEED = 0.4;
export const LATERAL_FRICTION = 0.9;
export const MAX_LATERAL_SPEED = 0.5;
export const TILE_SIZE = 6;

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
    gravity: { x: 0, y: BASE_GRAVITY, z: 0 }, // Initial value, updated by getGravity logic
    
    // Scoring
    score: 0,
    distance: 0,
    level: 1,
    combo: 0,
    maxCombo: 0,
    
    // Camera state
    cameraOffset: { x: 0, y: 12, z: -18 }, 
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