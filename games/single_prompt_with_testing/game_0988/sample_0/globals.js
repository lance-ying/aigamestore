/**
 * globals.js
 * Contains global game state, constants, and configuration.
 */

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const GROUND_Y = 340; // Y position of the floor

// Colors palette (Retro 8-bit style)
export const COLORS = {
    background: [20, 20, 30],
    ground: [40, 30, 20],
    groundTop: [60, 100, 40],
    ui: [255, 255, 255],
    text: [240, 240, 240],
    hero: {
        body: [50, 100, 200],
        skin: [255, 200, 150],
        armor: [200, 200, 200]
    },
    enemy: {
        slime: [100, 220, 50],
        bat: [180, 50, 50],
        skeleton: [220, 220, 220],
        boss: [150, 0, 200]
    },
    items: {
        coin: [255, 215, 0],
        potion: [255, 50, 50],
        gem: [0, 200, 255]
    },
    damage: [255, 255, 255],
    crit: [255, 255, 0],
    heal: [50, 255, 50]
};

// Game State Object
export const gameState = {
    // Phases: START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    gamePhase: "START",
    controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2, etc.
    
    // Core entities
    player: null,
    entities: [],     // All active game objects (enemies, items)
    particles: [],    // Visual effects
    floatingTexts: [], // Damage numbers, messages
    
    // World state
    gravity: 0.8,
    friction: 0.85,
    cameraShake: 0,
    
    // Progression
    score: 0,
    highScore: 0,
    level: 1,
    wave: 1,
    killCount: 0,
    difficultyMultiplier: 1.0,
    
    // Spawner state
    spawnTimer: 0,
    nextSpawnTime: 60,
    bossActive: false,
    
    // Input state helpers
    keys: {},
    
    // Performance / Time
    frameCount: 0,
    deltaTime: 0,
    lastFrameTime: 0,
    
    // Debug / Logging
    debugMode: false
};

// Global function to access state
export function getGameState() {
    return gameState;
}

// Ensure global access for tests
if (typeof window !== 'undefined') {
    window.getGameState = getGameState;
}