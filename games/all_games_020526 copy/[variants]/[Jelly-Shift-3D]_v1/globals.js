import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const gameState = {
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN",
    
    // Core Three.js
    scene: null,
    camera: null,
    renderer: null,
    gameContainer: null,
    
    // Physics & World
    gravity: new THREE.Vector3(0, -0.02, 0),
    speed: 15.0, // Units per second
    baseSpeed: 15.0,
    
    // Entities
    player: null,
    entities: [], // Generic list for update calls
    obstacles: [],
    collectibles: [],
    ground: null,
    particles: [], // Visual effects
    
    // Game Status
    score: 0,
    distance: 0,
    frameCount: 0,
    deltaTime: 0,
    
    // Lighting
    lights: [],

    // Auto-restart logic
    autoRestartScheduled: false,
    autoRestartTimeoutId: null
};

// Initialize logs for external monitoring
window.logs = {
    game_info: [],
    player_info: [],
    inputs: []
};

// Expose getGameState globally
export function getGameState() {
    return gameState;
}
window.getGameState = getGameState;

// Expose simple p mock for compatibility if needed
window.gameInstance = {
    gameState: gameState
};