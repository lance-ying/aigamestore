export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const GROUND_Y = 350;

export const gameState = {
    player: null,
    boss: null,
    entities: [],
    projectiles: [],
    particles: [],
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN",
    
    score: 0,
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0,
    
    // Physics constants
    gravity: 0.8,
    friction: 0.85,
    groundFriction: 0.8,
    airResistance: 0.98,
    
    // Visual FX state
    screenShake: 0,
    filmGrainOffset: 0
};

export function getGameState() {
    return gameState;
}

// Expose globally
window.getGameState = getGameState;

export const COLORS = {
    BACKGROUND: [230, 220, 190], // Vintage paper
    PLAYER: {
        HEAD: [240, 240, 240], // White cup
        LIQUID: [255, 255, 255], // Milk?
        STRAW: [200, 40, 40], // Red
        SHOES: [130, 70, 30], // Brown
        SHORTS: [200, 40, 40] // Red
    },
    BOSS: {
        SKIN: [180, 60, 60], // Radish Red
        LEAVES: [60, 140, 60], // Green
        DIRT: [100, 80, 50] // Brown
    },
    PROJECTILE_PLAYER: [50, 150, 255], // Blue energy
    PROJECTILE_BOSS: [200, 100, 100], // Red energy
    TEXT: [30, 30, 30] // Dark ink
};