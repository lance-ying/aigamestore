/**
 * Global constants and game state management
 */

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TILE_SIZE = 40;
export const PLAYER_SPEED = 4;
export const DASH_SPEED = 12;
export const WALL_OF_DOOM_SPEED = 1.5; // Speed at which the death wall chases
export const VIEWPORT_PADDING = 200; // Buffer for generating new chunks

// Game State Object
export const gameState = {
    // Core state
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2, etc.
    
    // Stats
    score: 0,
    distance: 0,
    highScore: 0,
    
    // Entities
    player: null,
    entities: [], // Generic list for updates
    walls: [], // Static walls
    traps: [], // Spikes, saws
    enemies: [], // Moving enemies
    coins: [], // Collectibles
    particles: [], // Visual effects
    
    // World generation
    cameraY: 0, // Vertical scroll position
    generatedY: 0, // How far up we have generated the world
    wallOfDoomY: 0, // Y position of the chasing wall
    
    // Time
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0,
    
    // Inputs (for automated testing logging)
    lastInput: null
};

export function getGameState() {
    return gameState;
}

// Expose globally
window.getGameState = getGameState;

export function resetGame() {
    gameState.gamePhase = "START";
    gameState.score = 0;
    gameState.distance = 0;
    gameState.entities = [];
    gameState.walls = [];
    gameState.traps = [];
    gameState.enemies = [];
    gameState.coins = [];
    gameState.particles = [];
    gameState.cameraY = 0;
    gameState.generatedY = 0;
    gameState.wallOfDoomY = 400; // Start below screen
    gameState.frameCount = 0;
}