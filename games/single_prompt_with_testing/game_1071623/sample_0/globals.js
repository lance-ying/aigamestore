export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const gameState = {
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2, TEST_3
    
    // Entities
    player: null,
    platforms: [],
    hazards: [], // Sawblades, Spikes
    enemies: [],
    particles: [],
    goal: null, // Bandage Girl / Nugget
    
    // Camera
    cameraX: 0,
    cameraY: 0,
    worldWidth: 3000,
    worldHeight: 600,
    shake: 0,
    
    // Score/Stats
    score: 0,
    deaths: 0,
    level: 1,
    
    // Time
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0,
    
    // Physics Constants
    gravity: 0.6,
    friction: 0.8,
    airResistance: 0.95
};

export function getGameState() {
    return gameState;
}

// Expose globally
window.getGameState = getGameState;

export const COLORS = {
    bg: [30, 30, 35],
    meat: [200, 30, 30],
    bandage: [255, 150, 180],
    platform: [50, 50, 60],
    hazard: [150, 150, 160],
    enemy: [80, 40, 40],
    glass: [200, 240, 255, 100],
    blood: [180, 0, 0],
    ui: [255, 255, 255]
};