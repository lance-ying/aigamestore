import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

// Global Game Configuration
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const FOV = 60;
export const ASPECT_RATIO = CANVAS_WIDTH / CANVAS_HEIGHT;
export const NEAR_PLANE = 0.1;
export const FAR_PLANE = 1000;

// Physics Constants
export const GRAVITY = new THREE.Vector3(0, -0.025, 0); // Tuned for platformer feel
export const TERMINAL_VELOCITY = -1.0;
export const AIR_RESISTANCE = 0.99;
export const GROUND_FRICTION = 0.92;
export const BOUNCE_RESTITUTION = 0.4;
export const PLAYER_RADIUS = 0.5;
export const PLAYER_MASS = 1.0;
export const GRAPPLE_RANGE = 15.0;
export const GRAPPLE_STRENGTH = 0.04;

// Game State Management
export const gameState = {
    // Phase control
    gamePhase: "START", // "START", "PLAYING", "PAUSED", "GAME_OVER_WIN", "GAME_OVER_LOSE"
    controlMode: "HUMAN", // "HUMAN" or "TEST_X"
    
    // Core Three.js components
    scene: null,
    camera: null,
    renderer: null,
    gameContainer: null,
    
    // Lighting
    lights: [],
    ambientLight: null,
    directionalLight: null,
    
    // Entities and Physics
    player: null,
    entities: [],      // All dynamic objects
    platforms: [],     // Static/Crumbling platforms
    grapplePoints: [], // Points to swing from
    particles: [],     // Visual effects
    collisionPairs: [],
    
    // Camera Logic
    cameraTarget: null,
    cameraOffset: new THREE.Vector3(0, 4, 8),
    currentCameraPosition: new THREE.Vector3(0, 5, 10),
    cameraShake: 0,
    
    // Game Progression
    score: 0,
    levelLength: 200, // Z distance to finish
    frameCount: 0,
    deltaTime: 0,
    lastFrameTime: 0,
    
    // Debug/Logging
    logs: {
        game_info: [],
        player_info: [],
        inputs: []
    }
};

// Global accessor as required
window.getGameState = () => gameState;

// Initialization helper for logs
export function initLogs() {
    gameState.logs = {
        game_info: [],
        player_info: [],
        inputs: []
    };
    window.logs = gameState.logs; // Expose globally as required
}