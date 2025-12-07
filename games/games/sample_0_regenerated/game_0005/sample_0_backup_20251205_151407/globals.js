/**
 * globals.js
 * Contains global constants, game state, and configuration.
 */

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TILE_SIZE = 40;
export const FPS = 60;

// World Dimensions in Tiles
export const WORLD_COLS = 30; // 1200px wide
export const WORLD_ROWS = 40; // 1600px tall
export const WORLD_WIDTH = WORLD_COLS * TILE_SIZE;
export const WORLD_HEIGHT = WORLD_ROWS * TILE_SIZE;

// Colors
export const COLORS = {
    BACKGROUND: '#1a1a2e',
    TILE_DIRT: '#4a4e69',
    TILE_ROCK: '#22223b',
    TILE_LADDER: '#9a8c98',
    TILE_EXIT: '#f2e9e4',
    PLAYER: '#c9ada7',
    PLAYER_WHIP: '#e07a5f',
    ENEMY_SNAKE: '#81b29a',
    ENEMY_BAT: '#6d597a',
    GOLD: '#f4a261',
    GEM: '#e76f51',
    UI_TEXT: '#ffffff',
    UI_OVERLAY: 'rgba(0, 0, 0, 0.7)'
};

// Physics Constants
export const GRAVITY = 0.6;
export const FRICTION = 0.8;
export const ACCELERATION = 0.8;
export const MAX_SPEED = 6;
export const JUMP_FORCE = -12;
export const LADDER_SPEED = 3;

// Game State
export const gameState = {
    // Phase Management
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2
    
    // Time
    frameCount: 0,
    deltaTime: 0,
    lastFrameTime: 0,
    
    // World
    level: null, // Instance of Level class
    camera: { x: 0, y: 0 },
    
    // Entities
    player: null,
    enemies: [],
    items: [],
    particles: [],
    projectiles: [],
    
    // Stats
    score: 0,
    levelDepth: 1,
    
    // Input State (for logs)
    lastInput: null
};

// Global accessor
window.getGameState = () => gameState;

// Logging Helper
export function logGameInfo(p, data) {
    if (p.logs && p.logs.game_info) {
        p.logs.game_info.push({
            data: data,
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    }
}