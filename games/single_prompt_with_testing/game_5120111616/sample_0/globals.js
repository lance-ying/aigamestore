import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const MATERIALS = {
    ROAD: { id: 1, name: 'Road', color: 0x333333, cost: 200, maxLength: 4, strength: 1.0, type: 'road' },
    WOOD: { id: 2, name: 'Wood', color: 0x8B4513, cost: 100, maxLength: 3, strength: 0.8, type: 'support' },
    STEEL: { id: 3, name: 'Steel', color: 0x8888AA, cost: 400, maxLength: 6, strength: 2.0, type: 'support' },
    SPRING: { id: 4, name: 'Spring', color: 0xFF4444, cost: 150, maxLength: 3, strength: 0.8, type: 'spring' }
};

export const PHYSICS_SETTINGS = {
    GRAVITY: -9.81,
    TIMESTEP: 1/60,
    ITERATIONS: 10,
    DAMPING: 0.99
};

export const gameState = {
    gamePhase: "START", // START, PLAYING, SIMULATING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN",
    
    // Rendering
    scene: null,
    camera: null,
    renderer: null,
    gameContainer: null,
    
    // Lighting
    lights: [],
    
    // Game Data
    currentLevel: 0,
    budget: 10000,
    currentBudget: 10000,
    selectedMaterial: MATERIALS.ROAD,
    
    // Entities
    nodes: [], // Points (joints)
    links: [], // Beams/Springs
    anchors: [], // Fixed points
    vehicle: null,
    
    // Cursor
    cursor: {
        gridPos: new THREE.Vector3(0, 0, 0), // Grid coordinates
        worldPos: new THREE.Vector3(0, 0, 0), // Actual world coordinates
        mesh: null,
        activeNode: null, // Node currently being hovered
        startNode: null, // Node where dragging started
        snapDistance: 0.5
    },
    
    // Simulation state
    simTime: 0,
    
    // Stats
    frameCount: 0,
    deltaTime: 0
};

export function getGameState() {
    return gameState;
}
window.getGameState = getGameState;

// Initialize Logs
export const logs = {
    game_info: [],
    inputs: [],
    player_info: [] // Tracks cursor/camera or vehicle
};
window.logs = logs;