/**
 * globals.js
 * Contains global constants, game state configuration, and the main state object.
 */

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const GRAVITY = 0.6;
export const TERMINAL_VELOCITY = 12;
export const FRICTION = 0.85;
export const AIR_RESISTANCE = 0.95;

// Level Generation Constants
export const TILE_SIZE = 40;
export const LEVEL_LENGTH = 100; // In tiles

// Colors (Neon Palette)
export const COLORS = {
    background: [20, 20, 30],
    player: [0, 255, 255], // Cyan
    playerAccent: [255, 255, 255],
    enemy: [255, 50, 80], // Neon Red/Pink
    enemyFrozen: [100, 200, 255], // Ice Blue
    ground: [40, 40, 60],
    groundTop: [100, 100, 255],
    collectible: [255, 215, 0], // Gold
    portal: [200, 0, 255], // Purple
    projectile: [0, 255, 255],
    text: [255, 255, 255],
    ui: [0, 0, 0, 150]
};

// Global Game State
export const gameState = {
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN",
    
    // Time tracking
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0,
    
    // Camera
    cameraX: 0,
    cameraY: 0,
    cameraShake: 0,
    
    // Game Entities
    player: null,
    entities: [], // Flat list for general updates
    
    // Categorized lists for optimization
    platforms: [],
    enemies: [],
    collectibles: [],
    projectiles: [],
    particles: [],
    decorations: [],
    
    // Level specific
    levelWidth: 0,
    levelHeight: 0,
    goal: null,
    
    // Player Stats (Persisted for session)
    score: 0,
    lives: 3,
    
    // Input State (Shared)
    keys: {},
    
    // Debug/Logging
    debugMode: false
};

// Expose gameState globally
window.getGameState = () => gameState;

// Logging Utility
export function logGameInfo(p, data) {
    if (p.logs && p.logs.game_info) {
        p.logs.game_info.push({
            ...data,
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    }
}