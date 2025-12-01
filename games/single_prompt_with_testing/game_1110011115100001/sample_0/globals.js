import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const gameState = {
    // Core state
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    frameCount: 0,
    lastTime: 0,
    deltaTime: 0,
    controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2, etc.
    
    // Three.js instances
    scene: null,
    camera: null,
    renderer: null,
    gameContainer: null,
    
    // Lighting & Environment
    ambientLight: null,
    spotLight: null,
    
    // Game Entities
    player: null,
    entities: [],     // All generic entities
    enemies: [],
    particles: [],
    projectiles: [],
    collectibles: [],
    platforms: [],
    
    // Game Progression
    score: 0,
    stonesCollected: 0,
    totalStones: 9,
    distanceTraveled: 0,
    levelLength: 200, // Distance to boss/end
    
    // Physics
    gravity: new THREE.Vector3(0, -0.04, 0),
    groundY: -2,
    
    // Camera settings
    cameraOffset: new THREE.Vector3(0, 4, 12),
    cameraTarget: new THREE.Vector3(0, 0, 0)
};

// Initialize logs structure
window.logs = {
    game_info: [],
    player_info: [],
    inputs: []
};

export function getGameState() {
    return gameState;
}

// Expose globally
window.getGameState = getGameState;