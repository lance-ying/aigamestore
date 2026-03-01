import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const COLORS = {
    BACKGROUND: 0x111111,
    PLAYER: 0xFFFFFF,
    ENEMY: 0xFF3333,
    GEM: 0xFF0044,
    WALL: 0x222222,
    PLATFORM: 0xCCCCCC,
    BULLET: 0xFFFF00,
    TEXT: '#FFFFFF'
};

export const PHYSICS = {
    GRAVITY: -0.015,
    TERMINAL_VELOCITY: -0.8,
    MOVE_SPEED: 0.15,
    JUMP_FORCE: 0.4,
    SHOOT_RECOIL: 0.15, // Upward force when shooting
    FRICTION: 0.85,
    AIR_RESISTANCE: 0.95
};

// Global Game State
export const gameState = {
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN",
    
    // Three.js instances
    scene: null,
    camera: null,
    renderer: null,
    gameContainer: null,
    
    // Game entities
    player: null,
    entities: [],
    platforms: [],
    walls: [], // Array of wall meshes for efficient collision/rendering if needed
    enemies: [],
    collectibles: [],
    projectiles: [],
    particles: [],
    
    // State
    score: 0,
    depth: 0,
    maxDepth: 1000, // Depth to reach to win
    
    // Performance
    frameCount: 0,
    deltaTime: 0,
    
    // Level generation state
    lastGeneratedY: 0,
    
    // Input state
    keys: {}
};

// Expose gameState globally
window.getGameState = () => gameState;

// Initialize Logs
window.logs = {
    game_info: [],
    player_info: [],
    inputs: []
};

// Helper for logging
export function logGameInfo(data) {
    if (window.logs.game_info.length < 1000) { // Limit log size
        window.logs.game_info.push({
            game_status: gameState.gamePhase,
            data: data,
            framecount: gameState.frameCount,
            timestamp: Date.now()
        });
    }
}