// globals.js - Game constants and state management
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

// Canvas dimensions
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Physics constants
export const GRAVITY = new THREE.Vector3(0, -0.015, 0);
export const PLAYER_SPEED = 0.05;
export const PLAYER_JUMP_POWER = 0.3;
export const FRICTION = 0.85;
export const AIR_RESISTANCE = 0.94;

// Portal colors
export const PORTAL_BLUE = 0x0099ff;
export const PORTAL_ORANGE = 0xff6600;

// Game state object
export const gameState = {
    // Core game state
    gamePhase: "START", // "START", "PLAYING", "PAUSED", "GAME_OVER_WIN", "GAME_OVER_LOSE"
    controlMode: "HUMAN", // "HUMAN", "TEST_1", "TEST_2"
    
    // Three.js core
    scene: null,
    camera: null,
    renderer: null,
    
    // Game container
    gameContainer: null,
    
    // Lighting
    lights: [],
    ambientLight: null,
    directionalLight: null,
    
    // Player
    player: null,
    
    // Entities
    entities: [],
    platforms: [],
    portalSurfaces: [],
    collectibles: [],
    
    // Portals
    bluePortal: null,
    orangePortal: null,
    
    // Camera state
    cameraOffset: new THREE.Vector3(0, 3, 8),
    cameraRotation: { yaw: 0, pitch: 0.3 },
    
    // Physics
    gravity: GRAVITY.clone(),
    
    // Level state
    currentLevel: 1,
    maxLevels: 3,
    exitDoor: null,
    
    // Score
    score: 0,
    
    // Performance tracking
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0,
    
    // Input state
    keys: {},
    mouseX: 0,
    mouseY: 0,
    
    // Test mode state
    testTimer: 0,
    testStep: 0
};

// Initialize logs (write-only)
export const logs = {
    game_info: [],
    player_info: [],
    inputs: []
};

// Expose logs globally
if (typeof window !== 'undefined') {
    window.logs = logs;
}

// Expose getGameState function
export function getGameState() {
    return gameState;
}

if (typeof window !== 'undefined') {
    window.getGameState = getGameState;
}

// Log helper functions
export function logGameInfo(status, data = {}) {
    logs.game_info.push({
        game_status: status,
        data: data,
        framecount: gameState.frameCount,
        timestamp: Date.now()
    });
}

export function logInput(inputType, key, keyCode) {
    logs.inputs.push({
        input_type: inputType,
        data: { key, keyCode },
        framecount: gameState.frameCount,
        timestamp: Date.now()
    });
}

export function logPlayerInfo(player) {
    if (!player || !player.mesh) return;
    
    const screenPos = player.mesh.position.clone().project(gameState.camera);
    logs.player_info.push({
        screen_x: (screenPos.x + 1) * CANVAS_WIDTH / 2,
        screen_y: (1 - screenPos.y) * CANVAS_HEIGHT / 2,
        game_x: player.mesh.position.x,
        game_y: player.mesh.position.y,
        game_z: player.mesh.position.z,
        framecount: gameState.frameCount,
        timestamp: Date.now()
    });
}