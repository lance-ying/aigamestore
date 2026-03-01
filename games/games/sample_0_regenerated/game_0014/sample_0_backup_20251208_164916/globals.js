/**
 * globals.js
 * Contains global constants, game state structure, and shared utilities.
 */

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const FPS = 60;

// Game Balance Constants
export const GRAVITY = 0.6;
export const TERMINAL_VELOCITY = 12;
export const DIFFICULTY_SCALING_RATE = 0.0005; // Difficulty increase per frame
export const BASE_ENEMY_CREDIT_RATE = 0.5; // Base credits/frame for enemy spawning

// Entity Constants
export const TILE_SIZE = 40;
export const PLAYER_WIDTH = 20;
export const PLAYER_HEIGHT = 36;

// Colors
export const COLORS = {
    background: [25, 20, 30],
    ground: [60, 50, 70],
    player: [255, 200, 50],
    player_secondary: [255, 255, 255],
    enemy_basic: [200, 60, 60],
    enemy_flying: [60, 200, 200],
    enemy_boss: [200, 40, 40],
    chest: [200, 160, 40],
    teleporter: [200, 50, 50],
    teleporter_active: [255, 100, 100],
    projectile: [255, 255, 150],
    text: [240, 240, 240],
    ui_bg: [0, 0, 0, 150]
};

// Global Game State
export const gameState = {
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN",
    
    // Time & Difficulty
    frameCount: 0,
    time: 0, // In seconds
    difficultyCoeff: 1.0,
    directorCredits: 0, // Credits for spawning enemies
    
    // World
    camera: { x: 0, y: 0 },
    worldWidth: 2000,
    worldHeight: 1000,
    
    // Entities
    player: null,
    platforms: [],
    enemies: [],
    projectiles: [],
    particles: [],
    interactables: [], // Chests, Teleporter
    
    // Teleporter Event State
    teleporter: null,
    teleporterState: "IDLE", // IDLE, CHARGING, CHARGED
    teleporterCharge: 0, // 0 to 100
    
    // Player Stats specific for UI (synced from player entity)
    money: 0,
    score: 0,
    items: {}, // Map of ItemID -> Count
    
    // Performance
    deltaTime: 0,
    lastFrameTime: 0
};

// Expose globally
window.getGameState = () => gameState;

// Logging Helper
export function logGameEvent(p, type, data) {
    if (!p.logs) return;
    
    const entry = {
        type: type,
        data: data,
        framecount: p.frameCount,
        timestamp: Date.now()
    };

    if (type === 'input') p.logs.inputs.push(entry);
    else if (type === 'player') p.logs.player_info.push(entry);
    else p.logs.game_info.push(entry);
}