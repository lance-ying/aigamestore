// Game Constants
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;

// Dimensions
export const TILE_SIZE = 25;
export const PLAYER_SIZE = 20;
export const PLAYER_SPEED = 18; // Pixels per frame during dash

// Colors (Neon Palette)
export const COLORS = {
    BACKGROUND: '#1a1a2e',
    WALL: '#16213e',
    WALL_STROKE: '#0f3460',
    PLAYER: '#e94560',
    PLAYER_MASK: '#ffd700',
    COIN: '#f9a826',
    SPIKE: '#ff0040',
    ENEMY: '#533483',
    TIDE: '#e94560aa', // Transparent red
    TEXT: '#ffffff',
    SHIELD: '#00ffff'
};

// Global Game State
export const gameState = {
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2, etc.
    
    // Core Gameplay Data
    player: null,
    score: 0,
    highScore: 0,
    coins: 0,
    
    // World Data
    entities: [], // Flat list for updates/rendering
    map: {}, // Spatial hash map for tiles: "x,y" -> Type
    activeChunks: [], // Track generated chunks
    cameraY: 0, // Vertical scroll position
    tideY: 0, // Rising death wall Y position
    tideSpeed: 1.0,
    
    // Input Buffer
    queuedMove: null, // Stores the next move if pressed while moving
    
    // Frame Timing
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0
};

// Initialize logs structure (Write-Only)
export function initLogs(p) {
    p.logs = {
        "game_info": [],
        "inputs": [],
        "player_info": []
    };
}

// Global Accessor
export function getGameState() {
    return gameState;
}
window.getGameState = getGameState;