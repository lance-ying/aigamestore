import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';

// Game Constants
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const PHYSICS = {
    GRAVITY: 1.5,
    TIMESTEP: 1000 / 60,
    VELOCITY_ITERATIONS: 6,
    POSITION_ITERATIONS: 4
};

export const GAME_CONFIG = {
    PLAYER_RADIUS: 15,
    PLAYER_SPEED_X: 3.5,
    JUMP_FORCE: 0.045,
    HOOP_SPACING: 350,
    HOOP_GAP_HEIGHT: 100, // Not used for this type, but good for pipe games
    HOOP_RADIUS: 40,      // Radius of the hoop opening
    GROUND_HEIGHT: 50
};

// Global Game State
export const gameState = {
    // Core P5 & Matter objects
    p5: null,
    engine: null,
    world: null,

    // State flags
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN", // HUMAN

    // Entities
    player: null,
    hoops: [],
    particles: [], // For effects like confetti or trail
    ground: null,
    ceiling: null,

    // Game Progress
    score: 0,
    highScore: 0,
    distance: 0,
    nextHoopIndex: 0,
    bounces: 1, // Remaining ground bounces (Modified: starts at 1)
    
    // Camera
    camera: {
        x: 0,
        y: 0,
        zoom: 1
    },

    // Time tracking
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0,
    
    // Auto-restart logic
    autoRestartScheduled: false,
    autoRestartTimerId: null,

    // Debug
    debug: false
};

// Expose globally
export function getGameState() {
    return gameState;
}
window.getGameState = getGameState;
window.setControlMode = (mode) => {
    gameState.controlMode = mode;
    console.log(`Control Mode set to: ${mode}`);
};