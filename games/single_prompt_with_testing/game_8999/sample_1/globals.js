import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const WORLD_SIZE = 32; // Size of the voxel world (32x32)
export const WORLD_HEIGHT = 16;
export const BLOCK_SIZE = 1;

// Block IDs
export const BLOCKS = {
    AIR: 0,
    DIRT: 1,
    GRASS: 2,
    STONE: 3,
    WOOD: 4,
    LEAVES: 5,
    BEDROCK: 6
};

// Colors for fallback or debugging
export const BLOCK_COLORS = {
    [BLOCKS.DIRT]: 0x8B4513,
    [BLOCKS.GRASS]: 0x55aa55,
    [BLOCKS.STONE]: 0x777777,
    [BLOCKS.WOOD]: 0x654321,
    [BLOCKS.LEAVES]: 0x228b22,
    [BLOCKS.BEDROCK]: 0x222222
};

export const gameState = {
    // Core
    scene: null,
    camera: null,
    renderer: null,
    gameContainer: null,
    
    // State
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN",
    frameCount: 0,
    deltaTime: 0,
    lastTime: 0,
    
    // Entities
    player: null,
    entities: [], // Enemies, particles, etc.
    
    // World
    worldData: null, // 3D array or Map storing block IDs
    chunks: {},      // Mesh chunks management
    
    // Lighting
    sunLight: null,
    ambientLight: null,
    
    // Physics
    gravity: new THREE.Vector3(0, -18.0, 0), // Stronger gravity for snappy feel
    
    // Game Logic
    score: 0,
    dayTime: 0, // 0 to 1
    
    // Instance management for rendering
    instancedMeshes: {}, // Map of BlockID -> InstancedMesh
    blockUpdatesNeeded: true
};

// Initialize logs array
window.logs = {
    game_info: [],
    player_info: [],
    inputs: []
};

export function getGameState() {
    return gameState;
}

window.getGameState = getGameState;