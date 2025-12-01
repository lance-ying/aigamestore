import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const gameState = {
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2, etc.
    score: 0,
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0,
    
    // Core Three.js objects
    scene: null,
    camera: null,
    renderer: null,
    gameContainer: null,
    
    // Entities
    player: null,
    entities: [], // Generic list
    platforms: [], // For collision
    collectibles: [],
    goal: null,
    
    // Physics
    gravity: new THREE.Vector3(0, -0.03, 0),
    
    // Camera config
    cameraOffset: new THREE.Vector3(0, 6, 8),
    cameraTarget: new THREE.Vector3(0, 0, 0)
};

// Logging system
export const logs = {
    game_info: [],
    player_info: [],
    inputs: []
};
window.logs = logs;

export function getGameState() {
    return gameState;
}
window.getGameState = getGameState;

export const COLORS = {
    background: 0x1a1a2e,
    player: 0x00ffcc, // Neon cyan
    platform: 0x16213e, // Dark blue/grey
    platformEdge: 0x0f3460,
    hazard: 0xe94560, // Neon red
    goal: 0x00ffff,
    collectible: 0xffd700, // Gold
    text: '#ffffff'
};