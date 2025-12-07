import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const TILE_SIZE = 10;
export const LANE_WIDTH = 2.5;
export const PLAYER_SPEED_INITIAL = 12.0; // Units per second
export const GRAVITY = -40.0;
export const JUMP_FORCE = 15.0;

export const gameState = {
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2, etc.
    
    // Core Three.js
    scene: null,
    camera: null,
    renderer: null,
    gameContainer: null,
    
    // Game Objects
    player: null,
    pathManager: null,
    entities: [], // Obstacles, coins
    
    // State
    score: 0,
    coins: 0,
    distance: 0,
    speed: PLAYER_SPEED_INITIAL,
    frameCount: 0,
    deltaTime: 0,
    
    // Camera State
    cameraOffset: new THREE.Vector3(0, 6, 8),
    cameraLookAtOffset: new THREE.Vector3(0, 2, -5),
    
    // Logging
    logs: {
        game_info: [],
        player_info: [],
        inputs: []
    }
};

export function getGameState() {
    return gameState;
}
window.getGameState = getGameState;

// Log helper
export function logGameEvent(type, data) {
    if (gameState.logs[type]) {
        gameState.logs[type].push({
            ...data,
            framecount: gameState.frameCount,
            timestamp: Date.now()
        });
    }
}