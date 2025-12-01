/**
 * Global constants and state management for Tiny Gliders.
 */

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Game constants
export const WORLD_GRAVITY = 1.5; // Matter.js scaled gravity
export const DIVE_FORCE = 0.003; // Force applied when diving
export const GLIDE_LIFT = -0.0005; // Slight lift when gliding fast
export const FRICTION_AIR = 0.01;
export const FRICTION_GROUND = 0.00; // No friction for sliding
export const DAY_DURATION = 60 * 60; // Frames (60 seconds)

export const COLORS = {
    skyStart: [135, 206, 235], // Day
    skyEnd: [25, 25, 112],     // Night
    hill: [34, 139, 34],
    hillHighlight: [50, 205, 50],
    player: [255, 69, 0],
    sun: [255, 215, 0],
    coin: [255, 223, 0],
    text: [255, 255, 255]
};

export const gameState = {
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN",
    
    // Matter.js
    engine: null,
    world: null,
    
    // Entities
    player: null,
    entities: [],
    coins: [],
    
    // Terrain
    terrainBodies: [], // Physics bodies for terrain
    terrainVertices: [], // Visual vertices for smooth drawing
    lastTerrainX: 0,
    
    // Camera
    cameraX: 0,
    cameraY: 0,
    cameraOffset: { x: 150, y: 0 },
    
    // Game Status
    score: 0,
    distance: 0,
    timeRemaining: DAY_DURATION,
    sunPosition: { x: 0, y: 0 },
    
    // Input state
    isDiving: false,
    
    // Time tracking
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0
};

export function getGameState() {
    return gameState;
}

// Expose globally
window.getGameState = getGameState;