// Global constants and state management

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;

// Physics Constants
export const GRAVITY = 0.5;
export const AIR_RESISTANCE = 0.99;
export const FRICTION = 0.5;
export const RESTITUTION = 0.3; // Bounciness
export const PHYSICS_SUBSTEPS = 5; // Stability

// Game Colors
export const COLORS = {
    BACKGROUND: [20, 24, 30],
    TEXT: [240, 240, 240],
    ACCENT: [100, 200, 255],
    TARGET: [255, 215, 0],
    OBSTACLE: [100, 110, 120],
    PLAYER_OBJ: [200, 220, 240],
    SUCCESS: [100, 255, 100],
    DANGER: [255, 100, 100]
};

// Global Game State
export const gameState = {
    // Phase Management
    gamePhase: "START", // START, PLAYING, SIMULATING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    previousPhase: null, // For pausing
    controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2...
    
    // Time
    frameCount: 0,
    deltaTime: 0,
    lastFrameTime: 0,

    // Level Management
    currentLevelIndex: 0,
    levels: [], // Loaded level data
    
    // Gameplay Data
    inputString: "", // What the player types
    spawnX: 50,
    spawnY: 100,
    
    // Physics World
    physicsBodies: [], // All active physical bodies (letters)
    staticBodies: [], // Walls, floors
    targets: [],      // Collectible stars
    particles: [],    // Visual effects
    
    // Scoring
    starsCollected: 0,
    totalStarsInLevel: 0
};

// Expose state globally as required
export function getGameState() {
    return gameState;
}
window.getGameState = getGameState;