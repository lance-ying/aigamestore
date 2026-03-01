/**
 * Global constants and state management for Neon Hop
 */

// Canvas dimensions hard constrained
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Game constants
export const WORLD_GRAVITY = -0.05;
export const BOUNCE_FORCE = 0.8;
export const FORWARD_SPEED = 0.3;
export const LATERAL_SPEED = 0.4;
export const LATERAL_FRICTION = 0.9;
export const MAX_LATERAL_SPEED = 0.5;
export const TILE_SIZE = 4;
export const TILE_SPACING = 10;
export const WIN_DISTANCE = 1000;

// Colors
export const COLOR_BG = 0x110515; // Deep purple/black
export const COLOR_PLAYER = 0x00ffff; // Cyan
export const COLOR_TILE_BASE = 0x2a1a3a;
export const COLOR_TILE_EMISSIVE = 0xff00ff; // Magenta
export const COLOR_COLLECTIBLE = 0xffd700; // Gold

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
    combo: 0,
    maxCombo: 0,
    
    // Camera state
    cameraOffset: { x: 0, y: 12, z: -15 }, // Behind and up
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