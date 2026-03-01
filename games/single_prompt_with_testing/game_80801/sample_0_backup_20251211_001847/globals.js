import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

// Game Configuration
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;

// Game Colors (Neon/Vibrant Palette)
export const COLORS = {
    RED: 0xFF0055,
    BLUE: 0x0088FF,
    GREEN: 0x00FF66,
    YELLOW: 0xFFDD00,
    WHITE: 0xFFFFFF,
    BLACK: 0x111111,
    GRAY: 0x333333,
    TRACK: 0x222222
};

// Physics & Gameplay Constants
export const LANE_WIDTH = 2.5;
export const MAX_LANES = 3; // -1 (Left), 0 (Center), 1 (Right)
export const GRAVITY = -0.5;
export const PLAYER_SPEED_BASE = 15.0;
export const PLAYER_ACCELERATION = 0.05;
export const MAX_SPEED = 30.0;
export const JUMP_FORCE = 0.2;
export const STRAFE_SPEED = 0.2; // Lerp factor

// Dimensions
export const PLAYER_RADIUS = 0.5;
export const ORB_RADIUS = 0.5;
export const RAMP_WIDTH = 2.0;
export const RAMP_LENGTH = 3.0;
export const RAMP_HEIGHT = 0.5;

// Global State
export const gameState = {
    // Phase
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2

    // Three.js Core
    scene: null,
    camera: null,
    renderer: null,
    gameContainer: null,

    // Lighting
    lights: [],
    ambientLight: null,
    directionalLight: null,

    // Entities
    player: null,
    entities: [], // Generic list for updates
    
    // World Objects (Separate lists for collision optimization)
    orbs: [], 
    ramps: [],
    trackSegments: [],
    particles: [],

    // Gameplay State
    score: 0,
    speed: PLAYER_SPEED_BASE,
    distance: 0,
    currentColor: COLORS.RED, // Current active color state
    
    // Camera State
    cameraOffset: new THREE.Vector3(0, 4, 6),
    cameraShake: 0,
    
    // Performance / Time
    frameCount: 0,
    deltaTime: 0,
    lastTime: 0,

    // Testing AI State
    aiTargetLane: 0,
    aiReactionTimer: 0
};

// Logger
export const logs = {
    game_info: [],
    player_info: [],
    inputs: []
};

// Expose to window for debugging/hard constraints
window.gameInstance = gameState;
window.logs = logs;

export function getGameState() {
    return gameState;
}
window.getGameState = getGameState;

export function logGameInfo(info) {
    logs.game_info.push({
        ...info,
        framecount: gameState.frameCount,
        timestamp: Date.now()
    });
}