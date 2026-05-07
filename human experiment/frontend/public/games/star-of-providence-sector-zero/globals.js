/**
 * globals.js
 * Contains global constants, game state definition, and initialization logic.
 */

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;

// Game constants
export const TILE_SIZE = 40;
export const PLAYER_SPEED = 4;
export const PLAYER_FOCUS_SPEED = 2;
export const PLAYER_DASH_SPEED = 12;
export const PLAYER_DASH_DURATION = 10; // frames
export const PLAYER_DASH_COOLDOWN = 45; // frames
export const PLAYER_MAX_HEALTH = 250;

export const COLOR_PALETTE = {
    background: [20, 20, 25],
    wall: [60, 60, 70],
    wallHighlight: [80, 80, 90],
    floor: [30, 30, 35],
    player: [0, 200, 255],
    playerHit: [255, 255, 255],
    enemy: [255, 50, 50],
    enemyWeak: [255, 100, 100],
    enemyElite: [200, 0, 0],
    projectilePlayer: [100, 255, 255],
    projectileEnemy: [255, 100, 100],
    pickup: [50, 255, 50],
    doorLocked: [255, 0, 0],
    doorOpen: [0, 255, 0],
    text: [255, 255, 255]
};

// The global game state object
export const gameState = {
    // Core state
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN", // HUMAN
    frameCount: 0,
    deltaTime: 0,
    lastFrameTime: 0,
    
    // Level state
    currentFloor: 1,
    maxFloors: 5,
    score: 0,
    
    // Entities
    player: null,
    entities: [],     // All updateable/renderable entities mixed
    enemies: [],      // Specific references for logic
    projectiles: [],
    walls: [],        // Static colliders
    pickups: [],
    particles: [],
    
    // World state
    door: null,       // The exit door entity
    roomCleared: false,
    cameraShake: 0,
    
    // Testing flags (removed: godMode, autoAim)
};

// Initialize logs structure (write-only)
export function initLogs(p) {
    p.logs = {
        "game_info": [],
        "inputs": [],
        "player_info": []
    };
}

// Expose state globally
export function getGameState() {
    return gameState;
}
window.getGameState = getGameState;

export function resetGameState() {
    gameState.gamePhase = "START";
    gameState.frameCount = 0;
    gameState.score = 0;
    gameState.currentFloor = 1;
    gameState.roomCleared = false;
    gameState.cameraShake = 0;
    
    gameState.entities = [];
    gameState.enemies = [];
    gameState.projectiles = [];
    gameState.walls = [];
    gameState.pickups = [];
    gameState.particles = [];
    gameState.player = null;
    gameState.door = null;
    // Removed: gameState.godMode = false;
}