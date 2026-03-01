import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

// Game Constants
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TUNNEL_RADIUS = 5;
export const PLAYER_RADIUS = 0.4;
export const GRAVITY = 0.015;
export const JUMP_FORCE = 0.35;
export const BASE_SPEED = 0.12; // Reduced from 0.15
export const ROTATION_SPEED = 0.05;
export const LANE_TOLERANCE = 0.5; // Angle tolerance for landing on platform (radians)

// Global Game State
export const gameState = {
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2, etc.
    
    // Core Three.js components
    scene: null,
    camera: null,
    renderer: null,
    gameContainer: null,
    
    // Lighting
    lights: [],
    ambientLight: null,
    directionalLight: null,
    
    // Game Entities & Data
    player: null,
    platformManager: null,
    collectibleManager: null,
    particleSystem: null,
    
    // Dynamic Game Variables
    score: 0,
    distanceTraveled: 0,
    currentSpeed: BASE_SPEED,
    worldRotation: 0, // The rotation angle of the tunnel
    
    // Frame Timing
    frameCount: 0,
    deltaTime: 0,
    time: 0,
    
    // Testing Flags
    testActive: false,
    testState: {}
};

// Expose gameState globally
export function getGameState() {
    return gameState;
}
window.getGameState = getGameState;

// Logging System (Write-only)
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

export function logPlayerInfo(player) {
    if (!player) return;
    logs.player_info.push({
        game_x: player.mesh.position.x,
        game_y: player.mesh.position.y,
        game_z: player.mesh.position.z,
        world_rotation: gameState.worldRotation,
        velocity_y: player.velocity.y,
        grounded: player.onGround,
        framecount: gameState.frameCount,
        timestamp: Date.now()
    });
}

export function logInput(type, key, code) {
    logs.inputs.push({
        input_type: type,
        data: { key, code },
        framecount: gameState.frameCount,
        timestamp: Date.now()
    });
}