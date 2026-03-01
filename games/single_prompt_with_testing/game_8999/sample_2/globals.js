import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const FPS = 60;
export const GRAVITY = 25.0; // Gravity strength
export const PLAYER_SPEED = 5.0;
export const JUMP_FORCE = 10.0;
export const WORLD_SIZE = 64; // Size of the generated chunk area (x and z)
export const WORLD_HEIGHT = 32;

// Block Types
export const BLOCKS = {
    AIR: 0,
    DIRT: 1,
    STONE: 2,
    WOOD: 3,
    BRICK: 4,
    LEAF: 5
};

export const TOOL_NAMES = [
    "DIRT BLOCK",
    "STONE BLOCK",
    "WOOD BLOCK",
    "BRICK BLOCK",
    "LEAF BLOCK",
    "REMOVER (PICKAXE)"
];

// Global Game State
export const gameState = {
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN",
    frameCount: 0,
    deltaTime: 0,
    time: 0,
    
    // Core Three.js
    scene: null,
    camera: null,
    renderer: null,
    gameContainer: null,
    
    // Game Entities
    player: null,
    voxelWorld: null,
    
    // Tools
    selectedToolIndex: 0,
    
    // Raycasting
    raycaster: new THREE.Raycaster(),
    highlightMesh: null, // Selection box
    targetBlock: null, // {x, y, z}
    placePosition: null, // {x, y, z}
    
    // Lights
    sunLight: null,
    ambientLight: null,
    
    // Input State
    keys: {}
};

// Initialize Logging
window.logs = {
    game_info: [],
    player_info: [],
    inputs: []
};

// Expose Game State
export function getGameState() {
    return gameState;
}
window.getGameState = getGameState;