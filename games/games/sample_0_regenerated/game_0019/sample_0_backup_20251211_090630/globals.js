import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

/**
 * Global Game State Object
 * Holds the entire state of the application
 */
export const gameState = {
    // Core Game Status
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2, etc.
    
    // Score & Stats
    score: 0,
    highScore: 0,
    distance: 0,
    speed: 0,
    baseSpeed: 40.0, // Increased from 15.0
    speedMultiplier: 1.0,

    // Time
    frameCount: 0,
    deltaTime: 0,
    lastTime: 0,
    
    // Three.js Core
    scene: null,
    camera: null,
    renderer: null,
    gameContainer: null,
    
    // Entities
    player: null,
    entities: [], // Generic list for updates
    roadSegments: [],
    obstacles: [], // Balls to collect/avoid
    ramps: [],
    particles: [],
    speedEffect: null,
    
    // Environment
    lights: [],
    
    // Systems
    cameraMode: "chase", // chase, orbit
    cameraOffset: new THREE.Vector3(0, 8, 12),
    gravity: -30.0,
    
    // Level Generation State
    spawnZ: 0, // Z position to spawn next segment
    segmentLength: 20,
    lastRampZ: 0,
    
    // Automated Testing State
    testState: {
        timer: 0,
        stage: 0,
        initialScore: 0
    }
};

// Global Constants
export const COLORS = {
    RED: 0xFF3333,
    GREEN: 0x33FF33,
    BLUE: 0x3333FF,
    YELLOW: 0xFFFF33,
    WHITE: 0xFFFFFF,
    ROAD: 0x222222,
    ROAD_STRIPE: 0x444444,
    BACKGROUND: 0x87CEEB,
    SPEEDLINE: 0xFFFFFF
};

export const COLOR_KEYS = ['RED', 'GREEN', 'BLUE'];

export const GAME_CONSTANTS = {
    LANE_WIDTH: 3.5,
    PLAYER_RADIUS: 0.8,
    BALL_RADIUS: 0.8,
    RAMP_LENGTH: 5,
    RAMP_HEIGHT: 1.5,
    JUMP_FORCE: 25.0, // Increased for higher jumps
    VIEW_DISTANCE: 160 // Increased slightly for higher speed
};

// Logging System
export function initLogs() {
    window.logs = {
        game_info: [],
        player_info: [],
        inputs: []
    };
}

export function logGameInfo(status, data = {}) {
    if (!window.logs) initLogs();
    window.logs.game_info.push({
        game_status: status,
        data: data,
        framecount: gameState.frameCount,
        timestamp: Date.now()
    });
}

export function logPlayerInfo() {
    if (!window.logs) initLogs();
    if (!gameState.player) return;
    
    // Project 3D position to 2D screen space for logging
    const p = gameState.player.mesh.position.clone();
    p.project(gameState.camera);
    
    const x = (p.x * .5 + .5) * 600;
    const y = (-(p.y * .5) + .5) * 400;

    window.logs.player_info.push({
        screen_x: x,
        screen_y: y,
        game_x: gameState.player.mesh.position.x,
        game_y: gameState.player.mesh.position.y,
        game_z: gameState.player.mesh.position.z,
        color: gameState.player.colorName,
        framecount: gameState.frameCount,
        timestamp: Date.now()
    });
}

export function logInput(type, key, keyCode) {
    if (!window.logs) initLogs();
    window.logs.inputs.push({
        input_type: type,
        data: { key, keyCode },
        framecount: gameState.frameCount,
        timestamp: Date.now()
    });
}

// Global Accessor
export function getGameState() {
    return gameState;
}
window.getGameState = getGameState;