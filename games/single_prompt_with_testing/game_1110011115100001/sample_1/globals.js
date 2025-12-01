export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GRAVITY = 0.6;
export const FRICTION = 0.8;
export const MOVE_SPEED = 5;
export const JUMP_FORCE = -12;

export const COLORS = {
    BACKGROUND: [20, 20, 25],
    TEXT: [200, 200, 200],
    PLAYER: [255, 255, 255],
    ENEMY: [255, 50, 50],
    STONE: [0, 255, 255], // Cyan for Soul Stones
    PLATFORM: [100, 100, 100],
    GROUND: [50, 50, 60],
    PARTICLE: [255, 255, 100]
};

export const gameState = {
    player: null,
    entities: [], // Enemies, particles, projectiles
    platforms: [],
    collectibles: [],
    score: 0,
    stonesCollected: 0,
    totalStones: 0,
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2, TEST_3
    
    // Camera
    cameraX: 0,
    cameraY: 0,
    
    // Performance
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0,
    
    // Input state snapshot for logic
    keys: {}
};

export function getGameState() {
    return gameState;
}

// Expose globally
window.getGameState = getGameState;