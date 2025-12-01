export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GRAVITY = 0.6;
export const FRICTION = 0.8;
export const ACCELERATION = 0.5;
export const MAX_SPEED = 6;
export const JUMP_FORCE = -14;

export const GAME_PHASES = {
    START: "START",
    PLAYING: "PLAYING",
    PAUSED: "PAUSED",
    LEVEL_COMPLETE: "LEVEL_COMPLETE",
    GAME_OVER_WIN: "GAME_OVER_WIN",
    GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const gameState = {
    gamePhase: GAME_PHASES.START,
    controlMode: "HUMAN",
    
    // Level state
    currentLevel: 1,
    maxLevels: 5,
    levelData: null,
    
    // World state
    worldWidth: 2000,
    cameraX: 0,
    cameraY: 0,
    
    // Entities
    player: null,
    entities: [], // All active entities (enemies, items, projectiles)
    platforms: [],
    particles: [],
    
    // Player Stats
    score: 0,
    
    // Performance
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0,
    
    // Inputs
    keys: {}
};

export function getGameState() {
    return gameState;
}

// Make accessible globally
window.getGameState = getGameState;