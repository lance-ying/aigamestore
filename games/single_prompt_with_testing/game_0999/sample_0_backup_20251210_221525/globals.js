import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Game State Object
export const gameState = {
    // Core state
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN", // HUMAN, TEST_1, etc.
    frameCount: 0,
    deltaTime: 0,
    lastFrameTime: 0,
    
    // Rendering
    scene: null,
    camera: null,
    renderer: null,
    gameContainer: null,
    
    // Entities
    player: null,
    entities: [],
    enemies: [], // Bots
    platforms: [], // Static geometry
    obstacles: [], // Dynamic hazards
    particles: [], // Visual effects
    
    // Physics & World
    gravity: new THREE.Vector3(0, -35.0, 0), // Strong gravity for platformer feel
    killPlaneY: -20,
    checkpoints: [],
    
    // Game Logic
    score: 0,
    qualificationLimit: 15,
    qualifiedCount: 0,
    elapsedTime: 0,
    
    // Camera settings
    cameraOffset: new THREE.Vector3(0, 8, 12),
    cameraTarget: new THREE.Vector3(),
    
    // Input state snapshot (for replays or debugging)
    inputState: {
        up: false,
        down: false,
        left: false,
        right: false,
        jump: false,
        dive: false
    }
};

// Expose globally
window.getGameState = () => gameState;

// Logging system
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

export function logPlayerInfo() {
    if (!gameState.player) return;
    
    // Project 3D position to 2D screen space for logs
    const vec = gameState.player.mesh.position.clone();
    vec.project(gameState.camera);
    
    const screenX = (vec.x * 0.5 + 0.5) * CANVAS_WIDTH;
    const screenY = (-(vec.y * 0.5) + 0.5) * CANVAS_HEIGHT;

    logs.player_info.push({
        game_x: gameState.player.mesh.position.x,
        game_y: gameState.player.mesh.position.y,
        game_z: gameState.player.mesh.position.z,
        screen_x: screenX,
        screen_y: screenY,
        velocity_y: gameState.player.velocity.y,
        grounded: gameState.player.onGround,
        state: gameState.player.state,
        framecount: gameState.frameCount,
        timestamp: Date.now()
    });
}