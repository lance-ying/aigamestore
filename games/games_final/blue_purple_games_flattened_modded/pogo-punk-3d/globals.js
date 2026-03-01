import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

// Game Constants
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const GRAVITY = -0.009;
export const TERMINAL_VELOCITY = -0.5;
export const FRICTION = 0.98;
export const AIR_RESISTANCE = 0.995;
export const BOUNCE_FORCE = 0.22; // Reduced from 0.28 (originally 0.45)
export const MAX_CHARGE_FORCE = 0.45; 
export const ROTATION_SPEED = 0.006; 
export const MAX_ROTATION_SPEED = 0.1;
export const CRASH_ANGLE_THRESHOLD = Math.PI / 2.2; 
export const MAX_HORIZONTAL_SPEED = 0.4; // Cap for horizontal movement

// Colors
export const COLORS = {
    SKY: 0x202030,
    GROUND: 0x1a1a25,
    PLAYER_BODY: 0xff3366,
    PLAYER_HEAD: 0xffccaa,
    POGO_STICK: 0x888888,
    POGO_SPRING: 0xcccccc,
    PLATFORM: 0x444455,
    PLATFORM_TOP: 0x555566,
    OBSTACLE: 0xff4444,
    COLLECTIBLE: 0xffdd00,
    GOAL: 0x00ff88,
    PARTICLE: 0xffffff
};

// Global Game State
export const gameState = {
    // Core state
    gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE, LEVEL_COMPLETE
    controlMode: "HUMAN", // HUMAN
    frameCount: 0,
    lastFrameTime: 0,
    deltaTime: 0,
    
    // Entities and Scene
    scene: null,
    camera: null,
    renderer: null,
    gameContainer: null,
    
    // Game Objects
    player: null,
    entities: [], // Generic list for updates
    platforms: [],
    enemies: [],
    collectibles: [],
    particles: [],
    
    // Level State
    score: 0,
    currentLevel: 1,
    levelLength: 0,
    cameraTargetX: 0,
    
    // Testing state (removed)
};

// Logging System
export const logs = {
    game_info: [],
    player_info: [],
    inputs: []
};

// Expose logs and gameState globally
window.logs = logs;

export function getGameState() {
    return gameState;
}
window.getGameState = getGameState;

export function logGameInfo(info) {
    logs.game_info.push({
        ...info,
        framecount: gameState.frameCount,
        timestamp: Date.now()
    });
}

export function logInput(type, key, keyCode) {
    logs.inputs.push({
        input_type: type,
        data: { key, keyCode },
        framecount: gameState.frameCount,
        timestamp: Date.now()
    });
}