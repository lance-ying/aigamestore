/**
 * Global constants and state management for Zenonia 4 Demake.
 */

// Canvas Dimensions
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// World Dimensions (2x2 screens roughly)
export const WORLD_WIDTH = 1200;
export const WORLD_HEIGHT = 800;

// Game Configuration
export const FPS = 60;
export const GRAVITY = 0; // Top down RPG, no gravity
export const FRICTION = 0.85;

// Colors
export const COLORS = {
    background: [30, 35, 40],
    ground: [45, 50, 40],
    ui_bg: [0, 0, 0, 150],
    text: [255, 255, 255],
    hp_bar: [220, 40, 40],
    xp_bar: [40, 220, 220],
    mp_bar: [40, 40, 220],
    damage_text: [255, 255, 255],
    crit_text: [255, 255, 0],
    heal_text: [0, 255, 0]
};

// Initial Game State
export const gameState = {
    // Phase
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2, TEST_3
    
    // Time
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0,
    
    // Camera
    camera: {
        x: 0,
        y: 0,
        shake: 0
    },
    
    // Entities lists
    player: null,
    enemies: [],
    projectiles: [],
    particles: [], // Effects, floating text
    items: [], // Dropped loot
    walls: [], // Static collision objects
    
    // Gameplay Stats
    score: 0,
    killCount: 0,
    level: 1,
    
    // Input State (for decoupled logic)
    inputs: {
        up: false,
        down: false,
        left: false,
        right: false,
        attack: false,
        skill: false,
        dash: false
    }
};

/**
 * Initializes the game state logs.
 * NOTE: Logs are write-only and persist through restarts.
 */
export function initLogs(p) {
    p.logs = {
        "game_info": [],
        "inputs": [],
        "player_info": []
    };
}

/**
 * Reset game state for a new game.
 * Keeps controlMode and logs intact.
 */
export function resetGameState() {
    gameState.gamePhase = "START";
    gameState.frameCount = 0;
    gameState.score = 0;
    gameState.killCount = 0;
    
    gameState.player = null;
    gameState.enemies = [];
    gameState.projectiles = [];
    gameState.particles = [];
    gameState.items = [];
    gameState.walls = [];
    
    gameState.camera.x = 0;
    gameState.camera.y = 0;
    gameState.camera.shake = 0;
}

// Expose global accessor
window.getGameState = () => gameState;