import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Game State Object
export const gameState = {
    // Core Phases
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    
    // Entities
    player: null,
    monster: null,
    entities: [], // Environment, particles, etc.
    
    // Three.js Core
    scene: null,
    camera: null,
    renderer: null,
    gameContainer: null,
    
    // Lighting
    lights: [],
    
    // Physics
    gravity: new THREE.Vector3(0, -0.5, 0),
    groundLevel: 0,
    
    // Camera settings
    cameraOffset: new THREE.Vector3(0, 12, 16),
    cameraTarget: new THREE.Vector3(0, 0, 0),
    
    // Time
    frameCount: 0,
    deltaTime: 0,
    lastTime: 0,
    
    // Game Logic
    score: 0,
    controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2, etc.
    keys: {}, // Input state
    
    // Testing
    testTimer: 0
};

// Expose globally
window.getGameState = () => gameState;

// Logging System
window.logs = {
    game_info: [],
    player_info: [],
    inputs: []
};

export function logGameInfo(data) {
    window.logs.game_info.push({
        ...data,
        framecount: gameState.frameCount,
        timestamp: Date.now()
    });
}

export function logPlayerInfo() {
    if (!gameState.player) return;
    
    // Project 3D pos to 2D screen for logging requirements
    const v = gameState.player.mesh.position.clone().project(gameState.camera);
    const screenX = (v.x + 1) * CANVAS_WIDTH / 2;
    const screenY = (-v.y + 1) * CANVAS_HEIGHT / 2;

    window.logs.player_info.push({
        screen_x: screenX,
        screen_y: screenY,
        game_x: gameState.player.mesh.position.x,
        game_y: gameState.player.mesh.position.y,
        game_z: gameState.player.mesh.position.z,
        health: gameState.player.health,
        state: gameState.player.state,
        framecount: gameState.frameCount,
        timestamp: Date.now()
    });
}

export function logInput(type, key, keyCode) {
    window.logs.inputs.push({
        input_type: type,
        data: { key, keyCode },
        framecount: gameState.frameCount,
        timestamp: Date.now()
    });
}