export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Physics Constants
export const GRAVITY = 0.6;
export const JUMP_FORCE = -11;
export const MOVE_SPEED = 5; // Auto-run speed
export const TERMINAL_VELOCITY = 12;

// Game World
export const GROUND_Y = 350; // Visual ground level (though platforms define physics)
export const LEVEL_LENGTH = 5000; // Distance to win

// Global State container
export const gameState = {
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2, TEST_3
    
    // Entities
    player: null,
    platforms: [],
    enemies: [],
    collectibles: [],
    particles: [],
    decorations: [], // Clouds, bushes
    
    // Camera
    cameraX: 0,
    cameraY: 0,
    
    // Stats
    score: 0,
    coins: 0,
    distanceTraveled: 0,
    
    // Time
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0,
    
    // Input state snapshot for tests
    keys: {}
};

// Initialize logs structure
export function initLogs(p) {
    p.logs = {
        "game_info": [],
        "inputs": [],
        "player_info": []
    };
}

// Expose gameState globally
window.getGameState = () => gameState;