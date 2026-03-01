import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

// Game Constants
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;
export const TIME_STEP = 1 / TARGET_FPS;

// Physics Constants
export const GRAVITY = -9.8;
export const CAR_ACCELERATION = 15.0;
export const CAR_MAX_SPEED = 30.0;
export const CAR_TURN_SPEED = 2.5;
export const CAR_FRICTION = 0.98;
export const CAR_BRAKE_FORCE = 30.0;
export const CAR_REVERSE_SPEED = 10.0;

// Game World Constants
export const TOWN_SIZE = 200;
export const BUILDING_COUNT = 15;
export const TREE_COUNT = 100;
export const MYSTERY_THRESHOLD_1 = 3; // Deliveries to trigger level 1 weirdness
export const MYSTERY_THRESHOLD_2 = 6; // Level 2
export const MYSTERY_THRESHOLD_3 = 9; // Level 3

// Initial Game State
export const gameState = {
    // Core state
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2, etc.
    
    // Time tracking
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0,
    
    // Core Three.js objects
    scene: null,
    camera: null,
    renderer: null,
    gameContainer: null,
    
    // Lighting
    ambientLight: null,
    directionalLight: null,
    fog: null,
    
    // Entities
    player: null, // The car
    buildings: [],
    trees: [],
    roads: [],
    interactables: [], // Pickup/Delivery zones
    mysteryEntities: [], // Watchers/Ghosts
    
    // Gameplay data
    score: 0,
    money: 0,
    deliveriesCompleted: 0,
    hasPackage: false,
    currentObjective: null, // { type: 'PICKUP'|'DELIVER', location: Vector3, name: string }
    fuel: 100,
    
    // Camera state
    cameraMode: "FOLLOW", // FOLLOW, TOP
    cameraOffset: new THREE.Vector3(0, 5, -10),
    cameraLookAt: new THREE.Vector3(0, 0, 0),
    cameraYaw: 0, // Horizontal rotation relative to car
    cameraPitch: 0.3, // Vertical angle (radians)
    cameraDistance: 12,
    
    // World state (for dynamic changes)
    worldState: {
        timeOfDay: 12.0, // 0-24
        fogDensity: 0.02,
        glitchIntensity: 0,
        darknessLevel: 0
    }
};

// Initialize logs for debugging and validation
window.logs = {
    game_info: [],
    player_info: [],
    inputs: []
};

// Global accessor
window.getGameState = () => gameState;

// Logging Helper
export function logGameInfo(infoType, data) {
    if (window.logs[infoType]) {
        window.logs[infoType].push({
            ...data,
            frame: gameState.frameCount,
            timestamp: Date.now()
        });
    }
}