import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const gameState = {
    // Phase Management
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN",
    
    // Core Three.js
    scene: null,
    camera: null,
    renderer: null,
    gameContainer: null,
    
    // World & Physics
    gravity: new THREE.Vector3(0, -0.5, 0), // Stronger gravity for snappy feeling
    groundLevel: 0,
    
    // Entities
    player: null,
    gardener: null,
    entities: [],     // All interactive objects (keys, rake, etc)
    staticProps: [], // Fences, trees, etc
    
    // Game Logic
    tasks: [],
    score: 0,
    
    // Input State
    keys: {
        ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false,
        w: false, a: false, s: false, d: false,
        Shift: false,
        " ": false, // Space
        z: false,
        Enter: false,
        Escape: false,
        r: false
    },
    
    // Time
    frameCount: 0,
    deltaTime: 0,
    lastTime: 0,
    
    // Debug/Logging
    logs: {
        game_info: [],
        player_info: [],
        inputs: []
    }
};

// Log Helper
export function logGameInfo(infoType, data) {
    if (!gameState.logs[infoType]) return;
    gameState.logs[infoType].push({
        ...data,
        framecount: gameState.frameCount,
        timestamp: Date.now()
    });
}

// Global accessor
window.getGameState = () => gameState;
window.logs = gameState.logs; // Expose strictly for requirements

// Game Constants
export const COLORS = {
    GOOSE_WHITE: 0xFFFFFF,
    GOOSE_BEAK: 0xFFA500,
    GRASS: 0x7CFC00,
    WATER: 0x00BFFF,
    DIRT: 0x8B4513,
    GARDENER_SHIRT: 0x87CEEB,
    GARDENER_HAT: 0xD2B48C,
    FENCE: 0xDEB887
};

export const ZONES = {
    LAKE: { x: 15, z: 15, radius: 6 },
    PICNIC: { x: -10, z: 10, radius: 4 }
};