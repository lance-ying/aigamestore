export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TILE_SIZE = 40;
export const FRAME_RATE = 60;

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN"; // Technically endless, but maybe reach a target
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";

export const gameState = {
    gamePhase: PHASE_START,
    controlMode: "HUMAN",
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0,
    
    // Game Entities & World
    player: null,
    entities: [],       // Traps, enemies, collectibles
    particles: [],
    
    // World Data
    grid: new Map(),    // Stores static tiles: key "x,y" -> { type: 'floor'|'wall'|'hole' }
    minGenY: 0,         // The furthest north (negative Y) we have generated
    maxGenY: 5,         // The furthest south we keep in memory
    
    // Camera
    cameraX: 0,
    cameraY: 0,
    cameraShake: 0,
    
    // Mechanics
    score: 0,
    coins: 0,
    doomY: 200,         // The Y position of the chasing wall (starts below player)
    doomSpeed: 0.6,     // Pixels per frame
    
    // Input
    inputQueue: [],     // Queue for grid movement to allow buffering
    
    gameSeed: 42
};

// Helper to access state globally
export function getGameState() {
    return gameState;
}
window.getGameState = getGameState;

// Reset function
export function resetGame(p) {
    p.randomSeed(42);
    gameState.gamePhase = PHASE_START;
    gameState.frameCount = 0;
    gameState.entities = [];
    gameState.particles = [];
    gameState.grid.clear();
    gameState.minGenY = 0;
    gameState.maxGenY = 5;
    gameState.score = 0;
    gameState.coins = 0;
    gameState.doomY = 300; // Start comfortably behind
    gameState.doomSpeed = 0.6;
    gameState.inputQueue = [];
    gameState.cameraShake = 0;
    gameState.cameraX = 0;
    gameState.cameraY = 0;
    
    // Player will be re-initialized in the setup of the specific run
}