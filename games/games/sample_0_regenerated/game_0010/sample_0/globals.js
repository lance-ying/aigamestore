import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const gameState = {
    // Core state
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2, TEST_3
    
    // Three.js objects
    scene: null,
    camera: null,
    renderer: null,
    gameContainer: null,
    
    // Lighting
    lights: [],
    ambientLight: null,
    directionalLight: null,
    
    // Physics & Time
    gravity: new THREE.Vector3(0, -0.5, 0),
    deltaTime: 0,
    frameCount: 0,
    lastFrameTime: 0,
    
    // Game Entities
    player: null,
    palico: null,
    monster: null,
    entities: [],     // All updateable entities
    collidables: [],  // Static environment for collisions
    particles: [],    // Visual effects
    
    // Game Logic
    score: 0,
    environmentBounds: { x: 40, z: 40 }, // Arena size radius
    rng: null, // Seeded RNG
};

// Global Logs for reproducibility and debugging
export const logs = {
    game_info: [],
    player_info: [],
    inputs: []
};

// Expose gameState globally
window.getGameState = () => gameState;
window.gameInstance = gameState;
window.logs = logs;

// Control Mode Setter for Testing
window.setControlMode = (mode) => {
    gameState.controlMode = mode;
    console.log(`Control mode set to: ${mode}`);
    // If setting a test mode, we might want to restart to ensure clean state
    if (mode.startsWith("TEST")) {
         // Trigger a restart if game is running to apply test conditions cleanly
         // Implementation handled in game.js input listener or manually triggered
    }
};

// Colors
export const COLORS = {
    SKY: 0x87CEEB,
    GROUND: 0x3a5f0b,
    PLAYER: 0x3366cc,
    PLAYER_ARMOR: 0x555555,
    MONSTER_SKIN: 0x8b0000,
    MONSTER_SCALE: 0x330000,
    PALICO: 0xeebb99,
    ROCK: 0x777777,
    TREE_TRUNK: 0x5c4033,
    TREE_LEAVES: 0x228b22
};

// Utility to reset game state variables
export function resetGameState() {
    gameState.entities = [];
    gameState.collidables = [];
    gameState.particles = [];
    gameState.lights = [];
    gameState.score = 0;
    gameState.gamePhase = "START";
}