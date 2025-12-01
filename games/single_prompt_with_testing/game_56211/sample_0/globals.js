export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const gameState = {
    player: null,
    entities: [],
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_LOSE
    controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2
    
    score: 0,
    distance: 0,
    highScore: 0,
    
    // Physics & World
    gravity: 0.6,
    scrollSpeed: 5,
    difficultyMultiplier: 1,
    
    // Entity Management
    obstacles: [],
    coins: [],
    particles: [],
    projectiles: [], // Bullets from jetpack
    
    // Systems
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0,
    
    // Camera/Shake
    shakeTimer: 0,
    shakeIntensity: 0
};

export function getGameState() {
    return gameState;
}

// Expose globally
window.getGameState = getGameState;

export function resetGameState() {
    gameState.gamePhase = "START";
    gameState.score = 0;
    gameState.distance = 0;
    gameState.scrollSpeed = 5;
    gameState.difficultyMultiplier = 1;
    gameState.obstacles = [];
    gameState.coins = [];
    gameState.particles = [];
    gameState.projectiles = [];
    gameState.shakeTimer = 0;
    gameState.entities = [];
    // Player is re-initialized separately
}