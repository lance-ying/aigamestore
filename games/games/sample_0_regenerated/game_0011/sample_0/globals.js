import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

// Game Configuration
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const LANE_WIDTH = 3.0;
export const LANE_COUNT = 3;
export const GRAVITY = -0.015; // Adjusted for snappy feel
export const JUMP_FORCE = 0.35;
export const SLIDE_DURATION = 0.8; // Seconds
export const BASE_SPEED = 0.2;
export const MAX_SPEED = 0.6;
export const SPEED_INCREMENT = 0.00005; // Speed increase per frame
export const SEGMENT_LENGTH = 10;
export const VISIBILITY_DISTANCE = 100;

// Global Game State
export const gameState = {
    // Phase
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2

    // Core Three.js
    scene: null,
    camera: null,
    renderer: null,
    gameContainer: null,
    
    // Lighting
    ambientLight: null,
    directionalLight: null,
    lights: [],

    // Game Objects
    player: null,
    demon: null,
    segments: [], // Track segments
    obstacles: [],
    coins: [],
    decorations: [],

    // Physics & Logic
    gravity: new THREE.Vector3(0, GRAVITY, 0),
    runSpeed: BASE_SPEED,
    score: 0,
    coinsCollected: 0,
    distanceTraveled: 0,
    
    // Time
    frameCount: 0,
    deltaTime: 0,
    time: 0,

    // Testing
    testTimer: 0
};

// Expose gameState globally
export function getGameState() {
    return gameState;
}
window.getGameState = getGameState;

// Logging System
export const logs = {
    game_info: [],
    player_info: [],
    inputs: []
};
window.logs = logs;

export function logGameInfo(info) {
    logs.game_info.push({
        ...info,
        framecount: gameState.frameCount,
        timestamp: Date.now()
    });
}

export function logInput(type, key, code) {
    logs.inputs.push({
        input_type: type,
        data: { key, keyCode: code },
        framecount: gameState.frameCount,
        timestamp: Date.now()
    });
}

export function logPlayerInfo() {
    if (!gameState.player) return;
    const pos = gameState.player.mesh.position;
    logs.player_info.push({
        game_x: pos.x,
        game_y: pos.y,
        game_z: pos.z,
        lane: gameState.player.currentLane,
        state: gameState.player.state,
        framecount: gameState.frameCount,
        timestamp: Date.now()
    });
}