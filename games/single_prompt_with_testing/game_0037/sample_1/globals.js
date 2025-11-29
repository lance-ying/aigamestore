// globals.js - Constants and Game State

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const TILE_SIZE = 40;

// Physics Constants
export const GRAVITY = 0.25;
export const TERMINAL_VELOCITY = 12;
export const FRICTION_GROUND = 0.96;
export const FRICTION_AIR = 0.99;
export const ACCELERATION = 0.15;
export const SKID_DECEL = 0.3; // Deceleration when turning around
export const JUMP_FORCE = -7.5;
export const BOUNCE_FORCE = -5;
export const SPRING_FORCE = -12;
export const SPIN_DASH_SPEED = 12;

// Game State
export const gameState = {
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
    controlMode: "HUMAN",
    
    // Level Data
    levelMap: [],
    levelWidth: 0,
    levelHeight: 0,
    currentLevel: 0,
    
    // Entities
    player: null,
    entities: [], // Enemies, items, etc.
    particles: [],
    
    // Status
    score: 0,
    rings: 0,
    time: 0,
    lives: 3,
    
    // Camera
    cameraX: 0,
    cameraY: 0,
    
    // Performance
    frameCount: 0,
    deltaTime: 0,
    lastFrameTime: 0
};

export function getGameState() {
    return gameState;
}

window.getGameState = getGameState;