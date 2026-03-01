import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

// Global Game Configuration
export const CONFIG = {
    CANVAS_WIDTH: 600,
    CANVAS_HEIGHT: 400,
    GRAVITY_STRENGTH: 0.15, // Strength of gravity (Reduced from 0.25)
    MAX_TILT: Math.PI / 8, // Maximum tilt angle (22.5 degrees)
    TILT_SPEED: 0.05, // How fast the stage tilts
    TILT_RETURN_SPEED: 0.03, // How fast stage returns to neutral
    BALL_RADIUS: 0.5,
    BALL_MASS: 1.0,
    WALL_HEIGHT: 1.0,
    LEVEL_SEGMENT_SIZE: 10,
    SHADOW_MAP_SIZE: 2048,
    COLORS: {
        BACKGROUND: 0x87CEEB, // Sky Blue
        BALL: 0xFF5722, // Deep Orange
        FLOOR: 0xEEEEEE, // Off White
        WALL: 0x607D8B, // Blue Grey
        GOAL: 0x4CAF50, // Green
        HOLE: 0x212121  // Dark Grey
    }
};

// Global Game State
export const gameState = {
    // Phase Management
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2
    
    // Core Systems
    scene: null,
    camera: null,
    renderer: null,
    gameContainer: null,
    
    // Level & Entities
    worldContainer: null, // The object that tilts
    player: null,
    levelObjects: [], // Array of collision boxes (floors, walls)
    goal: null, // Goal zone definition
    
    // Physics State
    currentTilt: new THREE.Vector2(0, 0), // X (Pitch), Y (Roll)
    gravityVector: new THREE.Vector3(0, -1, 0),
    
    // Game Progress
    levelIndex: 1,
    score: 0,
    
    // Time
    deltaTime: 0,
    frameCount: 0,
    timeElapsed: 0
};

// Logging System
export const logs = {
    game_info: [],
    player_info: [],
    inputs: []
};

// Expose to window for constraints
window.getGameState = () => gameState;
window.gameInstance = gameState;
window.logs = logs;

// Helper to push game info logs
export function logGameInfo(status, data = {}) {
    logs.game_info.push({
        game_status: status,
        data: data,
        framecount: gameState.frameCount,
        timestamp: Date.now()
    });
}