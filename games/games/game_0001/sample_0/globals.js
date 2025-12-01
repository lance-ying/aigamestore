export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const gameState = {
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN",
    
    // Time
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0,
    
    // World
    gravity: 0.6,
    baseFriction: 0.85,
    
    // Game Objects
    player: null,
    entities: [],
    platforms: [],
    hazards: [],
    coins: [],
    particles: [],
    
    // Level Management
    currentLevelIndex: 0,
    score: 0,
    totalCoins: 0,
    
    // Camera
    cameraX: 0,
    cameraY: 0,
    cameraShake: 0
};

export const COLORS = {
    background: [30, 35, 40],
    ground: [50, 45, 40],
    spike: [200, 50, 50],
    coin: [255, 215, 0],
    leo: [46, 204, 113], // Emerald green fuzz
    leoInflated: [52, 152, 219],
    leoDeflated: [231, 76, 60],
    text: [255, 255, 255]
};

// Initialize logs structure (to be populated in setup)
export function initLogs(p) {
    p.logs = {
        "game_info": [],
        "inputs": [],
        "player_info": []
    };
}

// Expose gameState globally
export function getGameState() {
    return gameState;
}
window.getGameState = getGameState;