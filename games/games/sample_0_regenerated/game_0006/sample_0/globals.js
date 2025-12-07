// globals.js
// Contains constants, game state, and configuration

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TILE_SIZE = 40;
export const WORLD_WIDTH_TILES = 40;
export const WORLD_HEIGHT_TILES = 30; // Deep levels
export const GRAVITY = 0.6;
export const TERMINAL_VELOCITY = 12;

// Colors
export const COLORS = {
    BACKGROUND: '#1a1a24', // Dark cave background
    WALL: '#5d4037',      // Brown dirt/rock
    WALL_DARK: '#3e2723',
    PLAYER: '#ffeb3b',    // Yellow spelunker
    SNAKE: '#4caf50',     // Green snake
    BAT: '#7e57c2',       // Purple bat
    GOLD: '#ffd700',      // Gold
    GEM: '#e91e63',       // Pink gem
    EXIT: '#ffffff',      // White door
    UI_BG: '#000000',
    TEXT: '#ffffff'
};

// Global Game State
export const gameState = {
    // System
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE, TRANSITION
    controlMode: "HUMAN",
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0,
    debugMode: false,

    // World
    currentLevel: 1,
    levelMap: [], // 2D array of tile IDs: 0=empty, 1=wall, 2=ladder, 3=water
    camera: { x: 0, y: 0 },
    
    // Entities
    player: null,
    entities: [], // Enemies, items, particles, projectiles
    particles: [],
    
    // Stats
    score: 0,
    money: 0,
    timeInLevel: 0, // For Ghost mechanic
    
    // Testing
    autoTestFrame: 0
};

// Expose globally
window.getGameState = () => gameState;

// Logging function helper
export function logGameInfo(p, data) {
    if (p.logs && p.logs.game_info) {
        p.logs.game_info.push({
            data: data,
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    }
}

export function resetGameState() {
    gameState.gamePhase = "START";
    gameState.score = 0;
    gameState.money = 0;
    gameState.currentLevel = 1;
    gameState.entities = [];
    gameState.particles = [];
    gameState.player = null;
    gameState.timeInLevel = 0;
    gameState.camera = { x: 0, y: 0 };
}